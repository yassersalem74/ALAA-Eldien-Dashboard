import { useCallback, useState } from 'react'
import { recurrences, serviceCategories } from '../api/services'
import useApiData from '../hooks/useApiData'
import { LocationFields, ServiceField, ServiceMutation, ServiceResourceError } from './ServiceControls'

const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const inputTime = value => /^\d:\d{2}/.test(value ?? '') ? `0${value.slice(0, 4)}` : value?.slice(0, 5)

function RepeatFields({ schedule, rows, update, title }) {
  return (
    <fieldset className="grid gap-3 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-xs font-semibold text-slate-700">{title}</legend>
      {rows.map((row, index) => (
        <div key={row.key} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          {schedule ? (
            <>
              <ServiceField label="Day"><select className="field" name="day" defaultValue={days.find(day => day.toLowerCase() === row.day?.toLowerCase())}>
                {days.map(day => <option key={day}>{day}</option>)}
              </select></ServiceField>
              <ServiceField label="From"><input type="time" className="field" name="agendaFrom" defaultValue={inputTime(row.from)} required /></ServiceField>
              <ServiceField label="To"><input type="time" className="field" name="agendaTo" defaultValue={inputTime(row.to)} required /></ServiceField>
            </>
          ) : (
            <>
              <input type="hidden" name="itemId" value={row.id ?? ''} />
              <ServiceField label="Item name"><input className="field" name="itemName" defaultValue={row.name} required /></ServiceField>
              <ServiceField label="Item price"><input type="number" step="any" min="0" className="field" name="itemPrice" defaultValue={row.price} required /></ServiceField>
              <ServiceField label="Item description"><input className="field" name="itemDescription" defaultValue={row.description} /></ServiceField>
            </>
          )}
          <button type="button" className="btn-secondary !text-red-700" onClick={() => update(items => items.filter((_, i) => i !== index))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary justify-self-start" onClick={() => update(value => [...value, { key: crypto.randomUUID() }])}>
        {schedule ? 'Add availability' : 'Add item'}
      </button>
    </fieldset>
  )
}

export default function ServiceListingEditor({ api, kind, listing, onClose, onSaved }) {
  const isPackage = kind === 'packages'
  const entity = isPackage ? 'package' : 'service'
  const loadNames = useCallback(signal => api.getNames('en', '', { signal }), [api])
  const names = useApiData(loadNames)
  const [selectedName, setSelectedName] = useState(null)
  const [items, setItems] = useState(() => (listing?.items ?? []).map((item, index) => ({ ...item, key: index })))
  const [agendas, setAgendas] = useState(() => (listing?.agendas ?? []).map((item, index) => ({ ...item, key: index })))
  const [itemsChanged, setItemsChanged] = useState(false)
  const [agendasChanged, setAgendasChanged] = useState(false)

  async function save(data) {
    const payload = new FormData()
    for (const name of ['serviceNameId', 'categoryName', 'price', 'servicePrice', 'currency', 'description', 'subDescription',
      'timeslotDurationInMin', 'serviceDurationInMin', 'recurrence', 'totalOccurrences', 'governorateId', 'neighborhoodIds', 'deletedImages', 'imageFiles']) {
      for (const value of data.getAll(name)) {
        if (value instanceof File ? value.size : value !== '' || name === 'description' || name === 'subDescription') payload.append(name, value)
      }
    }
    if (listing && listing.concurrencyStamp) payload.set('concurrencyStamp', listing.concurrencyStamp)
    if (!listing || listing.items || itemsChanged) {
      const ids = data.getAll('itemId')
      const prices = data.getAll('itemPrice')
      const descriptions = data.getAll('itemDescription')
      const entries = data.getAll('itemName').map((name, index) => ({
        ...(ids[index] && { Id: ids[index] }),
        Name: name.trim(), Price: Number(prices[index]), Description: descriptions[index].trim(),
      }))
      if (entries.some(entry => !entry.Name)) throw new Error('Enter a name for each item.')
      payload.set('itemsJson', JSON.stringify(entries))
    }
    if (!isPackage && (!listing || listing.agendas || agendasChanged)) {
      const from = data.getAll('agendaFrom')
      const to = data.getAll('agendaTo')
      const entries = data.getAll('day').map((day, index) => ({ Day: day, From: from[index], To: to[index] }))
      if (entries.some(entry => entry.From >= entry.To)) throw new Error('Each availability must end after it starts.')
      payload.set('agendasJson', JSON.stringify(entries))
    }
    await api.saveListing(kind, listing?.id, payload)
    onSaved(listing ? 'Changes saved.' : `New ${entity} added.`)
  }

  const nameId = selectedName ?? listing?.serviceNameId ?? names.data?.find(row => row.name === listing?.name)?.id ?? ''
  return (
    <ServiceMutation title={`${listing ? 'Edit' : 'Add'} ${entity}`} onClose={onClose} onSubmit={save}>
      <div className="grid gap-3 sm:grid-cols-2">
        <ServiceField label="Service name">
          <select className="field" name="serviceNameId" value={nameId} onChange={event => setSelectedName(event.target.value)} required>
            <option value="">Choose a service name</option>
            {nameId && !names.data?.some(row => String(row.id) === String(nameId)) && <option value={nameId}>{listing?.name || nameId}</option>}
            {names.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </ServiceField>
        <ServiceField label="Category">
          <select className="field" name="categoryName" defaultValue={listing?.category ?? ''} required>
            <option value="">Choose a category</option>
            {Object.entries(serviceCategories).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
        </ServiceField>
        <ServiceField label="Price"><input type="number" min="0" step="any" className="field" name={isPackage ? 'servicePrice' : 'price'} defaultValue={listing?.price} required /></ServiceField>
        <ServiceField label="Currency"><input className="field" name="currency" defaultValue={listing?.currency ?? 'EGY'} required /></ServiceField>
        <ServiceField label={isPackage ? 'Duration (minutes)' : 'Time slot duration (minutes)'}>
          <input type="number" min="0.01" step="any" className="field" name={isPackage ? 'serviceDurationInMin' : 'timeslotDurationInMin'} defaultValue={listing?.duration} required />
        </ServiceField>
        {isPackage && <>
          <ServiceField label="Recurrence"><select className="field" name="recurrence" defaultValue={listing?.recurrence || 'Monthly'}>
            {recurrences.map(item => <option key={item}>{item}</option>)}
          </select></ServiceField>
          <ServiceField label="Total occurrences"><input type="number" min="1" className="field" name="totalOccurrences" defaultValue={listing?.totalOccurrences} required /></ServiceField>
        </>}
        <LocationFields api={api} initial={listing} multiple />
      </div>
      <ServiceResourceError resource={names} />
      <ServiceField label="Description"><textarea rows="3" className="field" name="description" defaultValue={listing?.description} /></ServiceField>
      {!isPackage && <ServiceField label="Additional description"><textarea rows="2" className="field" name="subDescription" defaultValue={listing?.subDescription} /></ServiceField>}
      <ServiceField label="Upload images"><input type="file" accept="image/*" multiple className="field" name="imageFiles" /></ServiceField>
      {listing?.images?.length > 0 && <fieldset className="grid gap-2">
        <legend className="mb-2 text-xs font-semibold">Existing images</legend>
        {listing.images.map((url, index) => <label className="flex items-center gap-3 text-xs" key={`${url}-${index}`}>
          <img src={url} alt="" className="size-10 rounded object-cover" /><input type="checkbox" name="deletedImages" value={url} /> Remove image {index + 1}
        </label>)}
      </fieldset>}
      <RepeatFields rows={items} title="Service items" update={change => { setItemsChanged(true); setItems(change) }} />
      {!isPackage && <RepeatFields rows={agendas} schedule title="Weekly availability" update={change => { setAgendasChanged(true); setAgendas(change) }} />}
    </ServiceMutation>
  )
}
