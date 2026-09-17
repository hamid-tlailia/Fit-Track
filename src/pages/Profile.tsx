import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { activityLevels } from '@/lib/calculations'
import type { ActivityLevel, Goal } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

const goals: Goal[] = ['loseWeight', 'buildMuscle', 'stayFit', 'endurance']
const AVATAR_SIZE = 200

function resizeImageToDataUrl(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode_failed'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas_unsupported'))
        const scale = Math.max(size / img.width, size / img.height)
        const dw = img.width * scale
        const dh = img.height * scale
        ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const tier = user?.subscriptionTier ?? 'free'
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    weightKg: user?.weightKg ?? 70,
    heightCm: user?.heightCm ?? 170,
    age: user?.age ?? 25,
    goal: user?.goal ?? 'stayFit',
    activityLevel: user?.activityLevel ?? 'moderate',
    avatarUrl: user?.avatarUrl ?? null,
  }))

  if (!user) return null

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } finally {
      setSaving(false)
    }
  }

  async function handlePickAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setAvatarError(false)
    try {
      const dataUrl = await resizeImageToDataUrl(file, AVATAR_SIZE)
      setForm((f) => ({ ...f, avatarUrl: dataUrl }))
    } catch {
      setAvatarError(true)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-10 md:pt-10">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center text-2xl font-extrabold text-[var(--ink-on-brand)]">
              {(form.name || user.name).slice(0, 1).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t('profile.changePhoto')}
            className="absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-[var(--ink-on-brand)] border-2 border-bg"
          >
            <Camera size={12} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePickAvatar(e)} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{form.name || user.name}</h1>
          <p className="text-sm text-ink-soft">{user.email}</p>
          <span className="inline-block mt-1 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-400 capitalize">
            {tier}
          </span>
        </div>
      </div>
      {avatarError && <p className="mt-2 text-sm text-red-400">{t('profile.avatarError')}</p>}

      <Card className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-soft">{t('profile.name')}</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            className="rounded-xl border border-surface-2 bg-surface-2 px-3.5 py-2.5"
          />
        </label>

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

        <Button onClick={() => void handleSave()} loading={saving}>
          {saved ? t('profile.saved') : t('profile.save')}
        </Button>
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
  // Buffering the raw typed text (instead of binding straight to `value`)
  // avoids a classic controlled-<input type="number"> bug: typing a leading
  // zero (e.g. "0" then "83") parses to the same number as before, so React
  // sees an unchanged prop and never corrects the DOM's displayed "083".
  const [text, setText] = useState(() => String(value))

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-soft">{label}</span>
      <input
        type="number"
        value={text}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          const parsed = Number(next)
          if (next.trim() !== '' && Number.isFinite(parsed)) onChange(parsed)
        }}
        className="rounded-xl border border-surface-2 bg-surface-2 px-3.5 py-2.5"
      />
    </label>
  )
}
