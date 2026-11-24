import { useCallback, useMemo, useState } from 'react'
import { createServicesApi } from '../api/services'
import DataTable from '../components/DataTable'
import { ServiceDialog, ServiceField, ServiceMutation, ServiceResourceError } from '../components/ServiceControls'
import { PageHeading } from '../components/UI'
import Icon from '../components/Icon'
import useApiData from '../hooks/useApiData'

function LocationDialog({ api, kind, dialog, parentId, governors, onClose, onSaved }) {
  const row = dialog.row
  const isNeighborhood = kind === 'neighborhoods'
  const label = isNeighborhood ? 'neighborhood' : 'governorate'
  const load = useCallback(async signal => {
    const options = { signal, language: 'ar' }
    const records = isNeighborhood ? await api.getNeighborhoods(parentId, 'ar', options) : await api.getGovernorates('ar', options)
    return records.find(item => String(item.id) === String(row.id))
  }, [api, isNeighborhood, parentId, row])
  const arabic = useApiData(load, dialog.mode === 'edit' && !row.nameAr)
  if (arabic.loading || arabic.error) return <ServiceDialog title={`Edit ${label}`} onClose={onClose}><ServiceResourceError resource={arabic} /></ServiceDialog>
  if (dialog.mode === 'delete') {
    return <ServiceMutation title={`Delete ${label}?`} action="Delete" danger onClose={onClose} onSubmit={async () => {
      await api.deleteLocation(kind, row.id)
      onSaved(`${row.name} was deleted.`)
    }}><p className="text-sm">Delete <strong>{row.name}</strong>?</p></ServiceMutation>
  }
  return (
    <ServiceMutation title={`${row ? 'Edit' : 'Add'} ${label}`} onClose={onClose} onSubmit={async data => {
      const nameEn = data.get('nameEn').trim()
      const nameAr = data.get('nameAr').trim()
      if (!nameEn) throw new Error('Enter an English name.')
      await api.saveLocation(kind, row?.id, {
        nameEn, nameAr: nameAr || null, ...(isNeighborhood && { governorateId: data.get('governorateId') }),
        ...(row && { concurrencyStamp: row.concurrencyStamp ?? null }),
      })
      onSaved(`${nameEn} was saved.`)
    }}>
      {isNeighborhood && <ServiceField label="Governorate">
        <select className="field" name="governorateId" defaultValue={parentId} required>
          {governors.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </ServiceField>}
      <ServiceField label="English name"><input className="field" name="nameEn" defaultValue={row?.nameEn ?? row?.name} required /></ServiceField>
      <ServiceField label="Arabic name"><input className="field" name="nameAr" lang="ar" dir="auto" defaultValue={row?.nameAr ?? arabic.data?.nameAr ?? arabic.data?.name} /></ServiceField>
    </ServiceMutation>
  )
}

export default function Locations({ request, kind }) {
  const api = useMemo(() => createServicesApi(request), [request])
  const [parentId, setParentId] = useState('')
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const isNeighborhood = kind === 'neighborhoods'
  const label = isNeighborhood ? 'neighborhood' : 'governorate'
  const title = isNeighborhood ? 'Neighborhoods' : 'Governorates'
  const loadGovernors = useCallback(signal => api.getGovernorates('en', { signal }), [api])
  const loadDistricts = useCallback(signal => api.getNeighborhoods(parentId, 'en', { signal }), [api, parentId])
  const governorates = useApiData(loadGovernors)
  const neighborhoods = useApiData(loadDistricts, isNeighborhood && Boolean(parentId))
  const resource = isNeighborhood && !governorates.error ? neighborhoods : governorates
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'nameAr', label: 'Arabic name', render: row => <span lang="ar" dir="auto">{row.nameAr || '—'}</span> },
    { key: 'actions', label: 'Actions', render: row => row.id != null && <div className="flex gap-2">
      <button type="button" className="btn-secondary" onClick={() => setDialog({ mode: 'edit', row })}>Edit</button>
      <button type="button" className="btn-secondary !text-red-700" onClick={() => setDialog({ mode: 'delete', row })}>Delete</button>
    </div> },
  ]
  return (
    <>
      <PageHeading eyebrow="MANAGEMENT" title={title}>
        <button type="button" className="btn-primary" disabled={isNeighborhood && !parentId} onClick={() => setDialog({ mode: 'new' })}>
          <Icon name="plus" size={16} /> Add {label}
        </button>
      </PageHeading>
      {isNeighborhood && <div className="mb-4 max-w-xs">
        <ServiceField label="Governorate"><select className="field" value={parentId} onChange={event => {
          setParentId(event.target.value)
          setNotice('')
        }} disabled={governorates.loading || Boolean(governorates.error)}>
          <option value="">Choose a governorate</option>
          {governorates.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select></ServiceField>
      </div>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
      <DataTable key={parentId} title={`${label[0].toUpperCase()}${label.slice(1)} list`} rows={resource.error ? [] : resource.data} columns={columns}
        showDetails={false} loading={resource.loading || governorates.loading} error={resource.error?.message} onRetry={resource.reload}
        emptyMessage={isNeighborhood && !parentId ? 'Choose a governorate to view its neighborhoods.' : `No ${title.toLowerCase()} found.`} />
      {dialog && <LocationDialog api={api} kind={kind} dialog={dialog} parentId={parentId} governors={governorates.data ?? []}
        onClose={() => setDialog(null)} onSaved={message => { setNotice(message); resource.reload() }} />}
    </>
  )
}
