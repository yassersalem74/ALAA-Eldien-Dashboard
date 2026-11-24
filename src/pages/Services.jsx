import { useCallback, useMemo, useState } from 'react'
import { createServicesApi, recurrences, serviceCategories, serviceRoles } from '../api/services'
import DataTable from '../components/DataTable'
import formatAmount from '../components/formatAmount'
import Icon from '../components/Icon'
import ServiceBookingEditor from '../components/ServiceBookingEditor'
import { ServiceDialog, ServiceField, ServiceFilters, ServiceMutation, ServiceResourceError } from '../components/ServiceControls'
import ServiceListingEditor from '../components/ServiceListingEditor'
import { PageHeading, TableThumbnail } from '../components/UI'
import useApiData from '../hooks/useApiData'

const pageSize = 10

function ListingDialog({ api, current, kind, language, onClose, onSaved }) {
  const [mode, setMode] = useState(current.mode)
  const item = current.row
  const isPackage = kind === 'packages'
  const entity = isPackage ? 'package' : 'service'
  const load = useCallback(signal => api.getService(item.id, language, { signal, language }), [api, item, language])
  const needsDetails = item?.id != null && !isPackage && current.mode !== 'delete'
  const detail = useApiData(load, needsDetails)
  if (detail.loading || detail.error) {
    return <ServiceDialog title={`View ${entity}`} onClose={onClose}><ServiceResourceError resource={detail} /></ServiceDialog>
  }
  const listing = detail.data ? { ...detail.data, id: detail.data.id ?? item.id } : item
  const name = listing?.name || item?.name || entity
  if (mode === 'edit') return <ServiceListingEditor api={api} kind={kind} listing={listing} onClose={onClose} onSaved={onSaved} />
  if (mode === 'book') return <ServiceBookingEditor api={api} kind={kind} listing={listing} onClose={onClose} onSaved={onSaved} />
  if (mode === 'delete') {
    return <ServiceMutation title={`Delete ${entity}?`} action="Delete" danger onClose={onClose} onSubmit={async () => {
      await api.deleteListing(kind, listing.id)
      onSaved(`The ${entity} was deleted.`)
    }}>
      <p className="text-sm">Delete <strong>{name}</strong>?</p>
    </ServiceMutation>
  }
  const info = [
    ['Category', serviceCategories[listing.category] ?? listing.category], ['Provider', listing.provider],
    ['Price', formatAmount(listing.price, listing.currency === 'EGY' ? 'EGP' : listing.currency)],
    ['Duration', listing.duration != null && `${listing.duration} minutes`],
    ['Governorate', listing.governorate], ['Recurrence', listing.recurrence], ['Occurrences', listing.totalOccurrences],
    ['Description', listing.description], ['Additional description', listing.subDescription],
  ]
  return (
    <ServiceDialog title={name} onClose={onClose}>
      <dl className="divide-y divide-slate-100">
        {info.filter(([, value]) => value != null && value !== false && value !== '').map(([label, value]) =>
          <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-2 text-sm">
            <dt className="text-slate-500">{label}</dt><dd className="break-words">{value}</dd>
          </div>
        )}
      </dl>
      {listing.items?.length > 0 && <ul aria-label="Service items" className="my-4 grid gap-2 text-sm text-slate-700">
        {listing.items.map((entry, index) => <li key={entry.id ?? index}>{entry.name} · {formatAmount(entry.price, listing.currency === 'EGY' ? 'EGP' : listing.currency)}</li>)}
      </ul>}
      {listing.images?.length > 0 && <div className="my-4 flex flex-wrap gap-2">
        {listing.images.map((url, index) => <img src={url} alt="" key={`${url}-${index}`} className="size-20 rounded-lg object-cover" />)}
      </div>}
      {listing.id != null && <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => setMode('book')}>{isPackage ? 'Subscribe' : 'Check availability and book'}</button>
        <button type="button" className="btn-secondary" onClick={() => setMode('edit')}>Edit</button>
        <button type="button" className="btn-secondary !text-red-700" onClick={() => setMode('delete')}>Delete</button>
      </div>}
    </ServiceDialog>
  )
}

export default function Services({ request, kind = 'services' }) {
  const api = useMemo(() => createServicesApi(request), [request])
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ language: 'en' })
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const load = useCallback(signal => api.listListings(kind, { page, pageSize, ...filters }, { signal, language: filters.language }), [api, kind, page, filters])
  const listings = useApiData(load)
  const isPackage = kind === 'packages'
  const entity = isPackage ? 'package' : 'service'
  const columns = [
    {
      key: 'name', label: isPackage ? 'Package' : 'Service',
      render: row => <div className="flex items-center gap-3"><TableThumbnail image={row.images[0]} /><span className="font-semibold text-[#172b46]">{row.name || `Unnamed ${entity}`}</span></div>,
    },
    { key: 'category', label: 'Category', render: row => serviceCategories[row.category] ?? row.category ?? '—' },
    { key: 'provider', label: 'Provider' },
    { key: 'price', label: 'Price', render: row => formatAmount(row.price, row.currency === 'EGY' ? 'EGP' : row.currency) },
    { key: 'duration', label: 'Duration', render: row => row.duration == null ? '—' : `${row.duration} min` },
    ...(isPackage ? [{ key: 'recurrence', label: 'Recurrence' }, { key: 'totalOccurrences', label: 'Occurrences' }] : []),
    { key: 'actions', label: 'Actions', render: row => <button type="button" className="btn-secondary" onClick={() => setDialog({ mode: 'view', row })}>View details</button> },
  ]
  return (
    <>
      <PageHeading eyebrow="SERVICES" title={isPackage ? 'Packages' : 'Services'}>
        <button type="button" className="btn-primary" onClick={() => setDialog({ mode: 'edit' })}><Icon name="plus" size={16} /> Add {entity}</button>
      </PageHeading>
      <ServiceFilters api={api} onApply={values => { setFilters(values); setPage(1) }}
        minPrice={isPackage ? 'minServicePrice' : 'minPrice'} maxPrice={isPackage ? 'maxServicePrice' : 'maxPrice'}>
        {isPackage ? <ServiceField label="Recurrence"><select className="field" name="recurrence">
          <option value="">All recurrences</option>{recurrences.map(item => <option key={item}>{item}</option>)}
        </select></ServiceField> : <>
          <ServiceField label="Category"><select className="field" name="category">
            <option value="">All categories</option>{Object.entries(serviceCategories).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select></ServiceField>
          <ServiceField label="Provider role"><select className="field" name="role">
            <option value="">All roles</option>{serviceRoles.map(item => <option key={item}>{item}</option>)}
          </select></ServiceField>
        </>}
        <ServiceField label="Listings"><select className="field" name="isMine"><option value="">All listings</option><option value="true">My listings</option></select></ServiceField>
        <ServiceField label="Language"><select className="field" name="language"><option value="en">English</option><option value="ar">Arabic</option></select></ServiceField>
      </ServiceFilters>
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
      <DataTable title={isPackage ? 'Package list' : 'Service list'} rows={listings.data?.rows} columns={columns} controls={false} showDetails={false}
        loading={listings.loading} error={listings.error?.message} onRetry={listings.reload}
        pageSize={listings.data?.pageSize ?? pageSize} pagination={{ page, total: listings.data?.total, hasNext: listings.data?.hasNext, onChange: setPage }}
        emptyMessage={isPackage ? 'No packages found.' : 'No services found.'} />
      {dialog && <ListingDialog current={dialog} api={api} language={filters.language} kind={kind} onClose={() => setDialog(null)}
        onSaved={message => { setNotice(message); listings.reload() }} />}
    </>
  )
}
