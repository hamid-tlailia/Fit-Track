import { Dumbbell, Flame, HeartPulse, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import i18n from '@/i18n'
import type { Gender, Goal } from '@/store/useAppStore'

const goals: { id: Goal; icon: typeof Flame }[] = [
  { id: 'loseWeight', icon: TrendingDown },
  { id: 'buildMuscle', icon: Dumbbell },
  { id: 'stayFit', icon: HeartPulse },
  { id: 'endurance', icon: Flame },
]

type Step = 'language' | 'welcome' | 'gender' | 'goal'

export default function Onboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('language')
  const [gender, setGender] = useState<Gender | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)

  function goToAuth() {
    navigate('/auth/register', { state: { gender: gender ?? 'male', goal: goal ?? 'stayFit' } })
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-ink px-6 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center font-extrabold text-white">
            F
          </div>
          <span className="text-xl font-extrabold">{t('app.name')}</span>
        </div>

        {step === 'language' && (
          <div className="flex flex-1 flex-col justify-center gap-4">
            <h1 className="text-2xl font-extrabold">{t('onboarding.chooseLanguage')}</h1>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  void i18n.changeLanguage('en')
                  setStep('welcome')
                }}
                className="rounded-2xl border border-surface-2 bg-surface p-5 text-start font-semibold hover:border-brand-500"
              >
                English
              </button>
              <button
                onClick={() => {
                  void i18n.changeLanguage('ar')
                  setStep('welcome')
                }}
                className="rounded-2xl border border-surface-2 bg-surface p-5 text-start font-semibold hover:border-brand-500"
              >
                العربية
              </button>
            </div>
          </div>
        )}

        {step === 'welcome' && (
          <div className="flex flex-1 flex-col justify-center gap-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center text-white text-3xl font-extrabold">
              F
            </div>
            <h1 className="text-2xl font-extrabold">{t('onboarding.welcome')}</h1>
            <p className="text-ink-soft">{t('onboarding.tagline')}</p>
            <Button className="mt-4 w-full" onClick={() => setStep('gender')}>
              {t('onboarding.continue')}
            </Button>
          </div>
        )}

        {step === 'gender' && (
          <div className="flex flex-1 flex-col justify-center gap-5">
            <h1 className="text-2xl font-extrabold">{t('onboarding.chooseGender')}</h1>
            <div className="grid grid-cols-2 gap-3">
              {(['male', 'female'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`rounded-2xl border p-6 text-center font-semibold transition ${
                    gender === g
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-surface-2 bg-surface hover:border-surface-2/70'
                  }`}
                >
                  {t(`onboarding.gender.${g}`)}
                </button>
              ))}
            </div>
            <Button className="w-full" disabled={!gender} onClick={() => setStep('goal')}>
              {t('onboarding.continue')}
            </Button>
          </div>
        )}

        {step === 'goal' && (
          <div className="flex flex-1 flex-col justify-center gap-5">
            <h1 className="text-2xl font-extrabold">{t('onboarding.chooseGoal')}</h1>
            <div className="grid grid-cols-2 gap-3">
              {goals.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setGoal(id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center text-sm font-semibold transition ${
                    goal === id
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-surface-2 bg-surface hover:border-surface-2/70'
                  }`}
                >
                  <Icon size={22} />
                  {t(`onboarding.goal.${id}`)}
                </button>
              ))}
            </div>
            <Button className="w-full" disabled={!goal} onClick={goToAuth}>
              {t('onboarding.getStarted')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
