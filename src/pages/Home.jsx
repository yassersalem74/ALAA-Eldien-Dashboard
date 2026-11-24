import { useCallback, useMemo } from 'react'
import { createCommerceApi } from '../api/commerce'
import { createServicesApi } from '../api/services'
import { createUsersApi } from '../api/users'
import DataTable from '../components/DataTable'
import formatAmount from '../components/formatAmount'
import Icon from '../components/Icon'
import { PageHeading, StatusBadge } from '../components/UI'
import useApiData from '../hooks/useApiData'

const number = new Intl.NumberFormat('en')
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' })
const categoryStyle = ['bg-[#eef2f8] text-[#284565]', 'bg-[#f6f0e3] text-[#8d6822]', 'bg-[#e9f4ed] text-[#2b6448]', 'bg-[#f0edf8] text-[#62518c]']

function showDate(value) {
  return value && Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) : '—'
}

function OverviewMetric({ label, icon, path, load, index }) {
  const resource = useApiData(load)
  const data = resource.data
  const count = data?.total ?? (data && !data.hasNext ? data.rows.length : undefined)
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#172b46]" role="status">
            {resource.loading ? '…' : count == null ? '—' : number.format(count)}
          </p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${categoryStyle[index]}`}><Icon name={icon} size={19} /></span>
      </div>
      {resource.error ? <div className="mt-3 text-xs text-red-700">
        <p role="alert">{resource.error.message}</p>
        <button className="mt-2 font-semibold underline" type="button" onClick={resource.reload}>Retry</button>
      </div> : data && count == null ? <p className="mt-3 text-xs text-slate-500">{data.rows.length} on the first page</p> : null}
      <a href={path} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#294565]">View {label.toLowerCase()} <Icon name="arrowRight" size={14} /></a>
    </div>
  )
}

const orderColumns = [
  { key: 'number', label: 'Order', render: row => row.number ?? row.id ?? '—' },
  { key: 'customer', label: 'Customer' },
  { key: 'date', label: 'Date', render: row => showDate(row.date) },
  { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, row.currency === 'EGY' ? 'EGP' : row.currency) },
  { key: 'status', label: 'Status', render: row => row.status ? <StatusBadge status={row.status} /> : '—' },
]
const appointmentColumns = [
  { key: 'title', label: 'Appointment', render: row => row.title ?? row.id ?? '—' },
  { key: 'date', label: 'Schedule', render: row => <div>{showDate(row.date)}{row.from && <p className="mt-1 text-xs text-slate-500">{row.from}</p>}</div> },
  { key: 'status', label: 'Status', render: row => row.status ? <StatusBadge status={row.status} /> : '—' },
]

function Activity({ request }) {
  const loadOrders = useCallback(signal => createCommerceApi(request, '').getOrders({ page: 1, pageSize: 6, scope: 'partner' }, { signal }), [request])
  const loadAppointments = useCallback(signal => createServicesApi(request).listBookings('appointments', { page: 1, pageSize: 6, ByMe: false }, { signal }), [request])
  const orders = useApiData(loadOrders)
  const appointments = useApiData(loadAppointments)
  const counts = new Map()
  for (const row of orders.data?.rows ?? []) {
    const status = String(row.status || 'Unknown')
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }
  return (
    <>
      {orders.data?.rows.length > 0 && <section className="panel mb-5 p-5" aria-label="Order statuses">
        <h2 className="text-sm font-semibold text-[#172b46]">Order statuses</h2>
        <p className="mb-4 mt-1 text-xs text-slate-500">Based on {orders.data.rows.length} orders from your partner account.</p>
        <div className="grid gap-x-8 gap-y-3 lg:grid-cols-2">
          {[...counts].map(([status, count]) => <div key={status} className="grid grid-cols-[minmax(80px,1fr)_3fr_2ch] items-center gap-3 text-xs text-slate-600">
            <span>{status.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
            <progress className="progress w-full text-[#294565]" max={orders.data.rows.length} value={count} aria-label={`${status} orders`} />
            <span>{count}</span>
          </div>)}
        </div>
      </section>}
      <div className="grid min-w-0 gap-5 2xl:grid-cols-[1.3fr_1fr]">
        <DataTable title="Partner orders" description="First page from your partner account" columns={orderColumns} rows={orders.data?.rows}
          showDetails={false} loading={orders.loading} error={orders.error?.message} onRetry={orders.reload} emptyMessage="No partner orders found."
          controls={<a className="btn-secondary" href="#/orders">View orders <Icon name="arrowRight" size={14} /></a>} />
        <DataTable title="Partner appointments" description="First page from your partner account" columns={appointmentColumns} rows={appointments.data?.rows}
          showDetails={false} loading={appointments.loading} error={appointments.error?.message} onRetry={appointments.reload} emptyMessage="No partner appointments found."
          controls={<a className="btn-secondary" href="#/appointments?scope=partner">View appointments <Icon name="arrowRight" size={14} /></a>} />
      </div>
    </>
  )
}

export default function Home({ session }) {
  const request = session.request
  const metrics = useMemo(() => {
    const firstPage = { page: 1, pageSize: 10 }
    return [
      { label: 'Services', icon: 'services', path: '#/services', load: signal => createServicesApi(request).listListings('services', firstPage, { signal }) },
      { label: 'Marketplace products', icon: 'marketplace', path: '#/marketplace/products', load: signal => createCommerceApi(request, 'Marketplace').getProducts(firstPage, { signal }) },
      { label: 'Store products', icon: 'store', path: '#/store/products', load: signal => createCommerceApi(request, 'Store').getProducts(firstPage, { signal }) },
      { label: 'Pending companies', icon: 'users', path: '#/users?status=Pending', load: signal => createUsersApi(request).listCompanies({ ...firstPage, status: 'Pending' }, { signal }) },
    ]
  }, [request])
  return (
    <>
      <PageHeading eyebrow="OVERVIEW" title="Dashboard overview" description={`Welcome back, ${session.account.name}.`}>
        <span className="btn-secondary"><Icon name="calendar" size={15} />{dateFormat.format(new Date())}</span>
      </PageHeading>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => <OverviewMetric key={metric.label} {...metric} index={index} />)}
      </div>
      <Activity request={request} />
    </>
  )
}
