import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import type { Gender, Goal } from '@/store/useAppStore'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

interface DraftState {
  gender?: Gender
  goal?: Goal
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const draft = (location.state as DraftState | null) ?? {}
  const register = useAuthStore((state) => state.register)
  const setVoiceGender = useAppStore((state) => state.setVoiceGender)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const gender = draft.gender ?? 'male'
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      gender,
      goal: draft.goal ?? 'stayFit',
    })
    setSubmitting(false)
    if (result.ok) {
      setVoiceGender(gender)
      navigate('/')
    } else {
      setError(t(`auth.errors.${result.error}`, { defaultValue: t('auth.errors.unknown') }))
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg text-ink px-6 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{t('auth.register')}</h1>

        <Field label={t('auth.name')} value={name} onChange={setName} required />
        <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} required />
        <Field label={t('auth.password')} type="password" value={password} onChange={setPassword} required minLength={6} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full mt-2" disabled={submitting}>
          {t('auth.signUp')}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          {t('auth.haveAccount')}{' '}
          <Link to="/auth/login" state={draft} className="text-brand-400 font-semibold">
            {t('auth.signIn')}
          </Link>
        </p>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  minLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        minLength={minLength}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-surface-2 bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-brand-500"
      />
    </label>
  )
}
