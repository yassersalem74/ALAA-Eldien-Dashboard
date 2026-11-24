import { useCallback, useState } from 'react'
import { COMPANY_STATUSES } from '../api/users'
import useApiData from '../hooks/useApiData'
import DataTable from './DataTable'
import Icon from './Icon'
import { Avatar, StatusBadge } from './UI'
import { CompanyReviewDialog } from './UserDialogs'

const pageSize = 10
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' })

export default function CompanyDirectory({ api, initialStatus = '' }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const load = useCallback(signal => api.listCompanies({ page, pageSize, search, status }, { signal }), [api, page, search, status])
  const companies = useApiData(load)
  const columns = [
    {
      key: 'name', label: 'Company',
      render: (row, index) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} index={index} />
          <span className="font-semibold text-[#172b46]">{row.name}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: row => row.email || '—' },
    { key: 'phone', label: 'Phone', render: row => row.phone || '—' },
    { key: 'submitted', label: 'Submitted', render: row => Number.isFinite(Date.parse(row.submitted)) ? dateFormat.format(new Date(row.submitted)) : '—' },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: row => {
        const label = row.id != null && row.id !== '' ? 'Review' : 'View details'
        return (
          <button type="button" className="btn-secondary" aria-label={`${label} for ${row.name}`} onClick={() => setSelected(row)}>
            {label}
          </button>
        )
      },
    },
  ]
  const data = companies.data

  async function saveDecision(decision) {
    await api.reviewCompany(selected.id, { ...decision, concurrencyStamp: selected.concurrencyStamp })
    setNotice(`${selected.name} was ${decision.isApproved ? 'approved' : 'rejected'}.`)
    if (page === 1) companies.reload()
    else setPage(1)
  }

  return (
    <>
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{notice}</p>}
      <DataTable title="Company directory" rows={data?.rows} columns={columns} showDetails={false}
        pageSize={data?.pageSize ?? pageSize} loading={companies.loading} error={companies.error?.message} onRetry={companies.reload}
        emptyMessage={search || status ? 'No companies match these filters.' : 'No companies found.'}
        pagination={{ page, total: data?.total, hasNext: data?.hasNext, onChange: setPage }}
        controls={
          <div className="flex flex-wrap items-center gap-2">
            <form role="search" className="flex items-center gap-2" onSubmit={event => {
              event.preventDefault()
              setSearch(new FormData(event.currentTarget).get('search').trim())
              setPage(1)
            }}>
              <input name="search" type="search" className="field w-40" aria-label="Search companies" placeholder="Search companies" />
              <button type="submit" className="btn-secondary"><Icon name="search" size={15} /> Search</button>
            </form>
            <select className="field" aria-label="Filter companies by status" value={status} onChange={event => {
              setStatus(event.target.value)
              setPage(1)
            }}>
              <option value="">All statuses</option>
              {COMPANY_STATUSES.map(value => <option key={value}>{value}</option>)}
            </select>
            <button type="button" className="icon-button" onClick={companies.reload} aria-label="Refresh companies" title="Refresh companies" disabled={companies.loading}>
              <Icon name="refresh" size={16} />
            </button>
          </div>
        }
      />
      {selected && <CompanyReviewDialog company={selected} onClose={() => setSelected(null)}
        onSave={selected.id != null && selected.id !== '' ? saveDecision : undefined} />}
    </>
  )
}
