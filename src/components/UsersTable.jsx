import { useState } from 'react'
import Icon from './Icon'
import { apiConfig } from '../api/config'
import { Avatar, StatusBadge } from './UI'

export default function UsersTable({ users, source, currentUser, onDetails, onDelete, loading, error, onRetry }) {
  const [page, setPage] = useState(1)
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
  const activePage = Math.min(page, totalPages)
  const start = (activePage - 1) * pageSize
  return <div className="panel overflow-hidden">
    <div className="relative overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left text-xs">
        <thead className="border-b border-slate-100 bg-[#fafbfc]"><tr>{['User', 'Role', 'Contact', 'Status', 'Actions'].map(label => <th key={label} scope="col" className="px-6 py-4 text-[10px] font-medium text-slate-400 last:text-right">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{!loading && !error && users.slice(start, start + pageSize).map((user, index) => {
          const isSelf = user.id != null && currentUser?.id != null && String(user.id) === String(currentUser.id)
          const deleteReason = source === 'preview' ? '' : isSelf ? 'You cannot delete your own account from this directory.' : !user.id ? 'This account has no user ID.' : !apiConfig.deletePath ? 'The backend admin delete endpoint is not available yet.' : ''
          return <tr key={user.id ?? `${user.email}-${index}`} className="hover:bg-slate-50/70">
            <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={user.name} index={index} /><div><p className="max-w-60 truncate font-medium text-slate-700">{user.companyName || user.name}{isSelf && <span className="ml-2 text-[9px] text-slate-400">You</span>}</p><p className="mt-1 text-[10px] text-slate-400">{user.email || 'No email provided'}</p></div></div></td>
            <td className="px-6 py-4"><div className="flex flex-wrap gap-1.5">{user.roles.length ? user.roles.map(role => <span key={role} className={`rounded-md border px-2 py-1 text-[10px] font-medium ${role === 'SuperAdmin' ? 'border-violet-100 bg-violet-50 text-violet-700' : role === 'Company' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{role}</span>) : <span className="text-slate-400">Not provided</span>}</div></td>
            <td className="px-6 py-4"><p className="text-[11px] text-slate-600">{user.phone || 'Not provided'}</p><p className="mt-1 text-[10px] text-slate-400">{user.city || 'Location not provided'}</p></td>
            <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
            <td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button className="btn-secondary !px-3 !py-2 !text-[10px]" onClick={() => onDetails(user)} aria-label={`View ${user.name}`}>View details</button><button className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40" disabled={Boolean(deleteReason)} title={deleteReason || `Delete ${user.name}`} aria-label={`Delete ${user.name}`} onClick={() => onDelete(user)}><Icon name="trash" size={13} />Delete</button></div></td>
          </tr>
        })}</tbody>
      </table>
    </div>
    {loading ? <div role="status" className="flex items-center justify-center gap-3 p-16 text-xs text-slate-500"><span className="loading loading-spinner loading-sm" />Loading users…</div> : error ? <div role="alert" className="px-6 py-12 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Icon name="users" size={21} /></div><h3 className="text-sm font-semibold text-slate-700">User directory unavailable</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">{error}</p><button className="btn-secondary mt-5" onClick={onRetry}><Icon name="refresh" size={13} />Retry</button></div> : !users.length && <div className="p-14 text-center"><Icon name="users" size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">No users to display</p><p className="mt-1 text-xs text-slate-400">Try a different account type, role, or search.</p></div>}
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4"><p className="text-[10px] text-slate-400">{loading || error ? 'No records loaded' : `Showing ${users.length ? start + 1 : 0}–${Math.min(start + pageSize, users.length)} of ${users.length} users`}</p><div className="flex gap-1.5"><button className="btn-secondary !px-2.5 !py-1.5" disabled={activePage === 1 || loading} onClick={() => setPage(activePage - 1)} aria-label="Previous page"><Icon name="chevronRight" className="rotate-180" size={14} /></button><span className="flex items-center px-2 text-[10px] text-slate-500">{activePage} / {totalPages}</span><button className="btn-secondary !px-2.5 !py-1.5" disabled={activePage === totalPages || loading} onClick={() => setPage(activePage + 1)} aria-label="Next page"><Icon name="chevronRight" size={14} /></button></div></div>
  </div>
}
