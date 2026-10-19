import { useState } from 'react'
import Icon from '../components/Icon'
import { ExportButton, MetricCard, PageHeading } from '../components/UI'
import { ApiAccessDialog, DeleteUserDialog, UserDetails } from '../components/UserDialogs'
import UsersTable from '../components/UsersTable'
import useUsers from '../hooks/useUsers'
import { USER_ROLES } from '../api/users'

export default function Users({ search = '' }) {
  const directory = useUsers()
  const [type, setType] = useState('Individual')
  const [role, setRole] = useState('All roles')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const matches = user => (role === 'All roles' || user.roles.includes(role)) && [query, search].every(term => `${user.name} ${user.email} ${user.phone} ${user.roles.join(' ')} ${user.companyName} ${user.city}`.toLowerCase().includes(term.toLowerCase()))
  const filtered = directory.users.filter(user => user.accountType === type && matches(user))
  const unknown = directory.users.filter(user => user.accountType === 'Unknown')
  const isPreview = directory.source === 'preview'
  const loaded = !directory.error && !directory.loading
  const count = accountType => directory.users.filter(user => user.accountType === accountType).length
  const tableProps = { source: directory.source, currentUser: directory.currentUser, onDetails: user => setDialog({ kind: 'details', user }), onDelete: user => setDialog({ kind: 'delete', user }), onRetry: directory.refresh }
  const remove = async user => { await directory.remove(user); setNotice(`${user.name} ${isPreview ? 'was removed from the preview.' : 'was deleted successfully.'}`) }

  return <>
    <PageHeading eyebrow="MANAGEMENT" title="Users" description="Manage individual and company accounts, view their information, and review their roles.">
      <button className="btn-secondary" onClick={() => setDialog({ kind: 'access' })}><Icon name="shield" size={14} />{directory.currentUser ? 'Switch account' : 'Sign in to backend'}</button>
      <ExportButton rows={filtered.map(user => ({ ...user, roles: user.roles.join(', ') }))} filename={`${type.toLowerCase()}-users`} />
    </PageHeading>

    <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4 ${isPreview ? 'border-amber-200/70 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isPreview ? 'bg-amber-400' : directory.currentUser ? 'bg-emerald-500' : 'bg-slate-400'}`} /><div><p className="text-xs font-semibold text-slate-700">{isPreview ? 'Preview data' : 'Backend · alaaeldin.runasp.net'}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{isPreview ? 'Sample accounts for reviewing the interface. Deletions affect this preview only.' : directory.currentUser ? `Signed in as ${directory.currentUser.email || directory.currentUser.name}` : directory.loading ? 'Checking your backend connection…' : 'Sign in to load your account information.'}</p></div></div>
      <div className="flex gap-2">{isPreview ? <button className="btn-secondary !py-2" onClick={() => { directory.connect(''); setNotice('') }}>Use backend</button> : <button className="btn-secondary !py-2" onClick={() => { directory.preview(); setNotice('') }}>Preview UI</button>}<button className="icon-button" disabled={directory.loading} aria-label={isPreview ? 'Restore preview users' : 'Refresh users'} title={isPreview ? 'Restore preview users' : 'Refresh users'} onClick={() => { directory.refresh(); setNotice('') }}><Icon name="refresh" size={16} /></button></div>
    </div>

    {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><Icon name="close" size={15} /></button></div>}
    {!isPreview && directory.currentUser && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4"><div><p className="text-xs font-semibold text-slate-700">My account</p><p className="mt-1 text-[11px] text-slate-400">{directory.currentUser.email || directory.currentUser.name}</p></div><button className="btn-secondary !py-2" onClick={() => setDialog({ kind: 'details', user: directory.currentUser })}>View my information</button></div>}
    {!isPreview && directory.accountError && <p role="status" className="mb-5 text-xs leading-5 text-slate-500">Account: {directory.accountError}</p>}

    <div className="mb-6 grid gap-4 sm:grid-cols-3"><MetricCard label={isPreview ? 'Preview accounts' : 'Loaded accounts'} value={loaded ? directory.users.length : '—'} icon="users" detail={isPreview ? 'Sample individuals and companies' : 'From the connected user directory'} /><MetricCard label="Individuals" value={loaded ? count('Individual') : '—'} icon="users" index={2} detail="Individual account type" /><MetricCard label="Companies" value={loaded ? count('Company') : '—'} icon="store" index={1} detail="Company account type" /></div>

    <section aria-label="User directory">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="Account type">{[['Individual', 'Individuals'], ['Company', 'Companies']].map(([value, label]) => <button key={value} role="tab" id={`tab-${value}`} aria-selected={type === value} aria-controls="users-panel" tabIndex={type === value ? 0 : -1} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'Individual' : event.key === 'End' ? 'Company' : type === 'Individual' ? 'Company' : 'Individual'; setType(next); document.getElementById(`tab-${next}`)?.focus() } }} onClick={() => setType(value)} className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-medium transition-colors ${type === value ? 'bg-[#172b46] text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Icon name={value === 'Individual' ? 'users' : 'store'} size={15} />{label}<span className={`rounded px-1.5 py-0.5 text-[9px] ${type === value ? 'bg-white/15' : 'bg-slate-100'}`}>{loaded ? count(value) : '—'}</span></button>)}</div>
        <div className="flex flex-wrap gap-2"><label className="relative"><Icon name="search" size={15} className="absolute left-3 top-3 text-slate-400" /><input className="field w-48 pl-9" placeholder="Search users..." aria-label="Search users" value={query} onChange={event => setQuery(event.target.value)} /></label><select className="field" aria-label="Filter by role" value={role} onChange={event => setRole(event.target.value)}><option>All roles</option>{USER_ROLES.map(item => <option key={item}>{item}</option>)}</select></div>
      </div>
      {!isPreview && directory.total > directory.users.length && <p className="mb-3 text-xs text-slate-500">Loaded {directory.users.length} of {directory.total} accounts. Additional backend pages require the admin pagination contract.</p>}
      <div id="users-panel" role="tabpanel" aria-labelledby={`tab-${type}`}><UsersTable key={`${type}-${role}-${query}-${search}-${directory.source}`} {...tableProps} users={filtered} loading={directory.loading} error={directory.error} /></div>
    </section>

    {loaded && unknown.length > 0 && <section className="mt-6"><h2 className="text-sm font-semibold text-slate-700">Accounts missing a type ({unknown.length})</h2><p className="mb-4 mt-2 text-xs text-slate-500">These records need an account type from the backend before they can appear under Individuals or Companies.</p><UsersTable {...tableProps} users={unknown.filter(matches)} /></section>}
    {dialog?.kind === 'details' && <UserDetails user={dialog.user} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'delete' && <DeleteUserDialog user={dialog.user} preview={isPreview} onDelete={remove} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'access' && <ApiAccessDialog onConnect={directory.connect} onLogin={directory.login} onClose={() => setDialog(null)} />}
  </>
}
