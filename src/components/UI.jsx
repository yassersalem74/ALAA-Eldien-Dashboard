import { useEffect, useRef } from 'react'
import Icon from './Icon'

export function PageHeading({ eyebrow = 'YOUR WORKSPACE', title, description, children }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-[9px] font-semibold tracking-[0.18em] text-slate-400">{eyebrow}</p><h1 className="text-[26px] font-semibold leading-tight tracking-[-0.035em] text-[#172b46] sm:text-[28px]">{title}</h1><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p></div><div className="flex flex-wrap gap-2.5">{children}</div></div>
}
export function StatusBadge({ status }) {
  const colors = { Active: 'bg-emerald-50 text-emerald-700', Delivered: 'bg-emerald-50 text-emerald-700', Completed: 'bg-emerald-50 text-emerald-700', Paid: 'bg-emerald-50 text-emerald-700', 'In stock': 'bg-emerald-50 text-emerald-700', Confirmed: 'bg-blue-50 text-blue-700', Shipped: 'bg-blue-50 text-blue-700', 'In progress': 'bg-blue-50 text-blue-700', Processing: 'bg-blue-50 text-blue-700', Pending: 'bg-amber-50 text-amber-700', 'Low stock': 'bg-amber-50 text-amber-700' }
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium ${colors[status] || 'bg-slate-100 text-slate-500'}`}><span className="h-1 w-1 rounded-full bg-current" />{status}</span>
}
export function Avatar({ name, index = 0 }) {
  const colors = ['bg-[#e5ebf5] text-[#5b739e]', 'bg-[#f2e7d8] text-[#a17d4f]', 'bg-[#e2eee7] text-[#638a76]', 'bg-[#eee5f2] text-[#9873a6]']
  return <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${colors[index % colors.length]}`}>{name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
}
export function MetricCard({ label, value, change, icon, detail, index = 0 }) {
  const colors = ['bg-[#edf2f9] text-[#53719e]', 'bg-[#f4eee2] text-[#ae8b45]', 'bg-[#e9f2ee] text-[#57917b]', 'bg-[#eeeaf6] text-[#8d77af]']
  return <div className="panel p-5"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-medium text-slate-500">{label}</p><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[index % colors.length]}`}><Icon name={icon} size={18} /></div></div><p className="mt-3 text-[27px] font-semibold leading-none tracking-[-0.04em] text-[#172b46]">{value}</p><p className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400">{change && <span className="flex items-center gap-0.5 font-medium text-emerald-600"><Icon name="arrowUp" size={12} />{change}</span>}{detail || 'vs. last month'}</p></div>
}
export function ExportButton({ rows, filename = 'report' }) {
  const download = () => {
    if (!rows.length) return
    const fields = Object.keys(rows[0])
    const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [fields, ...rows.map(row => fields.map(key => row[key]))].map(row => row.map(escape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a'); link.href = url; link.download = `alaa-eldien-${filename}.csv`; link.click(); URL.revokeObjectURL(url)
  }
  return <button className="btn-secondary" onClick={download} disabled={!rows.length}><Icon name="download" size={15} />Export report</button>
}
export function DetailDialog({ item, title, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current.showModal()
  }, [])
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}><div className="modal-box max-w-lg rounded-2xl bg-white p-6"><div className="mb-5 flex items-center justify-between"><div><p className="mb-1 text-[10px] uppercase tracking-widest text-slate-400">Demo record</p><h2 className="text-lg font-semibold text-[#172b46]">{title}</h2></div><button className="icon-button" aria-label="Close details" onClick={onClose}><Icon name="close" /></button></div><dl className="divide-y divide-slate-100">{Object.entries(item).filter(([key]) => !['icon', 'color', 'illustration'].includes(key)).map(([key, value]) => <div key={key} className="flex justify-between gap-6 py-3 text-xs"><dt className="capitalize text-slate-400">{key}</dt><dd className="text-right font-medium text-slate-700">{key === 'status' ? <StatusBadge status={value} /> : String(value)}</dd></div>)}</dl><button className="btn-secondary mt-5 w-full" onClick={onClose}>Close details</button></div></dialog>
}
