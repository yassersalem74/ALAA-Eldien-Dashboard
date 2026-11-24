import { useCallback, useMemo, useState } from 'react'
import { categoryRows, createMarketplaceApi } from '../api/marketplace'
import DataTable from '../components/DataTable'
import Icon from '../components/Icon'
import { PageHeading, TableThumbnail } from '../components/UI'
import formatAmount from '../components/formatAmount'
import useMarketplaceData from '../hooks/useMarketplaceData'

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

export default function Marketplace({ request }) {
  const api = useMemo(() => createMarketplaceApi(request), [request])
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const loadCategories = useCallback(async signal => categoryRows(await api.getCategories({ signal })), [api])
  const loadSubcategories = useCallback(async signal => categoryRows(await api.getSubcategories(categoryId, { signal }), true), [api, categoryId])
  const loadProducts = useCallback(signal => api.getProducts({
    page, pageSize, categoryId, subcategoryId, search,
  }, { signal }), [api, page, categoryId, subcategoryId, search])
  const categories = useMarketplaceData(loadCategories)
  const subcategories = useMarketplaceData(loadSubcategories, Boolean(categoryId))
  const products = useMarketplaceData(loadProducts)
  const rows = products.data?.rows.map(row => ({
    ...row,
    category: row.category ?? categories.data?.find(category => category.id === String(row.categoryId))?.name,
    subcategory: row.subcategory ?? subcategories.data?.find(subcategory => subcategory.id === String(row.subcategoryId))?.name,
  }))

  return (
    <>
      <PageHeading eyebrow="MARKETPLACE" title="Products" description="Browse the products listed in the marketplace." />
      <DataTable title="Product catalog" rows={rows} columns={columns} pageSize={products.data?.pageSize ?? pageSize} showDetails={false}
        loading={products.loading} error={products.error?.message} onRetry={products.reload}
        emptyMessage={search || categoryId ? 'No products match these filters.' : 'No marketplace products yet.'}
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
            <form className="flex items-center gap-2" role="search" onSubmit={event => {
              event.preventDefault()
              const value = new FormData(event.currentTarget).get('search').trim()
              setSearch(value)
              setPage(1)
            }}>
              <input className="field w-36 sm:w-44" name="search" type="search" placeholder="Search products" aria-label="Search products" />
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
    </>
  )
}
