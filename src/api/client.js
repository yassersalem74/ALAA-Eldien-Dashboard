export class ApiError extends Error {
  constructor(message, { status = 0, code } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function createApiClient({ baseUrl, getToken = () => '', credentials = 'same-origin', language = 'en', fetchImpl = globalThis.fetch }) {
  const base = baseUrl?.trim().replace(/\/+$/, '')
  return async function request(path, { method = 'GET', body, signal } = {}) {
    if (!base) throw new ApiError('The backend URL has not been configured.')
    if (!path?.startsWith('/') || path.startsWith('//')) throw new ApiError('API endpoints must be relative paths beginning with /.')
    const token = getToken()?.trim()
    let response
    try {
      response = await fetchImpl(`${base}${path}`, {
        method, signal, credentials,
        headers: { Accept: 'application/json', 'Accept-Language': language, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
    } catch (error) {
      if (error.name === 'AbortError') throw error
      throw new ApiError('Unable to reach the backend. Check the connection and backend CORS settings.')
    }
    const text = await response.text()
    let payload = null
    if (text) {
      try { payload = JSON.parse(text) } catch {
        if (response.ok) throw new ApiError('The backend returned an invalid JSON response.', { status: response.status })
      }
    }
    if (!response.ok || payload?.isSuccess === false) {
      const fallback = response.status === 401 ? 'Your session has expired or you are not signed in.' : response.status === 403 ? 'You do not have permission to perform this action.' : `The request failed (${response.status}).`
      throw new ApiError(payload?.error?.message || fallback, { status: response.status, code: payload?.error?.code })
    }
    return payload && Object.hasOwn(payload, 'data') ? payload.data : payload
  }
}
