import { ApiError } from './client.js'
import { field, queryPath, readPage } from './pagination.js'

const companiesPath = '/api/v1/admin/companies'
export const USER_ROLES = ['SuperAdmin', 'Admin', 'Provider', 'Company', 'CompanyCandidate', 'AlaaEldin']
export const COMPANY_STATUSES = ['Pending', 'Approved', 'Rejected']

function normalizeCompany(company) {
  if (!company || typeof company !== 'object' || Array.isArray(company)) throw new ApiError('The backend returned an invalid company record.')
  const contact = field(company, 'user')
  const rawStatus = field(company, 'companyStatus') ?? field(company, 'status')
  const status = typeof rawStatus === 'string' ? rawStatus.trim() : ''
  return {
    id: field(company, 'companyId') ?? field(company, 'id'),
    name: field(company, 'companyName') || field(company, 'name') || 'Unnamed company',
    email: field(company, 'email') ?? field(company, 'companyEmail') ?? field(contact, 'email'),
    phone: field(company, 'phoneNumber') ?? field(company, 'phone') ?? field(contact, 'phoneNumber'),
    submitted: field(company, 'createdAt') ?? field(company, 'createdOn'),
    status: COMPANY_STATUSES.find(value => value.toLowerCase() === status.toLowerCase()) ?? (status || 'Not provided'),
    adminNote: field(company, 'adminNote') ?? '',
    concurrencyStamp: field(company, 'concurrencyStamp'),
  }
}

export function normalizeUser(user) {
  if (!user || typeof user !== 'object' || Array.isArray(user)) throw new ApiError('The backend returned an invalid user record.')
  const type = user.accountType ?? user.userType
  const accountType = typeof type === 'string' ? ({ individual: 'Individual', company: 'Company' })[type.toLowerCase()] : undefined
  const rawRoles = user.roles ?? user.role ?? []
  const roles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).filter(role => typeof role === 'string')
  return {
    id: user.id ?? user.userId ?? null,
    name: user.fullName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unnamed user',
    email: user.email || '', phone: user.phoneNumber || user.phone || '',
    accountType: accountType || (typeof user.isCompany === 'boolean' ? (user.isCompany ? 'Company' : 'Individual') : 'Unknown'),
    roles, companyName: user.companyName || '', city: user.city || '',
    joined: user.createdAt || user.joined || '', status: user.status || (typeof user.isActive === 'boolean' ? (user.isActive ? 'Active' : 'Inactive') : 'Not provided'),
  }
}

export function createUsersApi(request, { listPath = '', deletePath = '' } = {}) {
  return {
    async getMe(options) {
      return normalizeUser(await request('/api/v1/users/me', options))
    },
    async list(options) {
      if (!listPath) throw new ApiError('The admin endpoint for listing users has not been provided.')
      if (/\/me\/?(?:\?|$)/i.test(listPath)) throw new ApiError('The current-account endpoint cannot be used as the user directory.')
      const data = await request(listPath, options)
      const records = Array.isArray(data) ? data : data?.items
      if (!Array.isArray(records)) throw new ApiError('Expected a users array or an object containing items. Confirm the admin response schema.')
      return { users: records.map(normalizeUser), total: Array.isArray(data) ? data.length : (data.totalCount ?? records.length) }
    },
    async listCompanies({ page, pageSize, search, status }, options) {
      const data = await request(queryPath(companiesPath, { pageNumber: page, pageSize, search, status }), options)
      const result = readPage(data, 'companies', page, pageSize)
      return { ...result, rows: result.rows.map(normalizeCompany) }
    },
    async reviewCompany(id, { isApproved, adminNote, concurrencyStamp }) {
      if (id == null || String(id).trim() === '') throw new ApiError('A company ID is required.')
      return request(`${companiesPath}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: { isApproved, adminNote: adminNote?.trim() || null, concurrencyStamp: concurrencyStamp ?? null },
      })
    },
    async deleteUser(id, options) {
      if (!deletePath || !deletePath.includes('{id}')) throw new ApiError('An admin delete endpoint containing {id} is required.')
      if (id === null || id === undefined || String(id).trim() === '' || String(id).toLowerCase() === 'me') throw new ApiError('A valid user ID is required.')
      const path = deletePath.replaceAll('{id}', encodeURIComponent(String(id)))
      if (/\/me(?:\/|\?|$)/i.test(path)) throw new ApiError('Deleting another user must never use the current-account endpoint.')
      return request(path, { ...options, method: 'DELETE' })
    },
  }
}
