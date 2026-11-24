import test from 'node:test'
import assert from 'node:assert/strict'
import { signInAdmin, verifyAdminSession } from '../src/api/adminSession.js'

function tokenWithSession(claims) {
  return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
}

test('admin sign-in requests remember me and session restoration checks the account with the saved token', async t => {
  const token = tokenWithSession({ role: 'Admin', exp: Math.floor(Date.now() / 1000) + 3600 })
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ path: new URL(url).pathname, options })
    return Response.json({ data: options.method === 'POST' ? { accessToken: token } : { name: 'Test Admin' } })
  })

  const session = await signInAdmin('admin@example.com', 'test-password')
  const signal = new AbortController().signal
  const restored = await verifyAdminSession(session.token, undefined, { signal })

  assert.equal(restored.account.name, 'Test Admin')
  assert.equal(restored.token, token)
  assert.deepEqual(calls.map(call => call.path), [
    '/api/v1/authentication/login', '/api/v1/users/me', '/api/v1/users/me',
  ])
  assert.equal(JSON.parse(calls[0].options.body).remeberMe, true)
  assert.equal(calls[2].options.headers.Authorization, `Bearer ${token}`)
  assert.equal(calls[2].options.signal, signal)
})

test('restoration rejects expired and malformed tokens before making an API request', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}))
  const expired = tokenWithSession({ role: 'Admin', exp: 1 })
  await assert.rejects(verifyAdminSession(expired), { status: 401, message: /expired/ })
  await assert.rejects(verifyAdminSession('invalid-token'), { status: 401, message: /invalid/ })
  assert.equal(fetch.mock.callCount(), 0)
})
