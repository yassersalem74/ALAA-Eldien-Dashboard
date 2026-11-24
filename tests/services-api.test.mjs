import test from 'node:test'
import assert from 'node:assert/strict'
import { createServicesApi } from '../src/api/services.js'

test('service listing, details, names and availability use the documented queries', async () => {
  const calls = []
  const api = createServicesApi(async path => {
    calls.push(path)
    if (path.includes('/availabilities/')) return { slots: [{ From: '09:00', To: '10:00' }, { From: '10:00', To: '11:00', IsAvailable: false }] }
    if (path.startsWith('/api/v1/service-names')) return [{ ServiceNameId: 'n1', Name: 'Cleaning' }]
    if (path.includes('/services/')) return { ServiceId: 's/1', ItemsJson: '[{"Id":"i1","Name":"Extra","Price":10}]' }
    return { items: [{ ServiceId: 's/1', ServiceName: 'Cleaning', TimeslotDurationInMin: 60 }], totalCount: 21 }
  })

  const list = await api.listListings('services', { page: 1, pageSize: 10, category: 'Home_Care', isMine: false, minPrice: 0 })
  assert.equal(list.rows[0].duration, 60)
  assert.equal(list.hasNext, true)
  const details = await api.getService('s/1', 'en')
  assert.equal(details.items[0].id, 'i1')
  assert.equal((await api.getNames('ar', 'car & home'))[0].id, 'n1')
  assert.deepEqual(await api.getAvailability('s/1', '2026-11-25'), [{ from: '09:00', to: '10:00' }])
  assert.deepEqual(calls, [
    '/api/v1/services?page=1&pageSize=10&category=Home_Care&isMine=false&minPrice=0',
    '/api/v1/services/s%2F1?language=en',
    '/api/v1/service-names?language=ar&search=car+%26+home',
    '/api/v1/appointments/availabilities/service/s%2F1?date=2026-11-25',
  ])
})

test('write endpoints use the documented methods and preserve stamps and multipart forms', async () => {
  const calls = []
  const api = createServicesApi(async (path, options) => { calls.push({ path, ...options }) })
  const multipart = new FormData()
  multipart.set('serviceNameId', 'n1')
  await api.saveListing('services', null, multipart)
  await api.saveListing('packages', 'p1', multipart)
  await api.deleteListing('services', 's1')
  await api.saveName(null, { nameEn: 'Cleaning' })
  await api.saveName('n1', { nameEn: 'Cleaning', concurrencyStamp: 'name-rev' })
  await api.deleteName('n1')
  await api.bookAppointment('s1', { date: '2026-11-25', from: '09:00', to: '10:00' })
  await api.changeAppointment('a/1', 'Accepted', 'a+b')
  await api.reschedule('a1', { date: '2026-11-26', concurrencyStamp: 'appointment-rev' })
  await api.complete('appointments', 'a1', { star: 5 })
  await api.subscribe('p1', { packageConcurrencyStamp: 'package-rev' })
  await api.changeSubscription('sub1', { status: 'Cancelled', packageSubscriptionConcurrencyStamp: 'subscription-rev' })
  await api.complete('occurrences', 'o1', { star: 4, concurrencyStamp: 'occurrence-rev' })
  assert.deepEqual(calls.map(({ path, method }) => `${method} ${path}`), [
    'POST /api/v1/services', 'PUT /api/v1/packages/p1', 'DELETE /api/v1/services/s1',
    'POST /api/v1/admin/service-names', 'PUT /api/v1/admin/service-names/n1', 'DELETE /api/v1/admin/service-names/n1',
    'POST /api/v1/appointments/book/service/s1', 'PATCH /api/v1/appointments/a%2F1/change-status?status=Accepted&securityStamp=a%2Bb',
    'PUT /api/v1/appointments/a1/reschedule', 'POST /api/v1/appointments/a1/completed',
    'POST /api/v1/subscriptions/package/p1', 'PATCH /api/v1/subscriptions/sub1/change-status', 'POST /api/v1/occurrences/o1/completed',
  ])
  assert.equal(calls[1].body, multipart)
  assert.equal(calls[11].body.packageSubscriptionConcurrencyStamp, 'subscription-rev')
  assert.throws(() => api.changeAppointment('a1', 'Accepted'), /security stamp/)
})

test('location administration uses the selected governorate and retains update stamps', async () => {
  const calls = []
  const api = createServicesApi(async (path, options) => { calls.push({ path, ...options }); return [] })
  await api.getNeighborhoods('c/1', 'ar')
  await api.saveLocation('governorates', null, { nameEn: 'Cairo' })
  await api.saveLocation('neighborhoods', 'n/1', { nameEn: 'Maadi', governorateId: 'c/1', concurrencyStamp: 'rev-1' })
  await api.deleteLocation('neighborhoods', 'n/1')
  assert.deepEqual(calls, [
    { path: '/api/v1/neighborhoods?governorateId=c%2F1&language=ar' },
    { path: '/api/v1/admin/governorates', method: 'POST', body: { nameEn: 'Cairo' } },
    { path: '/api/v1/admin/neighborhoods/n%2F1', method: 'PUT', body: { nameEn: 'Maadi', governorateId: 'c/1', concurrencyStamp: 'rev-1' } },
    { path: '/api/v1/admin/neighborhoods/n%2F1', method: 'DELETE', body: undefined },
  ])
})
