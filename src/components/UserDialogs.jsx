import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { Avatar, StatusBadge } from './UI'

function UserModal({ title, children, onClose, busy = false }) {
  const ref = useRef(null)
  const headingId = 'user-dialog-heading'
  useEffect(() => { ref.current.showModal() }, [])
  return <dialog ref={ref} className="modal" aria-labelledby={headingId} onCancel={event => { if (busy) event.preventDefault(); else onClose() }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose() }}><div className="modal-box max-w-lg rounded-2xl bg-white p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 id={headingId} className="text-lg font-semibold text-[#172b46]">{title}</h2><button className="icon-button" onClick={onClose} disabled={busy} aria-label="Close dialog"><Icon name="close" /></button></div>{children}</div></dialog>
}

export function UserDetails({ user, onClose }) {
  const info = [['Email', user.email], ['Phone', user.phone], ['Account type', user.accountType], ['Roles', user.roles.join(', ')], ['Company', user.companyName], ['Location', user.city], ['Joined', user.joined], ['User ID', user.id]]
  return <UserModal title="User information" onClose={onClose}><div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4"><Avatar name={user.name} /><div className="min-w-0"><p className="break-words text-sm font-semibold text-slate-700">{user.name}</p><div className="mt-2"><StatusBadge status={user.status} /></div></div></div><dl className="divide-y divide-slate-100">{info.map(([label, value]) => <div key={label} className="grid grid-cols-[90px_1fr] gap-3 py-3 text-xs"><dt className="text-slate-400">{label}</dt><dd className="break-words text-right font-medium text-slate-700">{value || 'Not provided'}</dd></div>)}</dl><button className="btn-secondary mt-5 w-full" onClick={onClose}>Close</button></UserModal>
}

export function DeleteUserDialog({ user, preview, onDelete, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirm = async () => {
    setBusy(true); setError('')
    try { await onDelete(user); onClose() } catch (failure) { setError(failure.message); setBusy(false) }
  }
  return <UserModal title={preview ? 'Delete preview user?' : 'Delete user?'} onClose={onClose} busy={busy}><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500"><Icon name="trash" size={21} /></div><p className="text-sm leading-6 text-slate-600">{preview ? 'Remove ' : 'Permanently delete '}<strong className="font-semibold text-slate-800">{user.name}</strong>{preview ? ' from this preview?' : ' and their account?'}</p><p className="mt-2 break-all text-xs text-slate-400">{user.email}</p><p className="mt-4 text-xs leading-5 text-slate-500">{preview ? 'This changes demo data only. Refresh preview to restore the original list.' : 'This action cannot be undone.'}</p>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button autoFocus className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50" disabled={busy} onClick={confirm}><Icon name="trash" size={14} />{busy ? 'Deleting…' : 'Delete user'}</button></div></UserModal>
}

export function ApiAccessDialog({ onConnect, onLogin, onClose }) {
  const [method, setMethod] = useState('login')
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (method === 'login') await onLogin(email.trim(), password)
      else onConnect(token.trim())
      onClose()
    } catch (failure) { setError(failure.message); setBusy(false) }
  }
  return <UserModal title="Sign in to the backend" onClose={onClose} busy={busy}>
    <p className="mb-5 text-xs leading-5 text-slate-500">Connect your Alaa Eldien account. Access credentials stay in memory for this page session.</p>
    <div className="mb-5 flex gap-1 rounded-lg bg-slate-100 p-1">{[['login', 'Email & password'], ['token', 'Access token']].map(([value, label]) => <button key={value} disabled={busy} onClick={() => { setMethod(value); setError('') }} className={`flex-1 rounded-md px-3 py-2 text-xs ${method === value ? 'bg-white font-medium text-slate-700 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div>
    <form onSubmit={submit} className="space-y-4">
      {method === 'login' ? <><label className="block text-xs font-medium text-slate-700">Email<input type="email" required autoComplete="username" disabled={busy} className="field mt-2 w-full" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label><label className="block text-xs font-medium text-slate-700">Password<input type="password" required autoComplete="current-password" disabled={busy} className="field mt-2 w-full" value={password} onChange={event => setPassword(event.target.value)} /></label></> : <label className="block text-xs font-medium text-slate-700">JWT bearer token<input type="password" required autoComplete="off" spellCheck={false} disabled={busy} className="field mt-2 w-full" value={token} onChange={event => setToken(event.target.value)} placeholder="Paste access token" /></label>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Connecting…' : 'Connect'}</button></div>
    </form>
  </UserModal>
}
