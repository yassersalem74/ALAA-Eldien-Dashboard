import DataTable from '../components/DataTable'
import Icon from '../components/Icon'
import ProductArt from '../components/ProductArt'
import { ExportButton, MetricCard, PageHeading, StatusBadge } from '../components/UI'
import { money, products } from '../data/demo'

const columns = [
  { key: 'name', label: 'Product', render: row => <div className="flex items-center gap-3"><ProductArt product={row} small /><div><p className="font-medium text-slate-700">{row.name}</p><p className="mt-1 text-[10px] text-slate-400">{row.id}</p></div></div> },
  { key: 'category', label: 'Category' }, { key: 'seller', label: 'Seller' }, { key: 'price', label: 'Unit price', render: row => money(row.price) }, { key: 'stock', label: 'Stock', render: row => <span className={row.stock < 10 ? 'font-medium text-amber-600' : ''}>{row.stock} units</span> }, { key: 'sold', label: 'Sold' }, { key: 'status', label: 'Availability', render: row => <StatusBadge status={row.status} /> },
]
export default function Store({ search }) {
  return <><PageHeading eyebrow="COMMERCE" title="Store" description="Keep an eye on your catalog, stock levels, and product performance."><ExportButton rows={products} filename="inventory" /></PageHeading><div className="mb-6 grid gap-4 sm:grid-cols-3"><MetricCard label="Products in catalog" value={products.length} icon="box" detail="Across all store categories" /><MetricCard label="Units in stock" value={products.reduce((sum, product) => sum + product.stock, 0)} icon="store" index={2} detail="Available across your catalog" /><MetricCard label="Inventory value" value={money(products.reduce((sum, product) => sum + product.stock * product.price, 0))} icon="wallet" index={1} detail="Based on current unit prices" /></div><div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 p-4"><Icon name="box" size={19} className="mt-0.5 shrink-0 text-amber-600" /><div><p className="text-xs font-medium text-amber-800">A few essentials need a restock</p><p className="mt-1 text-[11px] leading-5 text-amber-700/80">Canvas everyday tote and Portable speaker are running low. Insulated water bottle is out of stock.</p></div></div><DataTable title="Store inventory" description="Product availability and stock at a glance" rows={products} columns={columns} statuses={['In stock', 'Low stock', 'Out of stock']} search={search} /></>
}
