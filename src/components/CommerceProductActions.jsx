import { useCallback, useState } from 'react'
import useApiData from '../hooks/useApiData'
import CommerceProductEditor from './CommerceProductEditor'
import formatAmount from './formatAmount'
import { LocationFields, ServiceDialog, ServiceField, ServiceMutation, ServiceResourceError } from './ServiceControls'
import { TableThumbnail } from './UI'

function displayAttribute(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object' && value != null) return JSON.stringify(value)
  return String(value ?? '')
}

function ProductRatings({ api, product, account, onClose }) {
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  const load = useCallback(signal => api.getRatings(product.id, { signal }), [api, product.id])
  const ratings = useApiData(load)
  const mine = ratings.data?.find(row => row.isMine || (account?.id != null && row.userId != null && String(account.id) === String(row.userId)))
  if (editing) {
    return (
      <ServiceMutation title={mine ? 'Edit my rating' : 'Rate product'} onClose={() => setEditing(false)} onSubmit={async data => {
        await api.saveRating(product.id, {
          rating: Number(data.get('rating')), feedback: data.get('feedback').trim() || null,
          ...(mine && { concurrencyStamp: mine.concurrencyStamp ?? null }),
        }, Boolean(mine))
        setNotice('Your rating was saved.')
        ratings.reload()
      }}>
        <ServiceField label="Rating"><input name="rating" className="field" type="number" min="1" max="5" defaultValue={mine?.rating ?? 5} required /></ServiceField>
        <ServiceField label="Feedback"><textarea name="feedback" className="field" rows={3} defaultValue={mine?.feedback} /></ServiceField>
      </ServiceMutation>
    )
  }
  return (
    <ServiceDialog title="Product ratings" onClose={onClose}>
      {notice && <p className="mb-3 text-sm text-emerald-700" role="status">{notice}</p>}
      <ServiceResourceError resource={ratings} />
      {ratings.data?.length === 0 && <p className="text-sm text-slate-600">No ratings yet.</p>}
      <ul className="divide-y divide-slate-100">
        {ratings.data?.map((row, index) => (
          <li key={row.id ?? index} className="py-3 text-sm">
            <div className="flex justify-between gap-3"><span className="font-semibold">{row.user || 'Customer'}</span><span>{row.rating ?? '—'} / 5</span></div>
            {row.feedback && <p className="mt-1 break-words text-slate-600">{row.feedback}</p>}
          </li>
        ))}
      </ul>
      {ratings.data && <button type="button" className="btn-primary mt-4" onClick={() => setEditing(true)}>{mine ? 'Edit my rating' : 'Rate product'}</button>}
    </ServiceDialog>
  )
}

