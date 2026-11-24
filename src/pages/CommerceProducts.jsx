import { useCallback, useMemo, useState } from 'react'
import { categoryRows, createCommerceApi } from '../api/commerce'
import { createServicesApi } from '../api/services'
import CommerceProductActions from '../components/CommerceProductActions'
import DataTable from '../components/DataTable'
import Icon from '../components/Icon'
import { PageHeading, TableThumbnail } from '../components/UI'
import formatAmount from '../components/formatAmount'
import useApiData from '../hooks/useApiData'

const pageSize = 10
const columns = [
  {
    key: 'name', label: 'Product',
    render: row => (
      <div className="flex items-center gap-3">
        <TableThumbnail image={row.image} />
        <div className="min-w-0">
          <p className="max-w-64 whitespace-normal break-words font-semibold text-[#172b46]">{row.name || 'Unnamed product'}</p>
          {row.id != null && <p className="mt-1 max-w-48 truncate text-[11px] text-slate-500" title={String(row.id)}>{row.id}</p>}
        </div>
      </div>
    ),
  },
  { key: 'category', label: 'Category' },
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'price', label: 'Price', render: row => formatAmount(row.price, row.currency) },
  { key: 'quantity', label: 'Quantity' },
]

export default function CommerceProducts({ request, salesChannel, account }) {
  const api = useMemo(() => createCommerceApi(request, salesChannel), [request, salesChannel])
  const locationApi = useMemo(() => createServicesApi(request), [request])
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState(null)
  const [notice, setNotice] = useState('')

  const loadCategories = useCallback(async signal => categoryRows(await api.getCategories({ signal })), [api])
  const loadSubcategories = useCallback(async signal => categoryRows(await api.getSubcategories(categoryId, { signal }), true), [api, categoryId])
  const loadProducts = useCallback(signal => api.getProducts({
    page, pageSize, categoryId, subcategoryId, ...filters,
  }, { signal }), [api, page, categoryId, subcategoryId, filters])
  const categories = useApiData(loadCategories)
  const subcategories = useApiData(loadSubcategories, Boolean(categoryId))
  const products = useApiData(loadProducts)
  const rows = products.data?.rows.map(row => ({
    ...row,
    category: row.category ?? categories.data?.find(category => category.id === String(row.categoryId))?.name,
    subcategory: row.subcategory ?? subcategories.data?.find(subcategory => subcategory.id === String(row.subcategoryId))?.name,
  }))
  const actions = {
    key: 'actions', label: 'Actions', render: row => row.id != null && <button className="btn-secondary" type="button"
      onClick={() => setSelection({ mode: 'view', row })}>View details</button>,
  }

  return (
    <>
      <PageHeading eyebrow={salesChannel.toUpperCase()} title="Products">
        <button className="btn-primary" type="button" onClick={() => setSelection({ mode: 'edit' })}><Icon name="plus" size={16} /> Add product</button>
      </PageHeading>
      {notice && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800" role="status">{notice}</p>}
      <DataTable title="Product catalog" rows={rows} columns={[...columns, actions]} pageSize={products.data?.pageSize ?? pageSize} showDetails={false}
        loading={products.loading} error={products.error?.message} onRetry={products.reload}
        emptyMessage={Object.values(filters).some(Boolean) || categoryId ? 'No products match these filters.' : `No ${salesChannel} products yet.`}
        pagination={{ page, total: products.data?.total, hasNext: products.data?.hasNext, onChange: setPage }}
        controls={
          <div className="flex flex-wrap items-center gap-2">
            <select className="field max-w-44" aria-label="Filter products by category" value={categoryId} onChange={event => {
              setCategoryId(event.target.value)
              setSubcategoryId('')
              setPage(1)
            }}>
              <option value="">All categories</option>
              {categories.data?.map(row => <option value={row.id} key={row.id}>{row.name}</option>)}
            </select>
            {categoryId && (
              <select className="field max-w-44" aria-label="Filter products by subcategory" value={subcategoryId}
                disabled={subcategories.loading || Boolean(subcategories.error)} onChange={event => {
                  setSubcategoryId(event.target.value)
                  setPage(1)
                }}>
                <option value="">All subcategories</option>
                {subcategories.data?.map(row => <option value={row.id} key={row.id}>{row.name}</option>)}
              </select>
            )}
            <form className="flex flex-wrap items-center gap-2" role="search" onSubmit={event => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              setFilters({ search: data.get('search').trim(), minPrice: data.get('minPrice'), maxPrice: data.get('maxPrice') })
              setPage(1)
            }}>
              <input className="field w-36 sm:w-44" name="search" type="search" placeholder="Search products" aria-label="Search products" />
              <input className="field w-24" type="number" min="0" step="any" name="minPrice" placeholder="Min price" aria-label="Minimum price" />
              <input className="field w-24" type="number" min="0" step="any" name="maxPrice" placeholder="Max price" aria-label="Maximum price" />
              <button className="btn-secondary" type="submit">
                <Icon name="search" size={15} /> Search
              </button>
            </form>
            {(categories.error || subcategories.error) && (
              <button className="btn-secondary" type="button" onClick={categories.error ? categories.reload : subcategories.reload}>
                <Icon name="refresh" size={15} /> Reload {categories.error ? 'categories' : 'subcategories'}
              </button>
            )}
          </div>
        }
      />
      {selection && <CommerceProductActions api={api} locationApi={locationApi} selection={selection} account={account}
        onClose={() => setSelection(null)} onSaved={message => { setNotice(message); products.reload() }} />}
    </>
  )
}
