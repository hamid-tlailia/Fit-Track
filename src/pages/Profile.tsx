import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { activityLevels } from '@/lib/calculations'
import type { ActivityLevel, Goal } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

const goals: Goal[] = ['loseWeight', 'buildMuscle', 'stayFit', 'endurance']

export default function Profile() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const tier = user?.subscriptionTier ?? 'free'
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState(() => ({
    weightKg: user?.weightKg ?? 70,
    heightCm: user?.heightCm ?? 170,
    age: user?.age ?? 25,
    goal: user?.goal ?? 'stayFit',
    activityLevel: user?.activityLevel ?? 'moderate',
  }))

  if (!user) return null

  async function handleSave() {
    await updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-10 md:pt-10">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center text-2xl font-extrabold text-white">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-ink-soft">{user.email}</p>
          <span className="inline-block mt-1 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-400 capitalize">
            {tier}
          </span>
        </div>
      </div>

      <Card className="mt-6 flex flex-col gap-4">
        <NumberField
          label={t('profile.weightKg')}
          value={form.weightKg}
          onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))}
        />
        <NumberField
          label={t('profile.heightCm')}
          value={form.heightCm}
          onChange={(v) => setForm((f) => ({ ...f, heightCm: v }))}
        />
        <NumberField label={t('profile.age')} value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-soft">{t('profile.goal')}</span>
          <Select
            value={form.goal}
            onChange={(value) => setForm((f) => ({ ...f, goal: value as Goal }))}
            options={goals.map((goal) => ({ value: goal, label: t(`onboarding.goal.${goal}`) }))}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-soft">{t('profile.activityLevel')}</span>
          <Select
            value={form.activityLevel}
            onChange={(value) => setForm((f) => ({ ...f, activityLevel: value as ActivityLevel }))}
            options={activityLevels.map((level) => ({ value: level, label: t(`profile.activity.${level}`) }))}
          />
        </label>

        <Button onClick={handleSave}>{saved ? t('profile.saved') : t('profile.save')}</Button>
      </Card>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-soft">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-xl border border-surface-2 bg-surface-2 px-3.5 py-2.5"
      />
    </label>
  )
}
