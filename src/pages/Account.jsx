import { useCallback, useMemo, useState } from 'react'
import { createUsersApi } from '../api/users'
import { ServiceField, ServiceMutation, ServiceResourceError } from '../components/ServiceControls'
import { Avatar, PageHeading, StatusBadge } from '../components/UI'
import useApiData from '../hooks/useApiData'

export default function Account({ session }) {
  const api = useMemo(() => createUsersApi(session.request), [session.request])
  const load = useCallback(signal => api.getMe({ signal }), [api])
  const profile = useApiData(load)
  const account = profile.data ?? session.account
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  return (
    <>
      <PageHeading eyebrow="MANAGEMENT" title="My account">
        <button type="button" className="btn-secondary" onClick={() => setEditing(true)}>Change password</button>
      </PageHeading>
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <section className="panel max-w-2xl p-5">
        <div className="mb-4 flex items-center gap-3"><Avatar name={account.name} /><h2 className="font-semibold">{account.name}</h2><StatusBadge status={account.status} /></div>
        <ServiceResourceError resource={profile} />
        <dl className="divide-y divide-slate-100">
          {[['Email', account.email], ['Phone', account.phone], ['Roles', account.roles.join(', ')], ['Account type', account.accountType], ['Company', account.companyName]]
            .map(([label, value]) => <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-3 text-sm">
              <dt className="text-slate-500">{label}</dt><dd className="break-words">{value || '—'}</dd>
            </div>)}
        </dl>
      </section>
      {editing && <ServiceMutation title="Change password" onClose={() => setEditing(false)} onSubmit={async data => {
        const newPassword = data.get('newPassword')
        if (newPassword !== data.get('confirmPassword')) throw new Error('The passwords must match.')
        await api.changePassword({ oldPassword: data.get('oldPassword'), newPassword })
        setNotice('Your password was changed.')
      }}>
        <ServiceField label="Current password"><input type="password" className="field" name="oldPassword" autoComplete="current-password" required /></ServiceField>
        <ServiceField label="New password"><input type="password" className="field" name="newPassword" autoComplete="new-password" minLength="8" maxLength="50" required /></ServiceField>
        <ServiceField label="Confirm password"><input type="password" className="field" name="confirmPassword" autoComplete="new-password" required /></ServiceField>
      </ServiceMutation>}
    </>
  )
}
