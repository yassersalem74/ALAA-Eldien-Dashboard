import { useCallback, useState } from 'react'
import { apiConfig } from '../api/config'
import { USER_ROLES } from '../api/users'
import useApiData from '../hooks/useApiData'
import DataTable from './DataTable'
import { Avatar, StatusBadge } from './UI'
import { DeleteUserDialog, UserDetails } from './UserDialogs'

function sameUser(user, account) {
  return user.id != null && account.id != null && String(user.id).toLowerCase() === String(account.id).toLowerCase()
}

export default function UsersTable({ api, currentUser }) {
  const enabled = Boolean(apiConfig.listPath)
  const load = useCallback(signal => api.list({ signal }), [api])
  const directory = useApiData(load, enabled)
  const [role, setRole] = useState('')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const users = directory.data?.users ?? []
  const rows = users.filter(user => user.accountType !== 'Company' && (
    !role || user.roles.some(item => item.toLowerCase() === role.toLowerCase())
  ))
  const canDelete = Boolean(currentUser.id != null && apiConfig.deletePath.includes('{id}'))
  const columns = [
    {
      key: 'name', label: 'User',
      render: (row, index) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} index={index} />
          <span className="font-semibold text-[#172b46]">{row.name}{sameUser(row, currentUser) && <span className="ml-2 text-xs font-normal text-slate-500">You</span>}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: row => row.email || '—' },
    { key: 'phone', label: 'Phone', render: row => row.phone || '—' },
    { key: 'roles', label: 'Roles', render: row => row.roles.join(', ') || '—' },
    { key: 'accountType', label: 'Account type', render: row => row.accountType === 'Unknown' ? 'Unclassified' : row.accountType },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: row => (
        <span className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => setDialog({ kind: 'details', row })}>View details</button>
          {canDelete && row.id != null && row.id !== '' && !sameUser(row, currentUser) && (
            <button type="button" className="btn-secondary !text-red-700" onClick={() => setDialog({ kind: 'delete', row })}>Delete</button>
          )}
        </span>
      ),
    },
  ]

  async function remove(row) {
    if (sameUser(row, currentUser)) throw new Error('Choose another account to delete.')
    await api.deleteUser(row.id)
    setNotice(`${row.name} was deleted.`)
    directory.reload()
  }

  return (
    <>
      {enabled && (
        <div className="mb-4 flex flex-wrap gap-2">
          <input type="search" className="field w-48" aria-label="Search individuals" placeholder="Search individuals"
            value={query} onChange={event => setQuery(event.target.value)} />
          <select className="field" aria-label="Filter by role" value={role} onChange={event => setRole(event.target.value)}>
            <option value="">All roles</option>
            {USER_ROLES.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      )}
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{notice}</p>}
      {directory.data?.total > users.length && (
        <p className="mb-4 text-xs text-slate-600">Loaded {users.length} of {directory.data.total} accounts from the directory.</p>
      )}
      <DataTable key={JSON.stringify([role, query.trim()])} title="Individual accounts" rows={rows} columns={columns}
        search={query.trim()} controls={false} showDetails={false} loading={directory.loading}
        error={enabled ? directory.error?.message : 'An admin endpoint for listing individual users is required.'}
        onRetry={enabled ? directory.reload : undefined} emptyMessage={query || role ? 'No individual accounts match these filters.' : 'No individual accounts found.'} />
      {dialog?.kind === 'details' && <UserDetails user={dialog.row} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'delete' && <DeleteUserDialog user={dialog.row} onDelete={remove} onClose={() => setDialog(null)} />}
    </>
  )
}
