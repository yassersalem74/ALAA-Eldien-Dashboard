import { useCallback, useMemo, useState } from 'react'
import { createServicesApi } from '../api/services'
import DataTable from '../components/DataTable'
import Icon from '../components/Icon'
import { ServiceDialog, ServiceField, ServiceMutation, ServiceResourceError } from '../components/ServiceControls'
import { PageHeading } from '../components/UI'
import useApiData from '../hooks/useApiData'

function NameDialog({ api, dialog, onClose, onSaved }) {
  const row = dialog.row
  const loadArabic = useCallback(async signal => {
    const matches = await api.getNames('ar', '', { signal, language: 'ar' })
    return matches.find(item => String(item.id) === String(row.id))
  }, [api, row])
  const arabic = useApiData(loadArabic, dialog.mode === 'edit' && !row?.nameAr)
  if (arabic.loading || arabic.error) {
    return <ServiceDialog title="Edit service name" onClose={onClose}><ServiceResourceError resource={arabic} /></ServiceDialog>
  }
  if (dialog.mode === 'delete') {
    return <ServiceMutation title="Delete service name?" action="Delete" danger onClose={onClose} onSubmit={async () => {
      await api.deleteName(row.id)
      onSaved('Service name deleted.')
    }}>
      <p className="text-sm">Delete <strong>{row.name}</strong>?</p>
    </ServiceMutation>
  }
  return (
    <ServiceMutation title={row ? 'Edit service name' : 'Add service name'} onClose={onClose} onSubmit={async data => {
      const nameEn = data.get('nameEn').trim()
      if (!nameEn) throw new Error('Enter an English name.')
      await api.saveName(row?.id, {
        nameEn, nameAr: data.get('nameAr').trim() || null,
        ...(row && { concurrencyStamp: row.concurrencyStamp ?? null }),
      })
      onSaved(row ? 'Service name updated.' : 'Service name added.')
    }}>
      <ServiceField label="English name"><input className="field" name="nameEn" defaultValue={row?.nameEn ?? row?.name} required /></ServiceField>
      <ServiceField label="Arabic name"><input className="field" name="nameAr" dir="auto" lang="ar" defaultValue={row?.nameAr ?? arabic.data?.nameAr ?? arabic.data?.name} /></ServiceField>
    </ServiceMutation>
  )
}

export default function ServiceNames({ request }) {
  const api = useMemo(() => createServicesApi(request), [request])
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const load = useCallback(signal => api.getNames('en', query, { signal }), [api, query])
  const names = useApiData(load)
  const columns = [
    { key: 'name', label: 'English name', render: row => <span className="font-semibold text-[#172b46]">{row.nameEn || row.name}</span> },
    { key: 'nameAr', label: 'Arabic name', render: row => <span lang="ar" dir="auto">{row.nameAr || '—'}</span> },
    { key: 'actions', label: 'Actions', render: row => row.id != null && <div className="flex items-center gap-2">
      <button type="button" className="btn-secondary" onClick={() => setDialog({ mode: 'edit', row })}>Edit</button>
      <button type="button" className="btn-secondary !text-red-700" onClick={() => setDialog({ mode: 'delete', row })}>Delete</button>
    </div> },
  ]
  return (
    <>
      <PageHeading eyebrow="SERVICES" title="Service names">
        <button type="button" className="btn-primary" onClick={() => setDialog({ mode: 'new' })}><Icon name="plus" size={16} /> Add service name</button>
      </PageHeading>
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
      <DataTable key={query} title="Service name list" columns={columns} rows={names.data} showDetails={false} loading={names.loading}
        error={names.error?.message} onRetry={names.reload} emptyMessage={query ? 'No service names match this search.' : 'No service names found.'}
        controls={<form role="search" className="flex gap-2" onSubmit={event => {
          event.preventDefault()
          setQuery(new FormData(event.currentTarget).get('search').trim())
        }}>
          <input type="search" className="field w-40" aria-label="Search service names" name="search" defaultValue={query} />
          <button type="submit" className="btn-secondary"><Icon name="search" size={15} /> Search</button>
        </form>} />
      {dialog && <NameDialog api={api} dialog={dialog} onClose={() => setDialog(null)} onSaved={message => { setNotice(message); names.reload() }} />}
    </>
  )
}
