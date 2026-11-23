import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import EmptyPage from './pages/EmptyPage'
import MarketplaceCategories from './pages/MarketplaceCategories'

const navigation = [
  { section: 'Overview', items: [{ path: 'home', label: 'Home', icon: 'home' }] },
  { section: 'Management', items: [
    { path: 'users', label: 'Users', icon: 'users' },
    { key: 'service', label: 'Service', icon: 'services', children: [
      { path: 'services', label: 'Services' },
      { path: 'appointments', label: 'Appointments' },
    ] },
  ] },
  { section: 'Commerce', items: [
    { key: 'marketplace', label: 'Marketplace', icon: 'marketplace', children: [
      { path: 'marketplace/categories', label: 'Categories' },
      { path: 'marketplace/sub-categories', label: 'Sub categories' },
      { path: 'marketplace/products', label: 'Products' },
      { path: 'marketplace/orders', label: 'Orders' },
    ] },
    { key: 'store', label: 'Store', icon: 'store', children: [
      { path: 'store/categories', label: 'Categories' },
      { path: 'store/sub-categories', label: 'Sub categories' },
      { path: 'store/products', label: 'Products' },
      { path: 'store/orders', label: 'Orders' },
    ] },
  ] },
]

const pages = navigation.flatMap(group => group.items.flatMap(item => item.children || [item]))
const currentPath = () => window.location.hash.slice(2) || 'home'
const isActivePath = (path, target) => path === target || path.startsWith(`${target}/`)

function decodePathId(id) {
  try { return id ? decodeURIComponent(id) : undefined } catch { return id }
}

function NavigationItem({ item, path, expanded, onToggle }) {
  if (!item.children) {
    const active = path === item.path
    return <a href={`#/${item.path}`} aria-current={active ? 'page' : undefined} className={`group mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[12px] font-medium transition-colors ${active ? 'bg-[#2a3b51] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <Icon name={item.icon} size={19} className={active ? 'text-[#efc567]' : 'text-slate-500 group-hover:text-slate-300'} />{item.label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#efc567]" />}
    </a>
  }
  const childActive = item.children.some(child => isActivePath(path, child.path))
  const open = expanded[item.key] || childActive
  return <div className="mb-1">
    <button type="button" onClick={() => onToggle(item.key, open)} aria-expanded={open} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[12px] font-medium transition-colors ${childActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <Icon name={item.icon} size={19} className={childActive ? 'text-[#efc567]' : 'text-slate-500 group-hover:text-slate-300'} />{item.label}
      <Icon name="chevronDown" size={14} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="ml-[21px] border-l border-white/10 pb-1 pl-4">
      {item.children.map(child => { const active = isActivePath(path, child.path); return <a key={child.path} href={`#/${child.path}`} aria-current={active ? 'page' : undefined} className={`mb-0.5 flex items-center rounded-md px-3 py-2.5 text-[11px] transition-colors ${active ? 'bg-white/[0.08] font-medium text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>{child.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#efc567]" />}</a> })}
    </div>}
  </div>
}

export default function App() {
  const [path, setPath] = useState(currentPath)
  const [marketplaceToken, setMarketplaceToken] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded, setExpanded] = useState({})
  useEffect(() => { const navigate = () => { setPath(currentPath()); setMobileOpen(false) }; window.addEventListener('hashchange', navigate); return () => window.removeEventListener('hashchange', navigate) }, [])
  const taxonomyRoute = /^marketplace\/(categories|sub-categories)(?:\/([^/]+))?(?:\/([^/]+)\/form)?$/.exec(path)
  const page = pages.find(item => item.path === (taxonomyRoute ? `marketplace/${taxonomyRoute[1]}` : path))
  const section = path === 'home' ? 'Overview' : ['users', 'services', 'appointments'].includes(path) ? 'Management' : 'Commerce'

  return <div className="min-h-screen bg-[#f6f7f9] text-slate-800">
    {mobileOpen && <button className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#101e35] px-5 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <a href="#/home" className="flex h-[110px] shrink-0 items-center gap-3 border-b border-white/10 px-2" aria-label="Alaa Eldien home">
        <div className="flex h-[65px] w-[53px] items-center justify-center overflow-hidden rounded-xl bg-white"><img src="/alaa-logo.png" alt="Alaa Eldien logo" className="h-[60px] w-auto object-contain" /></div>
        <div><p className="text-[18px] font-bold tracking-tight text-white">Alaa Eldien<span className="text-[#e9b94d]">.</span></p><p className="mt-1 text-[10px] font-medium tracking-[0.21em] text-slate-400">ADMIN DASHBOARD</p></div>
      </a>
      <nav className="flex-1 overflow-y-auto py-7" aria-label="Main navigation">
        {navigation.map(group => <div key={group.section} className="mb-7 last:mb-0"><p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">{group.section}</p>{group.items.map(item => <NavigationItem key={item.path || item.key} item={item} path={path} expanded={expanded} onToggle={(key, open) => setExpanded(value => ({ ...value, [key]: !open }))} />)}</div>)}
      </nav>
      <div className="border-t border-white/10 px-2 py-5"><p className="text-xs font-semibold text-white">Admin workspace</p><p className="mt-1 text-[10px] text-slate-500">Alaa Eldien</p></div>
    </aside>
    <div className="lg:pl-[260px]">
      <header className="flex min-h-[78px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 sm:px-8 xl:px-10">
        <div className="flex items-center gap-3"><button className="icon-button lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button><span className="hidden text-xs text-slate-400 sm:inline">Workspace</span><Icon name="chevronRight" size={13} className="hidden text-slate-300 sm:block" /><span className="text-xs font-semibold text-slate-700">{page?.label || 'Page not found'}</span></div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1e9db] text-[10px] font-bold text-[#7e6746]">AE</span>
      </header>
      <main className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 sm:py-8 xl:px-10">
        {taxonomyRoute ? (
          <MarketplaceCategories key={path} token={marketplaceToken} onConnect={setMarketplaceToken}
            view={taxonomyRoute[1] === 'sub-categories' ? 'subcategories' : 'categories'}
            categoryId={decodePathId(taxonomyRoute[2])} subcategoryId={decodePathId(taxonomyRoute[3])} />
        ) : page ? <EmptyPage key={path} title={page.label} section={section} /> : <div className="panel p-12 text-center"><h1 className="text-xl font-semibold">Page not found</h1><a href="#/home" className="btn-primary mt-5 inline-flex">Go to Home</a></div>}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-5 text-[10px] text-slate-400"><p>© 2026 Alaa Eldien. All rights reserved.</p><p>Admin dashboard</p></footer>
      </main>
    </div>
  </div>
}
