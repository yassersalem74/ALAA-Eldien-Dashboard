import { useCallback, useMemo, useState } from 'react'
import { categoryRows, createMarketplaceApi } from '../api/marketplace'
import useMarketplaceData from '../hooks/useMarketplaceData'
import Icon from '../components/Icon'
import { PageHeading } from '../components/UI'
import MarketplaceCategoryDialog from '../components/MarketplaceCategoryDialog'
import MarketplaceFormEditor from '../components/MarketplaceFormEditor'

const categoriesPath = '#/marketplace/categories'
const subcategoriesPath = '#/marketplace/sub-categories'
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

function CatalogRows({ api, resource, categoryId }) {
  const [dialog, setDialog] = useState(null)
  const [opening, setOpening] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const kind = categoryId ? 'subcategory' : 'category'

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
      const localized = categoryId
        ? await api.getSubcategories(categoryId, options)
        : await api.getCategories(options)
      const arabic = categoryRows(localized, Boolean(categoryId)).find(item => item.id === row.id)
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-600">{resource.data ? `${resource.data.length} ${categoryId ? 'subcategories' : 'categories'}` : ''}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="button" disabled={opening} onClick={() => openDialog('new')}>
            <Icon name="plus" size={16} /> Add {kind}
          </button>
        </div>
      </div>
      {opening && <p role="status" className="mb-4 text-xs text-slate-600">Loading category details...</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <StatusPanel resource={resource} empty={resource.data?.length === 0 && `No ${categoryId ? 'subcategories' : 'marketplace categories'} yet.`}>
        <ul className="panel divide-y divide-slate-100">
          {resource.data?.map(row => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
              {row.image
                ? <img className="size-10 rounded-md object-cover" src={row.image} alt="" loading="lazy" />
                : <span className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500"><Icon name="box" size={18} /></span>}
              <div className="min-w-0 flex-1 basis-32 break-words">
                <p className="text-sm font-semibold text-[#172b46]">{row.name}</p>
                {row.nameAr && row.nameAr !== row.name && <p lang="ar" className="mt-1 text-xs text-slate-500">{row.nameAr}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="icon-button disabled:opacity-50" type="button" disabled={opening}
                  aria-label={`Edit ${row.name}`} title={`Edit ${kind}`} onClick={() => edit(row)}><Icon name="edit" size={17} /></button>
                <button className="icon-button !text-red-700 disabled:opacity-50" type="button" disabled={opening}
                  aria-label={`Delete ${row.name}`} title={`Delete ${kind}`} onClick={() => openDialog('delete', row)}><Icon name="trash" size={17} /></button>
                <a className="btn-secondary" href={categoryId
                  ? `${subcategoriesPath}/${encodeURIComponent(categoryId)}/${encodeURIComponent(row.id)}/form`
                  : `${categoriesPath}/${encodeURIComponent(row.id)}`}>
                  {categoryId ? 'Product form' : 'Subcategories'} <Icon name="chevronRight" size={14} />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </StatusPanel>
      {dialog && <MarketplaceCategoryDialog {...dialog} kind={kind} onClose={() => setDialog(null)}
        onSave={async row => { await api.saveCategory({ ...row, categoryId }); finish(row.id ? 'Changes saved.' : `New ${kind} added.`) }}
        onDelete={async row => { await api.deleteCategory(row.id, categoryId); finish(`The ${kind} was deleted.`) }} />}
    </>
  )
}

export default function MarketplaceCategories({ view = 'categories', categoryId, subcategoryId, request }) {
  const api = useMemo(() => createMarketplaceApi(request), [request])
  const loadCategories = useCallback(async signal => categoryRows(await api.getCategories({ signal })), [api])
  const loadSubcategories = useCallback(async signal => categoryRows(await api.getSubcategories(categoryId, { signal }), true), [api, categoryId])
  const categories = useMarketplaceData(loadCategories)
  const subcategories = useMarketplaceData(loadSubcategories, Boolean(categoryId))
  const category = categories.data?.find(row => row.id === categoryId)
  const subcategory = subcategories.data?.find(row => row.id === subcategoryId)
  const selectSubcategories = view === 'subcategories' && !subcategoryId
  const pageTitle = subcategoryId ? 'Product form' : categoryId || selectSubcategories ? 'Subcategories' : 'Categories'
  const heading = subcategory ? `${subcategory.name} product form` : category && !subcategoryId ? `${category.name} subcategories` : pageTitle
  return (
    <>
      <PageHeading eyebrow="MARKETPLACE" title={heading}>
        {categoryId && <a className="btn-secondary" href={subcategoryId ? `${categoriesPath}/${encodeURIComponent(categoryId)}` : categoriesPath}>
          {subcategoryId ? 'Back to subcategories' : 'Back to categories'}
        </a>}
      </PageHeading>
      {!categoryId && !selectSubcategories ? (
        <CatalogRows api={api} resource={categories} />
      ) : (
        <StatusPanel resource={categories} empty={categories.data?.length === 0 && 'Add a marketplace category before creating subcategories.'}>
          {selectSubcategories && (
            <label className="mb-5 grid max-w-sm gap-2 text-xs font-medium">Marketplace category
              <select className="field w-full" value={categoryId || ''} aria-label="Marketplace category" onChange={event => {
                window.location.hash = event.target.value ? `${subcategoriesPath}/${encodeURIComponent(event.target.value)}` : subcategoriesPath
              }}>
                <option value="">Choose a category</option>
                {categories.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
              </select>
            </label>
          )}
          {categoryId && !category && <p className="panel p-6 text-sm">Marketplace category not found.</p>}
          {category && !subcategoryId && <CatalogRows api={api} resource={subcategories} categoryId={categoryId} />}
          {category && subcategoryId && (
            <StatusPanel resource={subcategories} empty={!subcategories.loading && !subcategory && 'Subcategory not found for this category.'}>
              {subcategory && <MarketplaceFormEditor api={api} subcategoryId={subcategoryId} />}
            </StatusPanel>
          )}
        </StatusPanel>
      )}
    </>
  )
}
