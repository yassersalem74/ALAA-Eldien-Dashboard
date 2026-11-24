import { useCallback, useMemo, useState } from 'react'
import { createMarketplaceApi } from '../api/marketplace'
import DataTable from '../components/DataTable'
import { PageHeading, StatusBadge } from '../components/UI'
import formatAmount from '../components/formatAmount'
import useMarketplaceData from '../hooks/useMarketplaceData'

const pageSize = 10
const statuses = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  CancelledByPartner: 'Cancelled by partner',
  CancelledByCustomer: 'Cancelled by customer',
}
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' })
const columns = [
  { key: 'id', label: 'Order', render: row => <span className="font-semibold text-[#172b46]">{row.number ?? row.id ?? '—'}</span> },
  { key: 'customer', label: 'Customer' },
  { key: 'date', label: 'Date', render: row => row.date && Number.isFinite(Date.parse(row.date)) ? dateFormat.format(new Date(row.date)) : '—' },
  { key: 'items', label: 'Items' },
  { key: 'amount', label: 'Total', render: row => formatAmount(row.amount, row.currency) },
  { key: 'payment', label: 'Payment method' },
  { key: 'status', label: 'Order status', render: row => row.status ? <StatusBadge status={statuses[row.status] ?? row.status} /> : '—' },
]

export default function MarketplaceOrders({ request }) {
  const api = useMemo(() => createMarketplaceApi(request), [request])
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const loadOrders = useCallback(signal => api.getPartnerOrders({ page, pageSize, status }, { signal }), [api, page, status])
  const orders = useMarketplaceData(loadOrders)
  const forbidden = orders.error?.status === 403

  return (
    <>
      <PageHeading eyebrow="MARKETPLACE" title="Orders" description="Marketplace orders available to the signed-in partner account." />
      <DataTable title="Order history" rows={orders.data?.rows} columns={columns} pageSize={pageSize} showDetails={false}
        loading={orders.loading} error={forbidden ? 'This account does not have access to partner orders.' : orders.error?.message}
        onRetry={forbidden ? undefined : orders.reload} emptyMessage="No Marketplace orders on this page."
        description={orders.data?.hasUnclassifiedOrders ? 'Only orders identified as Marketplace are shown.' : undefined}
        pagination={{ page, hasNext: orders.data?.hasNext, onChange: setPage }}
        controls={
          <select className="field" aria-label="Filter orders by status" value={status} onChange={event => {
            setStatus(event.target.value)
            setPage(1)
          }}>
            <option value="">All statuses</option>
            {Object.entries(statuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        }
      />
    </>
  )
}
