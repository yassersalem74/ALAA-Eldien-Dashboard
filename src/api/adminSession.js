import { createAuthenticationApi } from './authentication.js'
import { ApiError, createApiClient } from './client.js'
import { apiConfig } from './config.js'
import { createUsersApi } from './users.js'

const adminRoles = new Set(['superadmin', 'admin', 'alaaeldin'])
const microsoftRoleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
export const adminTokenKey = `alaa-eldien:admin-token:${apiConfig.baseUrl.replace(/\/+$/, '')}`
export const sessionExpiredMessage = 'Your session expired. Please sign in again.'

export function getSavedAdminToken() {
  try {
    return globalThis.localStorage?.getItem(adminTokenKey) || null
  } catch {
    return null
  }
}

export function saveAdminToken(token) {
  try {
    globalThis.localStorage?.setItem(adminTokenKey, token)
  } catch {
    // Keep the active session usable when browser storage is unavailable.
  }
}

export function clearSavedAdminToken(token) {
  try {
    if (getSavedAdminToken() === token) globalThis.localStorage?.removeItem(adminTokenKey)
  } catch {
    // Signing out still clears the active session.
  }
}

function readClaims(token) {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(encoded))
    if (claims && typeof claims === 'object' && !Array.isArray(claims)) return claims
  } catch {
    // The dashboard session requires a JWT issued by the backend.
  }
  throw new ApiError('The access token is invalid. Please sign in again.', { status: 401 })
}

export async function signInAdmin(email, password, onUnauthorized) {
  const auth = createAuthenticationApi(createApiClient(apiConfig))
  let token
  try {
    token = await auth.login(email, password, { rememberMe: true })
  } catch (error) {
    if (error.status === 401) throw new ApiError('The email or password was not accepted.')
    throw error
  }

  return verifyAdminSession(token, onUnauthorized)
}

export async function verifyAdminSession(token, onUnauthorized, { signal } = {}) {
  const claims = readClaims(token)
  const expiresAt = typeof claims.exp === 'number' && Number.isFinite(claims.exp) ? claims.exp * 1000 : null
  if (expiresAt !== null && expiresAt <= Date.now()) throw new ApiError(sessionExpiredMessage, { status: 401 })
  const request = createApiClient({ ...apiConfig, credentials: 'omit', getToken: () => token, onUnauthorized })
  const account = await createUsersApi(request).getMe({ signal })
  const roles = [claims.role, claims.roles, claims.Role, claims.Roles, claims[microsoftRoleClaim], account.roles].flat()
  if (!roles.some(role => typeof role === 'string' && adminRoles.has(role.trim().toLowerCase()))) {
    throw new ApiError('This account does not have admin dashboard access.', { status: 403 })
  }
  if (expiresAt !== null && expiresAt <= Date.now()) throw new ApiError(sessionExpiredMessage, { status: 401 })
  return { account, expiresAt, token, request }
}
