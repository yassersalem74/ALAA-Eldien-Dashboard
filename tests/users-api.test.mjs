import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from '../src/api/client.js'
import { createUsersApi, normalizeUser } from '../src/api/users.js'
import { createAuthenticationApi } from '../src/api/authentication.js'

test('GET me uses the configured backend, JWT, language header, and success envelope', async () => {
  let captured
  const request = createApiClient({ baseUrl: 'https://backend.example/', getToken: () => 'session-token', fetchImpl: async (url, options) => {
    captured = { url, ...options }
    return Response.json({ isSuccess: true, data: { id: 'user-1', email: 'admin@example.com', firstName: 'Test', lastName: 'Admin', accountType: 'Individual', roles: ['SuperAdmin'] } })
  } })
  const user = await createUsersApi(request).getMe()
  assert.equal(captured.url, 'https://backend.example/api/v1/users/me')
  assert.equal(captured.headers.Authorization, 'Bearer session-token')
  assert.equal(captured.headers['Accept-Language'], 'en')
  assert.equal(user.name, 'Test Admin')
  assert.deepEqual(user.roles, ['SuperAdmin'])
})

test('401 and backend error envelopes remain actionable errors', async () => {
  const unauthorized = createApiClient({ baseUrl: 'https://backend.example', fetchImpl: async () => new Response('', { status: 401 }) })
  await assert.rejects(unauthorized('/api/v1/users/me'), error => error.status === 401 && /not signed in/.test(error.message))
  const failed = createApiClient({ baseUrl: 'https://backend.example', fetchImpl: async () => Response.json({ isSuccess: false, error: { message: 'Deletion denied', code: 'Forbidden' } }) })
  await assert.rejects(failed('/anything'), error => error.message === 'Deletion denied' && error.code === 'Forbidden')
})

test('invalid JSON and request cancellation are handled without reporting success', async () => {
  const invalid = createApiClient({ baseUrl: 'https://backend.example', fetchImpl: async () => new Response('<html>Oops</html>') })
  await assert.rejects(invalid('/anything'), /invalid JSON/)
  const cancelled = createApiClient({ baseUrl: 'https://backend.example', fetchImpl: async () => { throw new DOMException('Cancelled', 'AbortError') } })
  await assert.rejects(cancelled('/anything'), error => error.name === 'AbortError')
})

test('account type is independent from role; unclassified and unknown roles remain visible', () => {
  assert.equal(normalizeUser({ role: 'Company' }).accountType, 'Unknown')
  const company = normalizeUser({ userType: 'company', role: 'Admin', isActive: false })
  assert.equal(company.accountType, 'Company')
  assert.deepEqual(company.roles, ['Admin'])
  assert.equal(company.status, 'Inactive')
  assert.deepEqual(normalizeUser({ roles: ['Customer'] }).roles, ['Customer'])
})

test('missing admin routes and /me aliases never issue directory or delete requests', async () => {
  let calls = 0
  const request = async () => { calls++; return [] }
  await assert.rejects(createUsersApi(request).list(), /not been provided/)
  await assert.rejects(createUsersApi(request).deleteUser('u1'), /admin delete endpoint/)
  await assert.rejects(createUsersApi(request, { listPath: '/api/v1/users/me' }).list(), /current-account endpoint/)
  await assert.rejects(createUsersApi(request, { deletePath: '/api/v1/users/me?selected={id}' }).deleteUser('u1'), /current-account endpoint/)
  await assert.rejects(createUsersApi(request, { deletePath: '/api/v1/users/{id}' }).deleteUser('me'), /valid user ID/)
  assert.equal(calls, 0)
})

test('admin list supports an explicit items response; delete encodes IDs and propagates failure', async () => {
  const calls = []
  const request = async (path, options) => {
    calls.push({ path, ...options })
    if (options?.method === 'DELETE') throw new Error('Delete rejected')
    return { items: [{ id: 'u1', accountType: 'Company', roles: ['Company'] }], totalCount: 40 }
  }
  const api = createUsersApi(request, { listPath: '/admin/users', deletePath: '/admin/users/{id}' })
  const result = await api.list()
  assert.equal(result.total, 40)
  assert.equal(result.users[0].accountType, 'Company')
  await assert.rejects(api.deleteUser('a/b'), /Delete rejected/)
  assert.deepEqual(calls[1], { path: '/admin/users/a%2Fb', method: 'DELETE' })
})

test('login sends the Swagger request field names and refuses success messages without JWTs', async () => {
  let captured
  const auth = createAuthenticationApi(async (path, options) => { captured = { path, ...options }; return { accessToken: 'header.payload.signature' } })
  assert.equal(await auth.login('admin@example.com', 'password'), 'header.payload.signature')
  assert.deepEqual(captured, { path: '/api/v1/authentication/login', method: 'POST', body: { email: 'admin@example.com', password: 'password', remeberMe: false } })
  await assert.rejects(createAuthenticationApi(async () => 'Welcome').login('a', 'b'), /no JWT/)
})

test('API paths cannot redirect credentials to an unrelated URL', async () => {
  let called = false
  const request = createApiClient({ baseUrl: 'https://backend.example', fetchImpl: async () => { called = true } })
  await assert.rejects(request('//other.example/users'), /relative paths/)
  assert.equal(called, false)
})
