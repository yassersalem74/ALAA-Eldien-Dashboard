import { useEffect, useMemo, useState } from 'react'
import { createApiClient } from '../api/client'
import { apiConfig } from '../api/config'
import { createUsersApi } from '../api/users'
import { createAuthenticationApi } from '../api/authentication'
import { previewUsers } from '../data/usersPreview'

const initialBackend = () => ({ users: [], total: 0, currentUser: null, accountError: '', error: '', loading: true })

export default function useUsers() {
  const [source, setSource] = useState('backend')
  const [token, setToken] = useState('')
  const [revision, setRevision] = useState(0)
  const [preview, setPreview] = useState(previewUsers)
  const [backend, setBackend] = useState(initialBackend)
  const api = useMemo(() => createUsersApi(createApiClient({ ...apiConfig, getToken: () => token }), apiConfig), [token])

  useEffect(() => {
    if (source !== 'backend') return
    const controller = new AbortController()
    const options = { signal: controller.signal }
    Promise.allSettled([api.getMe(options), api.list(options)]).then(([account, directory]) => {
      if (controller.signal.aborted) return
      setBackend({
        currentUser: account.status === 'fulfilled' ? account.value : null,
        accountError: account.status === 'rejected' ? account.reason.message : '',
        users: directory.status === 'fulfilled' ? directory.value.users : [],
        total: directory.status === 'fulfilled' ? directory.value.total : 0,
        error: directory.status === 'rejected' ? directory.reason.message : '', loading: false,
      })
    })
    return () => controller.abort()
  }, [source, api, revision])

  const connect = nextToken => {
    setBackend(initialBackend())
    setToken(nextToken)
    setSource('backend')
    setRevision(value => value + 1)
  }
  const login = async (email, password) => {
    const auth = createAuthenticationApi(createApiClient(apiConfig))
    connect(await auth.login(email, password))
  }
  const refresh = () => {
    if (source === 'preview') { setPreview(previewUsers); return }
    setBackend(initialBackend())
    setRevision(value => value + 1)
  }
  const remove = async user => {
    if (source === 'preview') { setPreview(items => items.filter(item => item.id !== user.id)); return }
    if (backend.currentUser?.id != null && String(backend.currentUser.id) === String(user.id)) throw new Error('Your own account cannot be deleted from the user directory.')
    await api.deleteUser(user.id)
    setBackend(value => ({ ...value, users: value.users.filter(item => item.id !== user.id), total: Math.max(0, value.total - 1) }))
  }

  return {
    source, users: source === 'preview' ? preview : backend.users,
    total: source === 'preview' ? preview.length : backend.total,
    loading: source === 'backend' && backend.loading,
    error: source === 'backend' ? backend.error : '',
    currentUser: source === 'backend' ? backend.currentUser : null,
    accountError: source === 'backend' ? backend.accountError : '',
    connect, login, refresh, remove,
    preview: () => { setSource('preview'); setToken('') },
  }
}
