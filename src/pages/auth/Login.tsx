import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import type { Gender, Goal } from '@/store/useAppStore'
import { useAppStore } from '@/store/useAppStore'

interface DraftState {
  gender?: Gender
  goal?: Goal
}

/**
 * There is no backend yet, so "login" simulates re-entering a locally stored
 * profile. This keeps the flow honest to a frontend-first build order while
 * the screen and validation UX are already wired for a real API later.
 */
export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const draft = (location.state as DraftState | null) ?? {}
  const user = useAppStore((state) => state.user)
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    completeOnboarding({
      name: user?.name ?? (email.split('@')[0] || 'Athlete'),
      email: email.trim(),
      gender: user?.gender ?? draft.gender ?? 'male',
      goal: user?.goal ?? draft.goal ?? 'stayFit',
      weightKg: user?.weightKg ?? 70,
      heightCm: user?.heightCm ?? 170,
      age: user?.age ?? 25,
      activityLevel: user?.activityLevel ?? 'moderate',
    })
    navigate('/')
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

        <Button type="submit" className="w-full mt-2">
          {t('auth.signIn')}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          {t('auth.noAccount')}{' '}
          <Link to="/auth/register" state={draft} className="text-brand-400 font-semibold">
            {t('auth.signUp')}
          </Link>
        </p>
      </form>
    </div>
  )
}
