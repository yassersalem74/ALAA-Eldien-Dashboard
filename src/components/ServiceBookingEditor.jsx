import { useCallback, useState } from 'react'
import useApiData from '../hooks/useApiData'
import { LocationFields, ServiceField, ServiceMutation, ServiceResourceError } from './ServiceControls'

function ScheduleFields({ api, serviceId, initialDate, singleTime }) {
  const [date, setDate] = useState(initialDate?.slice(0, 10) ?? '')
  const [selection, setSelection] = useState('')
  const load = useCallback(signal => api.getAvailability(serviceId, date, { signal }), [api, serviceId, date])
  const availability = useApiData(load, Boolean(serviceId && date && !singleTime))
  const slot = availability.data?.[selection === '' ? -1 : Number(selection)]
  return (
    <>
      <ServiceField label="Date"><input type="date" className="field" name="date" required value={date} onChange={event => {
        setDate(event.target.value)
        setSelection('')
      }} /></ServiceField>
      {serviceId && !singleTime ? (
        <>
          <ServiceField label="Available time slots">
            <select className="field" value={selection} required onChange={event => setSelection(event.target.value)}>
              <option value="">{availability.data?.length === 0 ? 'No slots on this date' : 'Choose a time slot'}</option>
              {availability.data?.map(({ from, to }, index) => <option key={`${from}-${to}-${index}`} value={index}>{from} – {to}</option>)}
            </select>
          </ServiceField>
          <ServiceResourceError resource={availability} />
          <input type="hidden" name="from" value={slot?.from ?? ''} />
          <input type="hidden" name="to" value={slot?.to ?? ''} />
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ServiceField label="From"><input type="time" className="field" name="from" required /></ServiceField>
          {!singleTime && <ServiceField label="To"><input type="time" className="field" name="to" required /></ServiceField>}
        </div>
      )}
    </>
  )
}

export default function ServiceBookingEditor({ api, kind, listing, booking, onClose, onSaved }) {
  const subscribe = kind === 'packages'
  const action = booking ? 'Reschedule appointment' : subscribe ? 'Subscribe to package' : 'Book appointment'
  const location = listing && { ...listing, neighborhoodIds: [] }
  async function submit(data) {
    const date = data.get('date')
    const from = data.get('from')
    const to = data.get('to')
    if (!from || (!subscribe && !to)) throw new Error('Choose a time slot or enter the booking times.')
    if (!subscribe && !listing && !booking.serviceId && from >= to) throw new Error('Enter an end time after the start time.')
    if (booking) {
      await api.reschedule(booking.id, { date, from, to, concurrencyStamp: booking.concurrencyStamp ?? null })
    } else {
      const common = { from, itemIds: data.getAll('itemIds'), neighborhoodId: data.get('neighborhoodId') || null }
      if (subscribe) {
        await api.subscribe(listing.id, { ...common, startDate: date, packageConcurrencyStamp: listing.concurrencyStamp ?? null })
      } else {
        await api.bookAppointment(listing.id, { ...common, date, to, concurrencyStamp: listing.concurrencyStamp ?? null })
      }
    }
    onSaved(booking ? 'Appointment rescheduled.' : subscribe ? 'Package subscription submitted.' : 'Appointment booked.')
  }

  return (
    <ServiceMutation title={action} action={action} onClose={onClose} onSubmit={submit}>
      <ScheduleFields api={api} singleTime={subscribe} serviceId={listing?.id ?? booking?.serviceId} initialDate={booking?.date} />
      {listing && <div className="grid gap-3 sm:grid-cols-2"><LocationFields api={api} initial={location} /></div>}
      {listing?.items?.some(item => item.id) && <fieldset className="grid gap-2">
        <legend className="mb-2 text-xs font-semibold">Service items</legend>
        {listing.items.filter(item => item.id).map(item => (
          <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="itemIds" value={item.id} /> {item.name}</label>
        ))}
      </fieldset>}
    </ServiceMutation>
  )
}
