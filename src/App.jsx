import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import Home from './pages/Home'
import Users from './pages/Users'
import Services from './pages/Services'
import ServiceAppointments from './pages/ServiceAppointments'
import Marketplace from './pages/Marketplace'
import MarketplaceOrders from './pages/MarketplaceOrders'
import Store from './pages/Store'

const pages = [
  { path: 'home', label: 'Home', icon: 'home', component: Home, section: 'Overview' },
  { path: 'users', label: 'Users', icon: 'users', component: Users, section: 'Management' },
  { path: 'services', label: 'Services', icon: 'services', component: Services, section: 'Management' },
  { path: 'service-appointments', label: 'Service appointments', icon: 'calendar', component: ServiceAppointments, section: 'Management' },
  { path: 'marketplace', label: 'Marketplace', icon: 'marketplace', component: Marketplace, section: 'Commerce' },
  { path: 'marketplace-orders', label: 'Marketplace orders', icon: 'orders', component: MarketplaceOrders, section: 'Commerce' },
  { path: 'store', label: 'Store', icon: 'store', component: Store, section: 'Commerce' },
]
const currentPath = () => window.location.hash.slice(2) || 'users'

export default function App() {
  const [path, setPath] = useState(currentPath)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  useEffect(() => {
    const navigate = () => { setPath(currentPath()); setMobileOpen(false); setSearch('') }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  const page = pages.find(item => item.path === path)
  const Page = page?.component

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-800">
      {mobileOpen && <button className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#101e35] px-5 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <a href="#/home" className="flex h-[102px] shrink-0 items-center gap-3 border-b border-white/10 px-2" aria-label="Alaa Eldien home">
          <div className="flex h-[65px] w-[53px] items-center justify-center overflow-hidden rounded-xl bg-white"><img src="/alaa-logo.png" alt="Alaa Eldien logo" className="h-[60px] w-auto object-contain" /></div>
          <div><p className="text-[18px] font-bold tracking-tight text-white">Alaa Eldien<span className="text-[#e9b94d]">.</span></p><p className="mt-1 text-[10px] font-medium tracking-[0.21em] text-slate-400">ADMIN DASHBOARD</p></div>
        </a>
        <nav className="flex-1 space-y-1 overflow-y-auto pt-7" aria-label="Main navigation">
          {pages.map((item, index) => <div key={item.path}>
            {(index === 0 || pages[index - 1].section !== item.section) && <p className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500 ${index ? 'mt-7' : ''}`}>{item.section}</p>}
            <a href={`#/${item.path}`} aria-current={path === item.path ? 'page' : undefined} className={`group mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[12px] font-medium transition-colors ${path === item.path ? 'bg-[#2a3b51] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon name={item.icon} size={19} className={path === item.path ? 'text-[#efc567]' : 'text-slate-500 group-hover:text-slate-300'} />{item.label}
              {path === item.path && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#efc567]" />}
            </a>
          </div>)}
        </nav>
        <div className="mb-5 mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-4"><div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Workspace preview</div><p className="text-[11px] leading-5 text-slate-500">Your business, at a glance.<br />Other dashboard pages use demo data.</p></div>
        <div className="flex items-center gap-3 border-t border-white/10 px-1 py-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9c6a0] text-xs font-bold text-[#26364a]">YA</div><div><p className="text-xs font-semibold text-white">{path === 'users' ? 'Admin workspace' : 'Yasser Ahmed'}</p><p className="mt-1 text-[10px] text-slate-500">Administrator</p></div><span className="ml-auto text-slate-500"><Icon name="shield" size={17} /></span></div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="flex min-h-[78px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 sm:px-8 xl:px-10">
          <div className="flex items-center gap-3"><button className="icon-button lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button><span className="hidden text-xs text-slate-400 sm:inline">Workspace</span><Icon name="chevronRight" size={13} className="hidden text-slate-300 sm:block" /><span className="text-xs font-semibold text-slate-700">{page?.label || 'Page not found'}</span></div>
          <div className="flex items-center gap-3 sm:gap-5">
            {path !== 'home' && <label className="relative hidden sm:block"><Icon name="search" size={16} className="absolute left-3 top-2.5 text-slate-400" /><input className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-slate-400 xl:w-56" value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${page?.label.toLowerCase() || 'page'}...`} aria-label="Search current page" /></label>}
            <span className="hidden rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 md:block">{path === 'users' ? 'User management' : 'Demo workspace'}</span><span className="h-7 w-px bg-slate-200" /><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1e9db] text-[10px] font-bold text-[#7e6746]">YA</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 sm:py-8 xl:px-10">
          {Page ? <Page key={path} search={search} /> : <div className="panel p-12 text-center"><h1 className="text-xl font-semibold">Page not found</h1><a href="#/home" className="btn-primary mt-5 inline-flex">Go to Home</a></div>}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-5 text-[10px] text-slate-400"><p>© 2026 Alaa Eldien. All rights reserved.</p><p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />{path === 'users' ? 'Users workspace' : 'Dashboard preview · Dummy data'}</p></footer>
        </main>
      </div>
    </div>
  )
}
