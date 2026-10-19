import { users } from './demo'

export const previewUsers = [
  ...users.map((user, index) => ({ ...user, accountType: 'Individual', roles: [['SuperAdmin'], ['Admin'], ['Provider'], ['AlaaEldin'], ['Provider'], ['Admin'], ['Provider'], ['AlaaEldin'], ['Provider']][index], companyName: '' })),
  { id: 'CMP-001', name: 'Cairo Home Services', companyName: 'Cairo Home Services', email: 'hello@cairohome.example', phone: '+20 100 555 0101', city: 'Cairo', joined: 'Oct 16, 2026', accountType: 'Company', roles: ['Company'], status: 'Active' },
  { id: 'CMP-002', name: 'Delta Maintenance', companyName: 'Delta Maintenance', email: 'contact@delta.example', phone: '+20 100 555 0102', city: 'Alexandria', joined: 'Oct 14, 2026', accountType: 'Company', roles: ['Company', 'Provider'], status: 'Active' },
  { id: 'CMP-003', name: 'Nile Trading', companyName: 'Nile Trading', email: 'info@niletrading.example', phone: '+20 100 555 0103', city: 'Giza', joined: 'Oct 10, 2026', accountType: 'Company', roles: ['Company'], status: 'Inactive' },
]
