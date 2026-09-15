import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/useAuthStore'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await login({ email: email.trim(), password })
    setSubmitting(false)
    if (result.ok) {
      navigate('/')
    } else {
      setError(t(`auth.errors.${result.error}`, { defaultValue: t('auth.errors.unknown') }))
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg text-ink px-6 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{t('auth.login')}</h1>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-soft">{t('auth.email')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-surface-2 bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-soft">{t('auth.password')}</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-surface-2 bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-brand-500"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full mt-2" disabled={submitting}>
          {t('auth.signIn')}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          {t('auth.noAccount')}{' '}
          <Link to="/auth/register" className="text-brand-400 font-semibold">
            {t('auth.signUp')}
          </Link>
        </p>
      </form>
    </div>
  )
}
