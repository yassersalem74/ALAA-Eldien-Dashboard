import { useCallback, useEffect, useRef, useState } from 'react'
import useApiData from '../hooks/useApiData'
import Icon from './Icon'

export function ServiceDialog({ title, onClose, busy = false, children }) {
  const ref = useRef(null)
  useEffect(() => { ref.current.showModal() }, [])
  return (
    <dialog ref={ref} className="modal" aria-label={title} onCancel={event => {
      event.preventDefault()
      if (!busy) onClose()
    }}>
      <div className="modal-box w-11/12 max-w-2xl rounded-xl bg-white p-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#172b46]">{title}</h2>
          <button type="button" className="icon-button" disabled={busy} onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

export function ServiceMutation({ title, onClose, onSubmit, action = 'Save', danger, children, closeOnSuccess = true }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <ServiceDialog title={title} onClose={onClose} busy={busy}>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault()
        if (busy) return
        const data = new FormData(event.currentTarget)
        setBusy(true)
        setError('')
        try {
          await onSubmit(data)
          if (closeOnSuccess) onClose()
          else setBusy(false)
        } catch (failure) {
          setError(failure.message)
          setBusy(false)
        }
      }}>
        <fieldset disabled={busy} className="grid gap-4">{children}</fieldset>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn-primary ${danger ? '!bg-red-700' : ''}`} disabled={busy}>{busy ? 'Saving…' : action}</button>
        </div>
      </form>
    </ServiceDialog>
  )
}

export function ServiceField({ label, children }) {
  return <label className="grid min-w-0 gap-2 text-xs font-medium text-slate-700">{label}{children}</label>
}

export function ServiceResourceError({ resource }) {
  if (resource.loading) return <p role="status" className="text-xs text-slate-600">Loading…</p>
  if (!resource.error) return null
  return <div className="flex flex-wrap items-center gap-2">
    <p role="alert" className="text-xs text-red-700">{resource.error.message}</p>
    <button type="button" className="btn-secondary" onClick={resource.reload}>Retry</button>
  </div>
}

export function LocationFields({ api, language = 'en', initial, multiple = false }) {
  const [governorate, setGovernorate] = useState(String(initial?.governorateId ?? ''))
  const [neighborhoods, setNeighborhoods] = useState((initial?.neighborhoodIds ?? []).map(String))
  const loadGovernors = useCallback(signal => api.getGovernorates(language, { signal }), [api, language])
  const loadNeighborhoods = useCallback(signal => api.getNeighborhoods(governorate, language, { signal }), [api, governorate, language])
  const governors = useApiData(loadGovernors)
  const districts = useApiData(loadNeighborhoods, Boolean(governorate))
  return (
    <>
      <ServiceField label="Governorate">
        <select className="field" name="governorateId" value={governorate} onChange={event => {
          setGovernorate(event.target.value)
          setNeighborhoods([])
        }}>
          <option value="">Choose a governorate</option>
          {governorate && !governors.data?.some(row => String(row.id) === governorate) && <option value={governorate}>{initial?.governorate || governorate}</option>}
          {governors.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </ServiceField>
      <ServiceField label={multiple ? 'Neighborhoods' : 'Neighborhood'}>
        <select className="field" name={multiple ? 'neighborhoodIds' : 'neighborhoodId'} multiple={multiple}
          disabled={!governorate} value={multiple ? neighborhoods : neighborhoods[0] ?? ''}
          onChange={event => setNeighborhoods(Array.from(event.target.selectedOptions, option => option.value).filter(Boolean))}>
          {!multiple && <option value="">Choose a neighborhood</option>}
          {neighborhoods.filter(id => !districts.data?.some(row => String(row.id) === id)).map(id => <option key={id} value={id}>{initial?.neighborhoods?.find(row => String(row.id) === id)?.name || id}</option>)}
          {districts.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </ServiceField>
      <ServiceResourceError resource={governors} />
      <ServiceResourceError resource={districts} />
    </>
  )
}

export function ServiceFilters({ api, onApply, children, minPrice, maxPrice }) {
  const [locations, setLocations] = useState(false)
  return (
    <form role="search" className="mb-4 flex flex-wrap items-end gap-2" onSubmit={event => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(event.currentTarget))
      onApply(Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.trim()])))
    }}>
      <ServiceField label="Search"><input type="search" className="field w-40" name="search" /></ServiceField>
      {children}
      <button type="button" className="btn-secondary" aria-expanded={locations} onClick={() => setLocations(value => !value)}>
        Price and location <Icon name="chevronDown" size={14} />
      </button>
      <button type="submit" className="btn-secondary"><Icon name="search" size={15} /> Apply filters</button>
      {locations && <div className="panel flex w-full flex-wrap items-end gap-3 p-4">
        <ServiceField label="Minimum price"><input type="number" min="0" step="any" className="field w-32" name={minPrice} /></ServiceField>
        <ServiceField label="Maximum price"><input type="number" min="0" step="any" className="field w-32" name={maxPrice} /></ServiceField>
        <LocationFields api={api} />
      </div>}
    </form>
  )
}
