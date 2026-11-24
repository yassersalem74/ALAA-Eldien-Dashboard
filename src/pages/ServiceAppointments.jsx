import { useCallback, useMemo, useState } from 'react'
import { createServicesApi, recurrences } from '../api/services'
import DataTable from '../components/DataTable'
import formatAmount from '../components/formatAmount'
import ServiceBookingEditor from '../components/ServiceBookingEditor'
import { ServiceDialog, ServiceField, ServiceFilters, ServiceMutation } from '../components/ServiceControls'
import { PageHeading, StatusBadge } from '../components/UI'
import useApiData from '../hooks/useApiData'

const titles = { appointments: 'Appointments', subscriptions: 'Subscriptions', occurrences: 'Occurrences' }
const actionLabels = {
  Accepted: 'Accept', Rejected: 'Reject', InProgress: 'Start', Cancelled: 'Cancel booking', Completed: 'Complete', Rescheduled: 'Reschedule',
}
const appointmentActions = {
  customer: { pending: ['Cancelled'], accepted: ['Rescheduled'], inprogress: ['Completed'] },
  partner: { pending: ['Accepted', 'Rejected'], accepted: ['InProgress'] },
}
const subscriptionActions = { customer: { pending: ['Cancelled'] }, partner: { pending: ['Accepted', 'Rejected'] } }
const occurrenceActions = { customer: { inprogress: ['Completed'] }, partner: {} }
const actionFlows = { appointments: appointmentActions, subscriptions: subscriptionActions, occurrences: occurrenceActions }
const pageSize = 10
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' })

function displayDate(value) {
  const date = new Date(value ?? '')
  return Number.isFinite(date.getTime()) ? dateFormat.format(date) : '—'
}

function BookingAction({ api, kind, action, booking, onClose, onSaved }) {
  if (action === 'Rescheduled') return <ServiceBookingEditor api={api} kind={kind} booking={booking} onClose={onClose} onSaved={onSaved} />
  const completing = action === 'Completed'
  async function submit(data) {
    if (completing) {
      await api.complete(kind, booking.id, {
        star: Number(data.get('star')),
        details: data.get('details').trim() || null,
        feedback: data.get('feedback').trim() || null,
        concurrencyStamp: booking.concurrencyStamp ?? null,
      })
    } else if (kind === 'subscriptions') {
      await api.changeSubscription(booking.id, { status: action, packageSubscriptionConcurrencyStamp: booking.concurrencyStamp ?? null })
    } else {
      await api.changeAppointment(booking.id, action, booking.securityStamp)
    }
    onSaved('Booking updated.')
  }
  return (
    <ServiceMutation title={`${actionLabels[action]} · ${booking.title || booking.id}`} action={actionLabels[action]}
      danger={action === 'Cancelled' || action === 'Rejected'} onClose={onClose} onSubmit={submit}>
      {completing ? <>
        <ServiceField label="Rating"><input className="field" type="number" min="1" max="5" defaultValue="3" name="star" required /></ServiceField>
        <ServiceField label="Details"><textarea className="field" name="details" rows="2" /></ServiceField>
        <ServiceField label="Feedback"><textarea className="field" name="feedback" rows="2" /></ServiceField>
      </> : <p className="text-sm text-slate-700">Confirm this change for <strong>{booking.title || booking.id}</strong>.</p>}
    </ServiceMutation>
  )
}

function BookingDetails({ row, actions, onAction, onClose }) {
  return (
    <ServiceDialog title={row.title || 'Booking information'} onClose={onClose}>
      <dl className="mb-5 divide-y divide-slate-100 text-sm">
        {[
          ['Booking ID', row.id], ['Customer', row.customer], ['Partner', row.partner],
          ['Date', displayDate(row.date)], ['Time', [row.from, row.to].filter(Boolean).join(' – ')], ['Status', row.status],
          ['Recurrence', row.recurrence],
        ].filter(([, value]) => value != null && value !== '').map(([label, value]) => (
          <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-2">
            <dt className="text-slate-500">{label}</dt><dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {actions.length > 0 && row.id != null && <div className="flex flex-wrap gap-2">
        {actions.map(action => <button type="button" className="btn-secondary" key={action} onClick={() => onAction(action)}>{actionLabels[action]}</button>)}
      </div>}
    </ServiceDialog>
  )
}

export default function ServiceAppointments({ request, kind = 'appointments', partner = false }) {
  const api = useMemo(() => createServicesApi(request), [request])
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ ByMe: String(!partner) })
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const load = useCallback(signal => api.listBookings(kind, { page, pageSize, ...filters }, { signal, language: filters.language }), [api, kind, page, filters])
  const bookings = useApiData(load)
  const columns = [
    { key: 'title', label: 'Booking', render: row => <span className="font-semibold text-[#172b46]">{row.title || row.id || '—'}</span> },
    { key: 'customer', label: 'Customer' },
    { key: 'partner', label: 'Partner' },
    { key: 'date', label: 'Schedule', render: row => <div>{displayDate(row.date)}{row.from && <p className="mt-1 text-xs text-slate-500">{[row.from, row.to].filter(Boolean).join(' – ')}</p>}</div> },
    { key: 'price', label: 'Total', render: row => formatAmount(row.price, row.currency === 'EGY' ? 'EGP' : row.currency) },
    { key: 'status', label: 'Status', render: row => row.status ? <StatusBadge status={row.status} /> : '—' },
    { key: 'actions', label: 'Actions', render: row => <button type="button" className="btn-secondary" onClick={() => setDialog({ row })}>View details</button> },
  ]
  const actor = filters.ByMe === 'true' ? 'customer' : 'partner'
  const status = String(dialog?.row.status ?? '').replace(/[^a-z]/gi, '').toLowerCase()
  const actions = actionFlows[kind][actor][status] ?? []
  return (
    <>
      <PageHeading eyebrow="SERVICES" title={titles[kind]} description="Bookings associated with your signed-in account." />
      <ServiceFilters api={api} minPrice="minTotalPrice" maxPrice="maxTotalPrice" onApply={values => { setFilters(values); setPage(1) }}>
        <ServiceField label="Booking scope"><select className="field" name="ByMe" defaultValue={String(!partner)}><option value="true">Booked by me</option><option value="false">Booked with me</option></select></ServiceField>
        {kind === 'subscriptions' && <ServiceField label="Recurrence"><select className="field" name="recurrence"><option value="">All recurrences</option>{recurrences.map(item => <option key={item}>{item}</option>)}</select></ServiceField>}
        {kind === 'appointments' && <ServiceField label="Language"><select className="field" name="language"><option value="en">English</option><option value="ar">Arabic</option></select></ServiceField>}
      </ServiceFilters>
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
      <DataTable title={titles[kind]} columns={columns} rows={bookings.data?.rows} controls={false} showDetails={false}
        loading={bookings.loading} error={bookings.error?.message} onRetry={bookings.reload}
        pageSize={bookings.data?.pageSize ?? pageSize} pagination={{ page, total: bookings.data?.total, hasNext: bookings.data?.hasNext, onChange: setPage }}
        emptyMessage={`No ${titles[kind].toLowerCase()} found.`} />
      {dialog?.action ? (
        <BookingAction api={api} kind={kind} booking={dialog.row} action={dialog.action} onClose={() => setDialog(null)}
          onSaved={message => { setNotice(message); bookings.reload() }} />
      ) : dialog && <BookingDetails row={dialog.row} actions={actions} onClose={() => setDialog(null)}
        onAction={action => setDialog({ ...dialog, action })} />}
    </>
  )
}
