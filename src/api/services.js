import { ApiError } from './client.js'
import { field, queryPath, readPage } from './pagination.js'

export const serviceCategories = { Car_Care: 'Car care', Personal_Care: 'Personal care', Home_Care: 'Home care' }
export const recurrences = ['Daily', 'Weekly', 'Monthly']
export const serviceRoles = ['AlaaEldin', 'Provider', 'Company']

const base = '/api/v1'
const idPath = (path, id) => `${path}/${encodeURIComponent(id)}`
const label = value => typeof value === 'string' ? value : field(value, 'name') ?? field(value, 'fullName')

function collection(data, ...keys) {
  const records = [data, ...['items', 'results', ...keys].map(key => field(data, key))].find(Array.isArray)
  if (!records && data != null) throw new ApiError('The API did not return a list.')
  return records ?? []
}

function recordArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value) {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
    throw new ApiError('The API returned an invalid list of details.')
  }
  return undefined
}

function namedRow(row) {
  const nameEn = field(row, 'nameEn')
  const nameAr = field(row, 'nameAr')
  return {
    id: field(row, 'id') ?? field(row, 'serviceNameId') ?? field(row, 'governorateId') ?? field(row, 'neighborhoodId'),
    name: field(row, 'name') || nameEn || nameAr || 'Unnamed',
    nameEn, nameAr, concurrencyStamp: field(row, 'concurrencyStamp'),
  }
}

function listingRow(data) {
  const row = field(data, 'service') ?? field(data, 'package') ?? data
  const name = field(row, 'serviceName')
  const category = field(row, 'categoryName') ?? field(row, 'category')
  const governorate = field(row, 'governorate')
  const neighborhoods = field(row, 'neighborhoods')
  const provider = field(row, 'partner') ?? field(row, 'provider')
  return {
    id: field(row, 'id') ?? field(row, 'serviceId') ?? field(row, 'packageId'),
    name: field(row, 'name') ?? label(name) ?? field(row, 'packageName'),
    serviceNameId: field(row, 'serviceNameId') ?? field(name, 'id'),
    category: label(category),
    price: field(row, 'price') ?? field(row, 'servicePrice'),
    currency: field(row, 'currency'),
    duration: field(row, 'timeslotDurationInMin') ?? field(row, 'serviceDurationInMin'),
    provider: field(row, 'partnerName') ?? field(row, 'providerName') ?? label(provider),
    description: field(row, 'description'),
    subDescription: field(row, 'subDescription'),
    governorate: label(governorate) ?? field(row, 'governorateName'),
    governorateId: field(row, 'governorateId') ?? field(governorate, 'id'),
    neighborhoods: Array.isArray(neighborhoods) ? neighborhoods.map(namedRow) : [],
    neighborhoodIds: recordArray(field(row, 'neighborhoodIds')) ?? (Array.isArray(neighborhoods) ? neighborhoods.map(item => typeof item === 'string' ? item : namedRow(item).id).filter(Boolean) : undefined),
    recurrence: field(row, 'recurrence'),
    totalOccurrences: field(row, 'totalOccurrences'),
    concurrencyStamp: field(row, 'concurrencyStamp'),
    items: recordArray(field(row, 'items') ?? field(row, 'itemsJson'))?.map(item => ({
      id: field(item, 'id') ?? field(item, 'itemId'),
      name: field(item, 'name'),
      price: field(item, 'price'),
      description: field(item, 'description'),
    })),
    agendas: recordArray(field(row, 'agendas') ?? field(row, 'agendasJson'))?.map(item => ({
      day: field(item, 'day'), from: field(item, 'from'), to: field(item, 'to'),
    })),
    images: collection(field(row, 'images') ?? field(row, 'imageUrls')).map(image => typeof image === 'string' ? image : field(image, 'url') ?? field(image, 'imageUrl')).filter(Boolean),
  }
}

