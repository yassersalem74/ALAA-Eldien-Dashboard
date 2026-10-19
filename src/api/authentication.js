import { ApiError } from './client.js'

export function createAuthenticationApi(request) {
  return {
    async login(email, password) {
      const data = await request('/api/v1/authentication/login', { method: 'POST', body: { email, password, remeberMe: false } })
      const token = typeof data === 'string' ? data : data?.accessToken ?? data?.token
      if (typeof token !== 'string' || token.split('.').length !== 3) throw new ApiError('Login returned no JWT access token. Confirm the login response schema with the backend.')
      return token
    },
  }
}
