const env = import.meta.env ?? {}

export const apiConfig = {
  baseUrl: (env.VITE_API_BASE_URL || 'https://alaaeldin.runasp.net').trim(),
  listPath: (env.VITE_USERS_LIST_PATH || '').trim(),
  deletePath: (env.VITE_USER_DELETE_PATH || '').trim(),
  credentials: env.VITE_API_USE_COOKIES === 'true' ? 'include' : 'same-origin',
}
