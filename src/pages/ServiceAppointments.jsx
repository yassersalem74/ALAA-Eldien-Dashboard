import DataTable from '../components/DataTable'
import { Avatar, ExportButton, MetricCard, PageHeading, StatusBadge } from '../components/UI'
import { appointments, money } from '../data/demo'

const columns = [
  { key: 'id', label: 'Appointment', render: row => <span className="font-medium text-[#526d91]">{row.id}</span> },
  { key: 'customer', label: 'Customer', render: (row, index) => <div className="flex items-center gap-2.5"><Avatar name={row.customer} index={index} /><span className="font-medium text-slate-700">{row.customer}</span></div> },
  { key: 'service', label: 'Service' }, { key: 'date', label: 'Schedule', render: row => <div>{row.date}<p className="mt-1 text-[10px] text-slate-400">{row.time}</p></div> },
  { key: 'amount', label: 'Amount', render: row => money(row.amount) }, { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
]
export default function ServiceAppointments({ search }) {
  return <><PageHeading eyebrow="MANAGEMENT" title="Service appointments" description="Keep track of scheduled services and the people making them happen."><ExportButton rows={appointments} filename="appointments" /></PageHeading><div className="mb-6 grid gap-4 sm:grid-cols-3"><MetricCard label="Appointments in preview" value={appointments.length} icon="calendar" detail="All scheduled demo services" /><MetricCard label="Today’s appointments" value="3" icon="clock" index={1} detail="Monday, October 19" /><MetricCard label="Awaiting confirmation" value={appointments.filter(item => item.status === 'Pending').length} icon="orders" index={3} detail="Pending bookings" /></div><DataTable title="Service appointments" description="Schedules, customers, and booking statuses" rows={appointments} columns={columns} statuses={['Pending', 'Confirmed', 'In progress', 'Completed', 'Cancelled']} search={search} /></>
}
