import { ApiError } from './client.js'

function accessToken(data) {
  const token = typeof data === 'string' ? data : data?.accessToken ?? data?.token
  if (typeof token !== 'string' || token.split('.').length !== 3) throw new ApiError('The API returned no JWT access token.')
  return token
}

export function createAuthenticationApi(request) {
  const path = '/api/v1/authentication'
  const post = (route, body, options) => request(`${path}/${route}`, { ...options, method: 'POST', body })
  return {
    async login(email, password, { rememberMe = false } = {}) {
      return accessToken(await post('login', { email, password, remeberMe: rememberMe }))
    },
    async refresh(options) { return accessToken(await post('refresh-token', undefined, options)) },
    requestPasswordCode: email => post('forget-password', { email }),
    verifyPasswordCode: (email, code) => post('forget-password/verify-otp', { email, code }),
    resetPassword: (email, token, newPassword) => post('reset-password', { email, token, newPassword }),
  }
}
