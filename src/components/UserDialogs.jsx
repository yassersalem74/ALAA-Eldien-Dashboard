import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'
import { Avatar, StatusBadge } from './UI'

function UserModal({ title, children, onClose, busy = false }) {
  const ref = useRef(null)
  const headingId = useId()
  useEffect(() => { ref.current.showModal() }, [])
  return (
    <dialog ref={ref} className="modal" aria-labelledby={headingId} onCancel={event => {
      if (busy) event.preventDefault()
      else onClose()
    }} onClick={event => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <div className="modal-box max-w-lg rounded-xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-lg font-semibold text-[#172b46]">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Close dialog"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

function AccountInfo({ name, status, info }) {
  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-700">{name}</p>
          <div className="mt-1"><StatusBadge status={status} /></div>
        </div>
      </div>
      <dl className="divide-y divide-slate-100">
        {info.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[100px_1fr] gap-3 py-3 text-xs">
            <dt className="text-slate-500">{label}</dt>
            <dd className="break-words text-right font-medium text-slate-700">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

export function UserDetails({ user, title = 'User information', onClose }) {
  const info = [
    ['Email', user.email], ['Phone', user.phone], ['Account type', user.accountType],
    ['Roles', user.roles.join(', ')], ['Company', user.companyName], ['Location', user.city],
    ['Joined', user.joined], ['User ID', user.id],
  ]
  return (
    <UserModal title={title} onClose={onClose}>
      <AccountInfo name={user.name} status={user.status} info={info} />
      <button type="button" className="btn-secondary mt-5 w-full" onClick={onClose}>Close</button>
    </UserModal>
  )
}

export function DeleteUserDialog({ user, onDelete, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onDelete(user)
      onClose()
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }

  return (
    <UserModal title="Delete user?" onClose={onClose} busy={busy}>
      <p className="text-sm text-slate-600">Permanently delete <strong>{user.name}</strong> and their account?</p>
      {user.email && <p className="mt-2 break-all text-xs text-slate-500">{user.email}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" autoFocus className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="btn-primary !bg-red-700" disabled={busy} onClick={confirm}>
          <Icon name="trash" size={14} /> {busy ? 'Deleting…' : 'Delete user'}
        </button>
      </div>
    </UserModal>
  )
}

export function CompanyReviewDialog({ company, onSave, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const info = [['Email', company.email], ['Phone', company.phone], ['Company ID', company.id]]

  async function review(event) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const decision = data.get('decision')
    if (decision !== 'approve' && decision !== 'reject') return
    setBusy(true)
    setError('')
    try {
      await onSave({ isApproved: decision === 'approve', adminNote: data.get('adminNote') })
      onClose()
    } catch (failure) {
      setError(failure.status === 409 ? 'This company may have changed. Refresh the company directory and review the latest record.' : failure.message)
      setBusy(false)
    }
  }

  return (
    <UserModal title={onSave ? 'Review company' : 'Company information'} onClose={onClose} busy={busy}>
      <AccountInfo name={company.name} status={company.status} info={info} />
      {onSave ? (
        <form onSubmit={review} className="mt-4 space-y-4">
          <fieldset disabled={busy} className="space-y-2">
            <legend className="mb-2 text-xs font-semibold text-slate-700">Decision</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="decision" value="approve" required /> Approve
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="decision" value="reject" required /> Reject
            </label>
            <label className="grid gap-2 pt-2 text-xs font-medium text-slate-700">Admin note
              <textarea className="field w-full" name="adminNote" rows={3} maxLength={400} defaultValue={company.adminNote} />
            </label>
          </fieldset>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save decision'}</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-secondary mt-5 w-full" onClick={onClose}>Close</button>
      )}
    </UserModal>
  )
}
