import { ApiError } from './client.js'

export const field = (data, key) => data?.[key] ?? data?.[key[0].toUpperCase() + key.slice(1)]

export function queryPath(path, values) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value != null && value !== '') query.set(key, value)
  }
  return `${path}?${query}`
}

export function readPage(data, entity, page, pageSize) {
  const rows = [data, ...['items', entity, 'results', 'result', 'records', 'data'].map(key => field(data, key))].find(Array.isArray)
  if (!rows) throw new ApiError(`The API did not return a list of ${entity}.`)

  const pagination = field(data, 'pagination') ?? data
  const count = field(pagination, 'totalCount') ?? field(pagination, 'totalItems') ?? field(pagination, 'totalRecords')
  const total = count != null && Number.isInteger(Number(count)) && Number(count) >= 0 ? Number(count) : undefined
  const totalPages = field(pagination, 'totalPages')
  const next = field(pagination, 'hasNextPage')
  const limit = Number(field(pagination, 'pageSize')) || pageSize
  const hasNext = typeof next === 'boolean' ? next : totalPages != null ? page < totalPages : total != null ? page * limit < total : rows.length >= limit
  return { rows, total, hasNext, pageSize: limit }
}