function bookingRow(row) {
  const listing = field(row, 'service') ?? field(row, 'package')
  return {
    id: field(row, 'id') ?? field(row, 'appointmentId') ?? field(row, 'occurrenceId') ?? field(row, 'subscriptionId') ?? field(row, 'packageSubscriptionId'),
    title: label(field(row, 'serviceName')) ?? label(field(row, 'packageName')) ?? label(listing),
    serviceId: field(row, 'serviceId') ?? field(field(row, 'service'), 'id'),
    customer: field(row, 'customerName') ?? label(field(row, 'customer')),
    partner: field(row, 'partnerName') ?? label(field(row, 'partner')),
    date: field(row, 'date') ?? field(row, 'appointmentDate') ?? field(row, 'startDate'),
    from: field(row, 'from'),
    to: field(row, 'to'),
    status: field(row, 'status'),
    price: field(row, 'totalPrice'),
    currency: field(row, 'currency'),
    recurrence: field(row, 'recurrence'),
    concurrencyStamp: field(row, 'concurrencyStamp') ?? field(row, 'packageSubscriptionConcurrencyStamp'),
    securityStamp: field(row, 'securityStamp') ?? field(row, 'concurrencyStamp'),
  }
}

export function createServicesApi(request) {
  async function page(path, filters, normalize, options) {
    const data = await request(queryPath(`${base}/${path}`, filters), options)
    const result = readPage(data, path, filters.page, filters.pageSize)
    return { ...result, rows: result.rows.map(normalize) }
  }
  const json = (path, method, body) => request(path, { method, body })
  return {
    listListings: (kind, filters, options) => page(kind, filters, listingRow, options),
    async getService(id, language, options) {
      return listingRow(await request(queryPath(idPath(`${base}/services`, id), { language }), options))
    },
    saveListing(kind, id, body) {
      const path = `${base}/${kind}`
      return json(id == null ? path : idPath(path, id), id == null ? 'POST' : 'PUT', body)
    },
    deleteListing: (kind, id) => json(idPath(`${base}/${kind}`, id), 'DELETE'),
    async getNames(language, search, options) {
      const data = await request(queryPath(`${base}/service-names`, { language, search }), options)
      return collection(data, 'serviceNames', 'names').map(namedRow)
    },
    saveName(id, body) {
      const path = `${base}/admin/service-names`
      return json(id == null ? path : idPath(path, id), id == null ? 'POST' : 'PUT', body)
    },
    deleteName: id => json(idPath(`${base}/admin/service-names`, id), 'DELETE'),
    async getGovernorates(language, options) {
      return collection(await request(queryPath(`${base}/governorates`, { language }), options), 'governorates').map(namedRow)
    },
    async getNeighborhoods(governorateId, language, options) {
      return collection(await request(queryPath(`${base}/neighborhoods`, { governorateId, language }), options), 'neighborhoods').map(namedRow)
    },
    saveLocation(kind, id, body) {
      const path = `${base}/admin/${kind}`
      return json(id == null ? path : idPath(path, id), id == null ? 'POST' : 'PUT', body)
    },
    deleteLocation: (kind, id) => json(idPath(`${base}/admin/${kind}`, id), 'DELETE'),
    listBookings: (kind, filters, options) => page(kind, filters, bookingRow, options),
    async getAvailability(id, date, options) {
      const data = await request(queryPath(idPath(`${base}/appointments/availabilities/service`, id), { date }), options)
      return collection(data, 'slots', 'timeSlots', 'availabilities', 'availableAppointments')
        .filter(slot => field(slot, 'isAvailable') !== false)
        .map(slot => ({ from: field(slot, 'from') ?? field(slot, 'startTime'), to: field(slot, 'to') ?? field(slot, 'endTime') }))
        .filter(slot => slot.from && slot.to)
    },
    bookAppointment: (id, body) => json(idPath(`${base}/appointments/book/service`, id), 'POST', body),
    changeAppointment(id, status, securityStamp) {
      if (!securityStamp) throw new ApiError('This appointment has no security stamp. Refresh the appointment list.')
      return json(queryPath(`${idPath(`${base}/appointments`, id)}/change-status`, { status, securityStamp }), 'PATCH')
    },
    reschedule: (id, body) => json(`${idPath(`${base}/appointments`, id)}/reschedule`, 'PUT', body),
    subscribe: (id, body) => json(idPath(`${base}/subscriptions/package`, id), 'POST', body),
    changeSubscription: (id, body) => json(`${idPath(`${base}/subscriptions`, id)}/change-status`, 'PATCH', body),
    complete: (kind, id, body) => json(`${idPath(`${base}/${kind}`, id)}/completed`, 'POST', body),
  }
}
