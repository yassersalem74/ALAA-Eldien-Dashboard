import { useState } from 'react'
import { money } from '../data/demo'

export default function SalesChart({ data }) {
  const [hovered, setHovered] = useState(null)
  const max = 50000
  const plot = { left: 52, right: 628, top: 20, bottom: 230 }
  const x = index => plot.left + index * (plot.right - plot.left) / (data.length - 1)
  const y = value => plot.bottom - value / max * (plot.bottom - plot.top)
  const line = key => data.map((item, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(item[key])}`).join(' ')
  return <div className="relative mt-5"><svg viewBox="0 0 650 275" className="w-full overflow-visible" role="img" aria-label="Sales in Egyptian pounds by month. Navy represents marketplace sales and gold represents services.">
    <defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#45638c" stopOpacity=".12" /><stop offset="100%" stopColor="#45638c" stopOpacity="0" /></linearGradient></defs>
    {[0, 10000, 20000, 30000, 40000, 50000].map(value => <g key={value}><line x1={plot.left} x2={plot.right} y1={y(value)} y2={y(value)} stroke="#edf0f4" strokeDasharray="4 5" /><text x={plot.left - 12} y={y(value) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{value === 0 ? '0' : `${value / 1000}k`}</text></g>)}
    <text x="4" y="8" fontSize="8" fill="#94a3b8">EGP</text>
    <path d={`${line('marketplace')} L ${plot.right} ${plot.bottom} L ${plot.left} ${plot.bottom} Z`} fill="url(#sales-fill)" />
    <path d={line('marketplace')} fill="none" stroke="#294e7a" strokeWidth="2.5" strokeLinejoin="round" />
    <path d={line('services')} fill="none" stroke="#d1ae65" strokeWidth="2.5" strokeLinejoin="round" />
    {data.map((item, index) => <g key={item.month} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)}>
      <rect x={x(index) - 23} y="0" width="46" height="250" fill="transparent" />
      <circle cx={x(index)} cy={y(item.marketplace)} r={hovered === index ? 5 : 3.5} fill="white" stroke="#294e7a" strokeWidth="2" />
      <circle cx={x(index)} cy={y(item.services)} r={hovered === index ? 5 : 3.5} fill="white" stroke="#d1ae65" strokeWidth="2" />
      <text x={x(index)} y="253" textAnchor="middle" fontSize="9" fill="#94a3b8">{item.month}</text>
    </g>)}
  </svg>{hovered !== null && <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] shadow-lg"><p className="mb-1 font-semibold">{data[hovered].month} 2026</p><p className="text-[#294e7a]">Marketplace: {money(data[hovered].marketplace)}</p><p className="text-[#ae8b45]">Services: {money(data[hovered].services)}</p></div>}</div>
}
