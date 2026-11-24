import { useCallback, useMemo, useState } from 'react'
import { createCommerceApi } from '../api/commerce'
import DataTable from '../components/DataTable'
import { ServiceDialog, ServiceField, ServiceMutation } from '../components/ServiceControls'
import { PageHeading, StatusBadge } from '../components/UI'
import formatAmount from '../components/formatAmount'
import useApiData from '../hooks/useApiData'

const pageSize = 10
const statuses = {
  Pending: 'Pending', Confirmed: 'Confirmed', Processing: 'Processing', Shipped: 'Shipped', Delivered: 'Delivered',
  CancelledByPartner: 'Cancelled by partner', CancelledByCustomer: 'Cancelled by customer',
}
const progressions = { Pending: 'Confirmed', Confirmed: 'Processing', Processing: 'Shipped', Shipped: 'Delivered' }
const channelLabels = { store: 'Store', marketplace: 'Marketplace' }
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' })
const columns = [
  { key: 'id', label: 'Order', render: row => <span className="font-semibold text-[#172b46]">{row.number ?? row.id ?? '—'}</span> },
  { key: 'customer', label: 'Customer' },
  { key: 'date', label: 'Date', render: row => row.date && Number.isFinite(Date.parse(row.date)) ? dateFormat.format(new Date(row.date)) : '—' },
  { key: 'items', label: 'Items' },
  { key: 'amount', label: 'Total', render: row => formatAmount(row.amount, row.currency === 'EGY' ? 'EGP' : row.currency) },
  { key: 'payment', label: 'Payment method' },
  { key: 'status', label: 'Order status', render: row => row.status ? <StatusBadge status={statuses[row.status] ?? row.status} /> : '—' },
]

function OrderDetails({ api, scope, order, onClose, onSaved }) {
  const [editing, setEditing] = useState(false)
  const status = Object.keys(statuses).find(key => key.toLowerCase() === String(order.status).toLowerCase())
  const next = progressions[status]
  const changes = next ? scope === 'customer' ? ['CancelledByCustomer'] : [next, 'CancelledByPartner'] : []
  const title = `Order ${order.number ?? order.id}`
  if (editing) {
    return <ServiceMutation title="Update order status" onClose={() => setEditing(false)} onSubmit={async data => {
      const status = data.get('status')
      if (!changes.includes(status)) throw new Error('Choose an available status.')
      await api.changeOrderStatus(order.id, { status, concurrencyStamp: order.concurrencyStamp ?? null })
      onSaved('Order status updated.')
      onClose()
    }}>
      <p className="text-sm text-slate-600">{title}</p>
      <ServiceField label="New status">
        <select className="field" name="status" required defaultValue="">
          <option value="">Choose a status</option>
          {changes.map(value => <option key={value} value={value}>{statuses[value]}</option>)}
        </select>
      </ServiceField>
    </ServiceMutation>
  }
  return (
    <ServiceDialog title={title} onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-700">
        {order.status && <StatusBadge status={statuses[status] ?? order.status} />}
        <span>{channelLabels[order.salesChannel] ?? 'Channel unclassified'}</span>
        <span>{formatAmount(order.amount, order.currency === 'EGY' ? 'EGP' : order.currency)}</span>
      </div>
      {order.lineItems.length > 0 && <ul className="divide-y divide-slate-100">
        {order.lineItems.map((item, index) => <li key={`${item.id}-${index}`} className="flex justify-between gap-3 py-2 text-sm">
          <span>{item.name ?? item.id ?? 'Product'}</span><span>{item.quantity ?? '—'}</span>
        </li>)}
      </ul>}
      {order.id != null && changes.length > 0 && <button className="btn-primary mt-4" type="button" onClick={() => setEditing(true)}>Change status</button>}
    </ServiceDialog>
  )
}

export default function CommerceOrders({ request, salesChannel = '', initialScope = 'partner' }) {
  const api = useMemo(() => createCommerceApi(request, salesChannel), [request, salesChannel])
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [scope, setScope] = useState(initialScope)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const loadOrders = useCallback(signal => api.getOrders({ page, pageSize, status, scope }, { signal }), [api, page, status, scope])
  const orders = useApiData(loadOrders)
  const rows = salesChannel ? orders.data?.rows.filter(row => row.salesChannel === salesChannel.toLowerCase()) : orders.data?.rows
  const forbidden = orders.error?.status === 403
  const orderColumns = [
    ...columns,
    ...(!salesChannel ? [{ key: 'salesChannel', label: 'Sales channel', render: row => channelLabels[row.salesChannel] ?? 'Unclassified' }] : []),
    { key: 'actions', label: 'Actions', render: row => <button className="btn-secondary" type="button" onClick={() => setSelected(row)}>View details</button> },
  ]
  return (
    <>
      <PageHeading eyebrow={salesChannel ? salesChannel.toUpperCase() : 'COMMERCE'} title="Orders" description="Order history and status changes for the signed-in account." />
      {notice && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800" role="status">{notice}</p>}
      <DataTable title="Order history" rows={rows} columns={orderColumns} pageSize={orders.data?.pageSize ?? pageSize} showDetails={false}
        loading={orders.loading} error={forbidden ? `This account does not have access to ${scope} orders.` : orders.error?.message}
        onRetry={forbidden ? undefined : orders.reload}
        emptyMessage={salesChannel ? `No ${salesChannel} orders on this page.` : 'No orders found.'}
        description={salesChannel && orders.data?.rows.some(row => !row.salesChannel) ? 'See All orders for orders without a sales channel.' : undefined}
        pagination={{ page, total: salesChannel ? undefined : orders.data?.total, hasNext: orders.data?.hasNext, onChange: setPage }}
        controls={
          <div className="flex flex-wrap gap-2">
            <select className="field" aria-label="Order scope" value={scope} onChange={event => {
              setScope(event.target.value)
              setPage(1)
            }}><option value="partner">Partner orders</option><option value="customer">Customer orders</option></select>
            <select className="field" aria-label="Filter orders by status" value={status} onChange={event => {
              setStatus(event.target.value)
              setPage(1)
            }}>
              <option value="">All statuses</option>
              {Object.entries(statuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            {salesChannel && <a className="btn-secondary" href={`#/orders?scope=${scope}`}>All orders</a>}
          </div>
        }
      />
      {selected && <OrderDetails api={api} scope={scope} order={selected} onClose={() => setSelected(null)}
        onSaved={message => { setNotice(message); orders.reload() }} />}
    </>
  )
}