function ProductOrder({ api, locationApi, product, onClose, onSaved }) {
  const [items, setItems] = useState([product])
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const load = useCallback(signal => api.getProducts({ page: 1, pageSize: 10, search }, { signal }), [api, search])
  const matches = useApiData(load, Boolean(search))
  const available = matches.data?.rows.filter(row => row.id != null && row.quantity !== 0 && !items.some(item => String(item.id) === String(row.id))) ?? []

  async function submit(data) {
    if (!String(data.get('neighborhoodId') ?? '')) throw new Error('Choose a delivery neighborhood.')
    const lines = await Promise.all(items.map(async (item, index) => {
      const details = item.concurrencyStamp ? item : await api.getProduct(item.id)
      return {
        productId: item.id,
        productConcurrencyStamp: details.concurrencyStamp ?? null,
        quantity: Number(data.get(`quantity-${index}`)),
      }
    }))
    const details = Object.fromEntries(['paymentMethod', 'neighborhoodId', 'street', 'apartment', 'floor', 'building', 'addressDetails']
      .map(key => [key, String(data.get(key) ?? '').trim() || null]))
    if (!details.street || !details.paymentMethod) throw new Error('Enter the street address and payment method.')
    await api.createOrder({ ...details, items: lines })
    onSaved('Order placed. View it in Customer orders.')
  }

  return (
    <ServiceMutation title="Create customer order" action="Place order" onClose={onClose} onSubmit={submit}>
      <fieldset className="grid gap-3 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-700">Order items</legend>
        {items.map((item, index) => <div key={item.id} className="flex flex-wrap items-end gap-3">
          <span className="min-w-32 flex-1 pb-2 text-sm">{item.name || item.id}</span>
          <ServiceField label="Quantity"><input name={`quantity-${index}`} className="field w-24" type="number" min="1"
            max={item.quantity > 0 ? item.quantity : undefined} defaultValue="1" required /></ServiceField>
          {items.length > 1 && <button type="button" className="btn-secondary" onClick={() => setItems(value => value.filter(row => row.id !== item.id))}>Remove</button>}
        </div>)}
        <div className="flex flex-wrap items-end gap-2">
          <ServiceField label="Find another product"><input type="search" className="field" value={draftSearch} onChange={event => setDraftSearch(event.target.value)} /></ServiceField>
          <button type="button" className="btn-secondary" onClick={() => setSearch(draftSearch.trim())}>Find</button>
        </div>
        <ServiceResourceError resource={matches} />
        {matches.data && <ServiceField label="Matching products">
          <select className="field" value="" onChange={event => {
            const row = available.find(item => String(item.id) === event.target.value)
            if (row) setItems(value => [...value, row])
          }}>
            <option value="">{available.length ? 'Choose a product to add' : 'No additional matches'}</option>
            {available.map(item => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}
          </select>
        </ServiceField>}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <LocationFields api={locationApi} />
        <ServiceField label="Payment method"><input className="field" name="paymentMethod" defaultValue="CashOnDelivery" required /></ServiceField>
        <ServiceField label="Street"><input className="field" name="street" required /></ServiceField>
        <ServiceField label="Building"><input className="field" name="building" /></ServiceField>
        <ServiceField label="Floor"><input className="field" name="floor" /></ServiceField>
        <ServiceField label="Apartment"><input className="field" name="apartment" /></ServiceField>
      </div>
      <ServiceField label="Delivery instructions"><textarea className="field" name="addressDetails" rows={2} /></ServiceField>
    </ServiceMutation>
  )
}

export default function CommerceProductActions({ api, locationApi, selection, account, onClose, onSaved }) {
  const [mode, setMode] = useState(selection.mode)
  const load = useCallback(signal => api.getProduct(selection.row.id, { signal }), [api, selection])
  const resource = useApiData(load, selection.row?.id != null)
  if (resource.loading || resource.error) {
    return <ServiceDialog title="Product details" onClose={onClose}><ServiceResourceError resource={resource} /></ServiceDialog>
  }
  const product = resource.data && {
    ...selection.row,
    ...Object.fromEntries(Object.entries(resource.data).filter(([, value]) => value != null)),
  }
  if (mode === 'edit') return <CommerceProductEditor api={api} product={product} onClose={onClose} onSaved={onSaved} />
  if (mode === 'ratings') return <ProductRatings api={api} product={product} account={account} onClose={() => setMode('view')} />
  if (mode === 'order') return <ProductOrder api={api} locationApi={locationApi} product={product} onClose={onClose} onSaved={onSaved} />
  if (mode === 'delete') {
    return <ServiceMutation title="Delete product?" action="Delete" danger onClose={onClose} onSubmit={async () => {
      await api.deleteProduct(product.id)
      onSaved('Product deleted.')
    }}><p className="text-sm">Delete <strong>{product.name || 'this product'}</strong>?</p></ServiceMutation>
  }
  const items = [
    ['Category', product.category], ['Subcategory', product.subcategory],
    ['Price', formatAmount(product.price, product.currency === 'EGY' ? 'EGP' : product.currency)],
    ['Stock', product.quantity], ['Description', product.description],
    ...Object.entries(product.values).map(([key, value]) => [key, displayAttribute(value)]),
  ]
  return (
    <ServiceDialog title={product.name || 'Product details'} onClose={onClose}>
      <div className="mb-3 flex flex-wrap gap-2"><TableThumbnail image={product.image} /></div>
      <dl className="divide-y divide-slate-100 text-sm">
        {items.filter(([, value]) => value != null && value !== '').map(([key, value], index) => (
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2" key={`${key}-${index}`}>
            <dt className="text-slate-500">{key}</dt><dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => setMode('edit')}>Edit product</button>
        <button type="button" className="btn-secondary" onClick={() => setMode('ratings')}>Ratings</button>
        <button type="button" className="btn-secondary" disabled={Number(product.quantity) === 0} onClick={() => setMode('order')}>Create order</button>
        <button type="button" className="btn-secondary !text-red-700" onClick={() => setMode('delete')}>Delete</button>
      </div>
    </ServiceDialog>
  )
}
