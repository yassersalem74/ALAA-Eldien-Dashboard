import { useState } from 'react'
import Icon from '../components/Icon'

export default function AdminLogin({ onSignIn, notice }) {
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const email = data.get('email').trim()
    const password = data.get('password')
    if (!email) {
      setError('Enter your admin email.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await onSignIn(email, password)
    } catch (failure) {
      setError(failure.message || 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f7f9] px-4 py-8 text-slate-800">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="admin-login-title">
        <div className="mb-7 flex items-center gap-4 border-b border-slate-200 pb-5">
          <img src="/alaa-logo.png" alt="" width="48" height="58" className="h-14 w-12 shrink-0 object-contain" />
          <div>
            <p className="text-lg font-bold text-[#172b46]">Alaa Eldien<span className="text-[#a87927]">.</span></p>
            <p className="mt-0.5 text-xs font-medium text-slate-600">Admin Dashboard</p>
          </div>
        </div>
        <h1 id="admin-login-title" className="mb-5 text-[26px] leading-tight font-semibold text-[#172b46]">Sign in</h1>
        {notice && !error && <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="status">{notice}</p>}
        <form className="space-y-4" onSubmit={submit} aria-busy={busy}>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="admin-email">Email</label>
            <input id="admin-email" className="field min-h-11 w-full !text-base" name="email"
              type="email" autoComplete="username" autoCapitalize="none"
              spellCheck={false} maxLength={200} required disabled={busy} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="admin-password">Password</label>
            <div className="relative">
              <input id="admin-password" className="field min-h-11 w-full !pr-12 !text-base" name="password"
                type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} />
              <button className="icon-button absolute top-1/2 right-1 -translate-y-1/2" type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(value => !value)}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </div>
          {error && <p className="break-words rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
          <button className="btn-primary min-h-11 w-full !text-sm" type="submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
