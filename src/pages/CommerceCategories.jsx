import { useCallback, useMemo, useState } from 'react'
import { categoryRows, createCommerceApi } from '../api/commerce'
import useCommerceData from '../hooks/useCommerceData'
import DataTable from '../components/DataTable'
import Icon from '../components/Icon'
import { PageHeading, TableThumbnail } from '../components/UI'
import ProductCategoryDialog from '../components/ProductCategoryDialog'
import ProductFormEditor from '../components/ProductFormEditor'

function StatusPanel({ resource, empty, children }) {
  if (resource.loading) return <p role="status" className="panel p-6 text-sm text-slate-600">Loading...</p>
  if (resource.error) return (
    <div className="panel p-6">
      <p role="alert" className="break-words text-sm text-red-700">{resource.error.message}</p>
      <button className="btn-secondary mt-3" type="button" onClick={resource.reload}>
        <Icon name="refresh" size={15} /> Retry
      </button>
    </div>
  )
  if (empty) return <div className="panel p-8 text-center text-sm text-slate-600">{empty}</div>
  return children
}

function CatalogRows({ api, resource, categoryId, parents, categoryFilter, salesChannel, paths }) {
  const [dialog, setDialog] = useState(null)
  const [opening, setOpening] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const isSubcategory = Boolean(parents)
  const kind = isSubcategory ? 'subcategory' : 'category'
  const chooseParent = isSubcategory && !categoryId

  function finish(notice) {
    setMessage(notice)
    resource.reload()
  }

  function openDialog(mode, row = {}) {
    setError('')
    setMessage('')
    setDialog({ mode, row })
  }

  async function edit(row) {
    if (row.nameEn && row.nameAr) {
      openDialog('edit', row)
      return
    }

    setOpening(true)
    setError('')
    try {
      const options = { language: 'ar' }
      const localized = isSubcategory
        ? await api.getSubcategories(row.categoryId, options)
        : await api.getCategories(options)
      const arabic = categoryRows(localized, isSubcategory).find(item => item.id === row.id)
      openDialog('edit', {
        ...row,
        nameEn: row.nameEn || row.name,
        nameAr: row.nameAr || arabic?.nameAr || arabic?.name || '',
      })
    } catch (failure) {
      setError(failure.message)
    } finally {
      setOpening(false)
    }
  }

  const columns = [
    {
      key: 'name', label: isSubcategory ? 'Subcategory' : 'Category',
      render: row => (
        <div className="flex items-center gap-3">
          <TableThumbnail image={row.image} />
          <span className="max-w-64 whitespace-normal break-words font-semibold text-[#172b46]">{row.name}</span>
        </div>
      ),
    },
    { key: 'nameAr', label: 'Arabic name', render: row => <span lang="ar" dir="auto">{row.nameAr || '—'}</span> },
    ...(chooseParent ? [{ key: 'category', label: 'Parent category' }] : []),
    {
      key: 'actions', label: 'Actions',
      render: row => (
        <div className="flex items-center gap-2">
          <a className="btn-secondary" href={isSubcategory
            ? `${paths.subcategories}/${encodeURIComponent(row.categoryId)}/${encodeURIComponent(row.id)}/form`
            : `${paths.categories}/${encodeURIComponent(row.id)}`}>
            {isSubcategory ? 'Product form' : 'Subcategories'} <Icon name="chevronRight" size={14} />
          </a>
          <button className="icon-button disabled:opacity-50" type="button" disabled={opening}
            aria-label={`Edit ${row.name}`} title={`Edit ${kind}`} onClick={() => edit(row)}><Icon name="edit" size={17} /></button>
          <button className="icon-button !text-red-700 disabled:opacity-50" type="button" disabled={opening}
            aria-label={`Delete ${row.name}`} title={`Delete ${kind}`} onClick={() => openDialog('delete', row)}><Icon name="trash" size={17} /></button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        {categoryFilter || <span />}
        {isSubcategory && !parents.length && !resource.loading && !resource.error ? (
          <a className="btn-secondary" href={paths.categories}>Go to categories <Icon name="chevronRight" size={14} /></a>
        ) : (
          <button className="btn-primary" type="button" disabled={opening || isSubcategory && !parents.length}
            onClick={() => openDialog('new', { categoryId })}>
            <Icon name="plus" size={16} /> Add {kind}
          </button>
        )}
      </div>
      {opening && <p role="status" className="mb-4 text-xs text-slate-600">Loading {kind} details...</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <DataTable title={isSubcategory ? 'Subcategory list' : 'Category list'} rows={resource.data} columns={columns}
        loading={resource.loading} error={resource.error?.message} onRetry={resource.reload} showDetails={false}
        emptyMessage={isSubcategory ? 'No subcategories yet.' : `No ${salesChannel} categories yet.`} />
      {dialog && <ProductCategoryDialog {...dialog} kind={kind}
        categories={chooseParent && dialog.mode === 'new' ? parents : undefined} onClose={() => setDialog(null)}
        onSave={async row => { await api.saveCategory(row); finish(row.id ? 'Changes saved.' : `New ${kind} added.`) }}
        onDelete={async row => { await api.deleteCategory(row.id, row.categoryId); finish(`The ${kind} was deleted.`) }} />}
    </>
  )
}

export default function CommerceCategories({ view, categoryId, subcategoryId, request, salesChannel }) {
  const api = useMemo(() => createCommerceApi(request, salesChannel), [request, salesChannel])
  const channelPath = `#/${salesChannel.toLowerCase()}`
  const paths = { categories: `${channelPath}/categories`, subcategories: `${channelPath}/sub-categories` }
  const loadCategories = useCallback(async signal => categoryRows(await api.getCategories({ signal })), [api])
  const categories = useCommerceData(loadCategories)
  const category = categories.data?.find(row => row.id === categoryId)
  const isSubcategoryView = view === 'sub-categories' || Boolean(categoryId)
  const loadSubcategories = useCallback(async signal => {
    const parents = categoryId ? [category] : categories.data
    const groups = await Promise.all(parents.map(async parent => {
      const data = await api.getSubcategories(parent.id, { signal })
      return categoryRows(data, true).map(row => ({ ...row, category: parent.name, categoryId: parent.id }))
    }))
    return groups.flat()
  }, [api, categories.data, category, categoryId])
  const subcategories = useCommerceData(loadSubcategories,
    isSubcategoryView && Boolean(categoryId ? category : categories.data))
  const subcategory = subcategories.data?.find(row => row.id === subcategoryId)
  const pageTitle = subcategoryId ? 'Product form' : isSubcategoryView ? 'Subcategories' : 'Categories'
  const heading = subcategory ? `${subcategory.name} product form` : category && !subcategoryId ? `${category.name} subcategories` : pageTitle
  const categoryFilter = view === 'sub-categories' && (
    <label className="grid min-w-48 gap-2 text-xs font-medium text-slate-600">Parent category
      <select className="field" value={categoryId || ''} disabled={categories.loading || Boolean(categories.error)} onChange={event => {
        window.location.hash = event.target.value ? `${paths.subcategories}/${encodeURIComponent(event.target.value)}` : paths.subcategories
      }}>
        <option value="">All {salesChannel} categories</option>
        {categories.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
      </select>
    </label>
  )
  return (
    <>
      <PageHeading eyebrow={salesChannel.toUpperCase()} title={heading}>
        {categoryId && <a className="btn-secondary" href={subcategoryId ? `${paths.categories}/${encodeURIComponent(categoryId)}` : paths.categories}>
          {subcategoryId ? 'Back to subcategories' : 'Back to categories'}
        </a>}
      </PageHeading>
      {!isSubcategoryView ? (
        <CatalogRows api={api} resource={categories} salesChannel={salesChannel} paths={paths} />
      ) : subcategoryId ? (
        <StatusPanel resource={categories} empty={!category && `${salesChannel} category not found.`}>
          <StatusPanel resource={subcategories} empty={!subcategory && 'Subcategory not found for this category.'}>
            {category && subcategory && (
              <ProductFormEditor api={api} subcategoryId={subcategoryId}
                defaultName={`${subcategory.name} Product Details (${salesChannel} / ${category.name})`} />
            )}
          </StatusPanel>
        </StatusPanel>
      ) : categoryId && !categories.loading && !categories.error && !category ? (
        <p className="panel p-6 text-sm">{salesChannel} category not found.</p>
      ) : (
        <CatalogRows api={api} categoryId={categoryId} parents={categories.data ?? []} categoryFilter={categoryFilter}
          resource={categories.loading || categories.error ? categories : subcategories} salesChannel={salesChannel} paths={paths} />
      )}
    </>
  )
}
