import DataTable from '../components/DataTable'
import { Avatar, ExportButton, MetricCard, PageHeading, StatusBadge } from '../components/UI'
import { money, orders } from '../data/demo'

const columns = [
  { key: 'id', label: 'Order ID', render: row => <span className="font-medium text-[#526d91]">{row.id}</span> },
  { key: 'customer', label: 'Customer', render: (row, index) => <div className="flex items-center gap-2.5"><Avatar name={row.customer} index={index} /><span className="font-medium text-slate-700">{row.customer}</span></div> },
  { key: 'date', label: 'Date' }, { key: 'items', label: 'Items' }, { key: 'amount', label: 'Total', render: row => <span className="font-medium text-slate-700">{money(row.amount)}</span> },
  { key: 'payment', label: 'Payment', render: row => <StatusBadge status={row.payment} /> }, { key: 'status', label: 'Order status', render: row => <StatusBadge status={row.status} /> },
]
export default function MarketplaceOrders({ search }) {
  return <><PageHeading eyebrow="COMMERCE" title="Marketplace orders" description="Follow every order through its journey, all in one view."><ExportButton rows={orders} filename="marketplace-orders" /></PageHeading><div className="mb-6 grid gap-4 sm:grid-cols-3"><MetricCard label="Orders in preview" value={orders.length} icon="orders" detail="Latest marketplace orders" /><MetricCard label="Paid order value" value={money(orders.filter(order => order.payment === 'Paid').reduce((sum, order) => sum + order.amount, 0))} icon="wallet" index={1} detail="Across the demo records" /><MetricCard label="Delivered orders" value={orders.filter(order => order.status === 'Delivered').length} icon="check" index={2} detail="Successfully completed" /></div><DataTable title="Marketplace orders" description="Your latest transactions and fulfillment activity" rows={orders} columns={columns} statuses={['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']} search={search} /></>
}
