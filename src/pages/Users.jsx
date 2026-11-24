import { useMemo, useState } from 'react'
import { apiConfig } from '../api/config'
import { COMPANY_STATUSES, createUsersApi } from '../api/users'
import CompanyDirectory from '../components/CompanyDirectory'
import Icon from '../components/Icon'
import { PageHeading } from '../components/UI'
import { UserDetails } from '../components/UserDialogs'
import UsersTable from '../components/UsersTable'

const tabs = [
  { id: 'individuals', label: 'Individuals', icon: 'users' },
  { id: 'companies', label: 'Companies', icon: 'store' },
]

export default function Users({ session, companyStatus }) {
  const api = useMemo(() => createUsersApi(session.request, apiConfig), [session.request])
  const status = COMPANY_STATUSES.includes(companyStatus) ? companyStatus : ''
  const [activeTab, setActiveTab] = useState(!status && apiConfig.listPath ? 'individuals' : 'companies')
  const [showAccount, setShowAccount] = useState(false)

  function navigateTabs(event, index) {
    const targets = { ArrowLeft: (index + 1) % tabs.length, ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 }
    const next = tabs[targets[event.key]]
    if (!next) return
    event.preventDefault()
    setActiveTab(next.id)
    document.getElementById(`users-tab-${next.id}`)?.focus()
  }

  return (
    <>
      <PageHeading eyebrow="MANAGEMENT" title="Users">
        <button type="button" className="btn-secondary" onClick={() => setShowAccount(true)}>
          <Icon name="users" size={16} /> My account
        </button>
      </PageHeading>
      <div role="tablist" aria-label="User directories" className="mb-5 inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {tabs.map((tab, index) => (
          <button key={tab.id} id={`users-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id}
            aria-controls="users-panel" tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)}
            onKeyDown={event => navigateTabs(event, index)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-medium ${activeTab === tab.id ? 'bg-[#172b46] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon name={tab.icon} size={16} /> {tab.label}
          </button>
        ))}
      </div>
      <div id="users-panel" role="tabpanel" aria-labelledby={`users-tab-${activeTab}`}>
        {activeTab === 'companies' ? <CompanyDirectory api={api} initialStatus={status} /> : <UsersTable api={api} currentUser={session.account} />}
      </div>
      {showAccount && <UserDetails user={session.account} title="My account" onClose={() => setShowAccount(false)} />}
    </>
  )
}
