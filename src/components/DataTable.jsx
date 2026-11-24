import { useState } from 'react'
import Icon from './Icon'
import { DetailDialog } from './UI'

export default function DataTable({
  title, description, rows = [], columns, search = '', statuses = [], pageSize = 6,
  showDetails = true, controls, pagination, loading, error, onRetry,
  emptyMessage = 'No matching records',
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [localPage, setLocalPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const filtered = pagination ? rows : rows.filter(row => (
    [query, search].every(term => Object.values(row).join(' ').toLowerCase().includes(term.toLowerCase()))
    && (status === 'All statuses' || row.status === status)
  ))
  const total = pagination ? pagination.total : filtered.length
  const totalPages = total == null ? undefined : Math.max(1, Math.ceil(total / pageSize))
  const page = pagination?.page ?? Math.min(localPage, totalPages)
  const start = (page - 1) * pageSize
  const visible = pagination ? rows : filtered.slice(start, start + pageSize)
  const canAdvance = pagination ? pagination.hasNext : page < totalPages
  const changePage = pagination?.onChange ?? setLocalPage
  let summary = `${visible.length} on this page`
  if (total != null) {
    summary = visible.length ? `Showing ${start + 1}–${start + visible.length} of ${total}` : `Showing 0 of ${total}`
  }

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-sm font-semibold text-[#172b46]">{title}</h2>
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
        {controls ?? (
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <Icon name="search" size={15} className="absolute left-3 top-3 text-slate-400" />
              <input className="field w-44 pl-9" placeholder="Search records..." aria-label={`Search ${title}`}
                value={query} onChange={event => { setQuery(event.target.value); setLocalPage(1) }} />
            </label>
            {statuses.length > 0 && (
              <select className="field" aria-label="Filter by status" value={status} onChange={event => {
                setStatus(event.target.value)
                setLocalPage(1)
              }}>
                <option>All statuses</option>
                {statuses.map(item => <option key={item}>{item}</option>)}
              </select>
            )}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left text-xs">
          <caption className="sr-only">{title}</caption>
          <thead className="border-y border-slate-100 bg-[#fafbfc]">
            <tr>
              {columns.map(column => (
                <th key={column.key} scope="col" className="px-5 py-3.5 text-xs font-medium text-slate-600">
                  {column.label}
                </th>
              ))}
              {showDetails && <th scope="col"><span className="sr-only">Details</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && !error && visible.map((row, index) => (
              <tr key={row.id ?? start + index} className="transition-colors hover:bg-slate-50/80">
                {columns.map(column => (
                  <td key={column.key} className="px-5 py-3.5 text-xs text-slate-600">
                    {column.render ? column.render(row, index) : row[column.key] ?? '—'}
                  </td>
                ))}
                {showDetails && (
                  <td className="pr-5 text-right">
                    <button className="icon-button ml-auto" onClick={() => setSelected(row)} aria-label={`View details for ${row.id}`}>
                      <Icon name="chevronRight" size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <p role="status" className="p-10 text-center text-sm text-slate-500">Loading…</p>}
      {error && (
        <div className="p-10 text-center">
          <p role="alert" className="break-words text-sm text-red-700">{error}</p>
          {onRetry && <button className="btn-secondary mt-3" type="button" onClick={onRetry}><Icon name="refresh" size={15} /> Retry</button>}
        </div>
      )}
      {!loading && !error && !visible.length && (
        <p role="status" className="p-10 text-center text-sm text-slate-500">{query || status !== 'All statuses' ? 'No matching records' : emptyMessage}</p>
      )}
      {(!loading && !error || pagination) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">{loading || error ? '' : summary}</p>
          <div className="flex items-center gap-1.5">
            <button className="btn-secondary !px-2.5 !py-1.5" type="button" disabled={page === 1} onClick={() => changePage(page - 1)} aria-label="Previous page">
              <Icon name="chevronRight" className="rotate-180" size={14} />
            </button>
            <span className="px-2 text-xs text-slate-500">Page {page}{totalPages > 1 ? ` of ${totalPages}` : ''}</span>
            <button className="btn-secondary !px-2.5 !py-1.5" type="button" disabled={Boolean(loading || error) || !canAdvance} onClick={() => changePage(page + 1)} aria-label="Next page">
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
        </div>
      )}
      {selected && <DetailDialog item={selected} title={selected.name || selected.id} onClose={() => setSelected(null)} />}
    </section>
  )
}
