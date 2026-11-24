import { useCallback, useMemo, useState } from 'react'
import { categoryRows, createCommerceApi } from '../api/commerce'
import DataTable from '../components/DataTable'
import Icon from '../components/Icon'
import { ServiceDialog, ServiceField, ServiceMutation, ServiceResourceError } from '../components/ServiceControls'
import { PageHeading, TableThumbnail } from '../components/UI'
import useApiData from '../hooks/useApiData'

function StoreEditor({ api, store, categories, onClose, onSaved }) {
  const [selected, setSelected] = useState(() => store?.categoryIds?.map(String) ?? [])
  return (
    <ServiceMutation title={store ? 'Edit store' : 'Add store'} onClose={onClose} onSubmit={async data => {
      if (!data.get('name').trim()) throw new Error('Enter a store name.')
      data.set('name', data.get('name').trim())
      if (!data.get('imageFile')?.size) data.delete('imageFile')
      if (store?.concurrencyStamp) data.set('concurrencyStamp', store.concurrencyStamp)
      await api.saveStore(store?.id, data)
      onSaved(store ? 'Store updated.' : 'Store added.')
    }}>
      <ServiceField label="Store name"><input className="field" name="name" defaultValue={store?.name} required /></ServiceField>
      <ServiceField label="Store image"><input type="file" className="field" name="imageFile" accept="image/*" /></ServiceField>
      <ServiceField label="Store categories">
        <select className="field" name="categoryIds" multiple value={selected}
          onChange={event => setSelected(Array.from(event.target.selectedOptions, option => option.value))}>
          {selected.filter(id => !categories.some(row => row.id === id)).map(id => <option key={id} value={id}>{id}</option>)}
          {categories.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </ServiceField>
    </ServiceMutation>
  )
}

function StoreDialog({ api, selected, categories, onClose, onSaved }) {
  const [mode, setMode] = useState(selected.mode)
  const load = useCallback(signal => api.getStore(selected.id, { signal }), [api, selected.id])
  const resource = useApiData(load, selected.id != null)
  const store = resource.data && { ...resource.data, id: resource.data.id ?? (selected.id === 'me' ? undefined : selected.id) }
  if (resource.loading || resource.error) {
    return <ServiceDialog title={selected.id === 'me' ? 'My store' : 'Store information'} onClose={onClose}><ServiceResourceError resource={resource} /></ServiceDialog>
  }
  if (mode === 'delete') {
    return (
      <ServiceMutation title="Delete store?" danger action="Delete" onClose={onClose} onSubmit={async () => {
        await api.deleteStore(store.id)
        onSaved('Store deleted.')
      }}><p className="text-sm">Delete <strong>{store.name}</strong>?</p></ServiceMutation>
    )
  }
  if (mode === 'edit') {
    return <StoreEditor api={api} store={store} categories={categories} onClose={onClose} onSaved={onSaved} />
  }
  if (!store) return <ServiceDialog title={selected.id === 'me' ? 'My store' : 'Store information'} onClose={onClose}>
    <p className="text-sm text-slate-600">No store found.</p>
  </ServiceDialog>
  return (
    <ServiceDialog title={selected.id === 'me' ? 'My store' : (store.name || 'Store information')} onClose={onClose}>
      <div className="mb-4 flex items-center gap-3"><TableThumbnail image={store.image} /><p className="font-semibold text-[#172b46]">{store.name || 'Unnamed store'}</p></div>
      <p className="text-sm text-slate-600">
        Categories {store.categoryNames.length ? store.categoryNames.join(', ') : store.categoryIds.map(id => categories.find(row => row.id === String(id))?.name ?? id).join(', ') || '—'}
      </p>
      {store.id != null && <div className="mt-5 flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => setMode('edit')}>Edit</button>
        <button type="button" className="btn-secondary !text-red-700" onClick={() => setMode('delete')}>Delete</button>
      </div>}
    </ServiceDialog>
  )
}

export default function Stores({ request }) {
  const api = useMemo(() => createCommerceApi(request, 'Store'), [request])
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const loadStores = useCallback(signal => api.getStores({ signal }), [api])
  const loadCategories = useCallback(async signal => categoryRows(await api.getCategories({ signal })), [api])
  const stores = useApiData(loadStores)
  const categories = useApiData(loadCategories)
  const columns = [
    { key: 'name', label: 'Store', render: row => <div className="flex items-center gap-3"><TableThumbnail image={row.image} /><strong>{row.name || 'Unnamed store'}</strong></div> },
    { key: 'categories', label: 'Categories', render: row => row.categoryNames.join(', ') || row.categoryIds.map(id => categories.data?.find(item => item.id === String(id))?.name ?? id).join(', ') || '—' },
    { key: 'actions', label: 'Actions', render: row => row.id != null && <button type="button" className="btn-secondary" onClick={() => setSelected({ mode: 'view', id: row.id })}>View details</button> },
  ]
  return (
    <>
      <PageHeading eyebrow="STORE" title="Stores">
        <button type="button" className="btn-secondary" onClick={() => setSelected({ mode: 'view', id: 'me' })}>My store</button>
        <button type="button" className="btn-primary" onClick={() => setSelected({ mode: 'edit' })}><Icon name="plus" size={16} /> Add store</button>
      </PageHeading>
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
      {categories.error && <div className="mb-4"><ServiceResourceError resource={categories} /></div>}
      <DataTable title="Store directory" rows={stores.data} columns={columns} showDetails={false}
        loading={stores.loading} error={stores.error?.message} onRetry={stores.reload} emptyMessage="No stores found." />
      {selected && <StoreDialog api={api} selected={selected} categories={categories.data ?? []} onClose={() => setSelected(null)}
        onSaved={message => { setNotice(message); stores.reload() }} />}
    </>
  )
}
