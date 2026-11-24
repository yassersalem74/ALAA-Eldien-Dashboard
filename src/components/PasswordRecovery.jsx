import { useMemo, useState } from 'react'
import { createAuthenticationApi } from '../api/authentication'
import { createApiClient } from '../api/client'
import { apiConfig } from '../api/config'
import { ServiceField, ServiceMutation } from './ServiceControls'

export default function PasswordRecovery({ onClose, onSaved }) {
  const api = useMemo(() => createAuthenticationApi(createApiClient(apiConfig)), [])
  const [stage, setStage] = useState('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')

  async function submit(data) {
    if (stage === 'email') {
      const email = data.get('email').trim()
      await api.requestPasswordCode(email)
      setEmail(email)
      setStage('code')
    } else if (stage === 'code') {
      const code = data.get('code').trim()
      const response = await api.verifyPasswordCode(email, code)
      setToken(response?.token ?? code)
      setStage('password')
    } else {
      const password = data.get('newPassword')
      if (password !== data.get('confirmPassword')) throw new Error('The passwords must match.')
      await api.resetPassword(email, token, password)
      onSaved()
    }
  }
  return (
    <ServiceMutation key={stage} title="Reset password" onClose={onClose} closeOnSuccess={stage === 'password'} onSubmit={submit}
      action={{ email: 'Send code', code: 'Verify code', password: 'Reset password' }[stage]}>
      {stage === 'email' && <ServiceField label="Admin email"><input className="field" type="email" autoComplete="username" name="email" maxLength="200" required /></ServiceField>}
      {stage === 'code' && <>
        <p className="text-sm text-slate-600">Enter the code sent to {email}.</p>
        <ServiceField label="Verification code"><input className="field" name="code" minLength="4" maxLength="4" autoComplete="one-time-code" required /></ServiceField>
      </>}
      {stage === 'password' && <>
        <ServiceField label="New password"><input className="field" name="newPassword" type="password" autoComplete="new-password" minLength="8" maxLength="50" required /></ServiceField>
        <ServiceField label="Confirm password"><input className="field" name="confirmPassword" type="password" autoComplete="new-password" required /></ServiceField>
      </>}
    </ServiceMutation>
  )
}
