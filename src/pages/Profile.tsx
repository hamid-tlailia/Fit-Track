import { Camera, Crown, Ruler, Scale, Calendar, Target, Activity, Mail, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
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
    } finally { setSaving(false) }
  }

  async function handlePickAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setAvatarError(false)
    try {
      const dataUrl = await resizeImageToDataUrl(file, AVATAR_SIZE)
      setForm((f) => ({ ...f, avatarUrl: dataUrl }))
    } catch { setAvatarError(true) }
  }

  const tierLabel = t(`subscription.plans.${tier}.name`)
  const tierColor = tier === 'pro' ? 'from-amber-400 to-[#FF6B2D]' : tier === 'premium' ? 'from-[#FF6B2D] to-[#FF8C42]' : 'from-gray-400 to-gray-500'

  return (
    <div className="max-w-[560px] mx-auto px-4 pt-0 pb-10 md:px-6">
      {/* Luxurious hero */}
      <div className=" -mx-4 md:-mx-6 relative overflow-hidden bg-gradient-to-br from-[#1A1816] via-[#2A211C] to-[#FF6B2D] pt-8 pb-16 px-4 md:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
        <div className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-surface/5 blur-3xl" />
        <div className="absolute -bottom-12 -start-12 h-48 w-48 rounded-full bg-[#FF6B2D]/20 blur-3xl" />
        <div className="relative"><BackButton /></div>
        <div className="relative flex items-start gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-br from-amber-300 via-[#FF6B2D] to-amber-500 opacity-70 blur-[1px]" />
            <div className="relative h-[84px] w-[84px] rounded-[20px] overflow-hidden border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.18)] bg-surface">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#FF6B2D] to-[#FF8C42] grid place-items-center text-3xl font-black text-white">
                  {(form.name || user.name).slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t('profile.changePhoto')}
              className="absolute -bottom-2 -end-2 h-8 w-8 rounded-full bg-surface text-ink grid place-items-center shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[var(--line)] hover:scale-105 transition"
            >
              <Camera size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePickAvatar(e)} />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-black text-white tracking-tight">{form.name || user.name}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${tierColor} px-2.5 py-1 text-[10px] font-black tracking-widest text-white shadow-sm`}>
                <Crown size={10} /> {tierLabel}
              </span>
            </div>
            <p className="text-sm text-white/70 flex items-center gap-1.5 mt-1 font-medium"><Mail size={12} /> {user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/10 backdrop-blur px-2.5 py-1 text-xs font-bold text-white border border-white/15">
                <Sparkles size={12} className="text-amber-300" /> {t(`onboarding.goal.${form.goal}`)}
              </span>

            </div>
          </div>
        </div>
        {avatarError && <p className="relative mt-3 text-sm font-bold text-red-200 bg-red-500/20 border border-red-500/20 rounded-xl px-3 py-2">{t('profile.avatarError')}</p>}
      </div>

      {/* Stats quick glance — luxe */}
      <div className=" -mt-8 relative grid grid-cols-3 gap-2">
        <StatMini icon={<Scale size={14} />} label={t('profile.weightKg')} value={`${form.weightKg} ${t('common.kg')}`} />
        <StatMini icon={<Ruler size={14} />} label={t('profile.heightCm')} value={`${form.heightCm} ${t('common.cm')}`} />
        <StatMini icon={<Calendar size={14} />} label={t('profile.age')} value={`${form.age}`} />
      </div>

      {/* Form card — luxurious */}
      <div className="mt-4 rounded-[24px] bg-surface border border-[var(--line)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--line)] bg-gradient-to-r from-surface-2 to-surface flex items-center justify-between">
          <h2 className="text-sm font-black tracking-tight flex items-center gap-2"><span className="h-6 w-1 rounded-full bg-[#FF6B2D]" /> {t('profile.title')}</h2>
          <span className="text-[10px] font-black tracking-[0.12em] uppercase text-ink-faint flex items-center gap-1"><Activity size={12} /> {t('app.tagline')}</span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black tracking-[0.08em] uppercase text-ink-soft flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500" /> {t('profile.name')}</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-full border border-[var(--line)] bg-surface-2 px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6B2D] focus:bg-surface transition"
              placeholder={t('profile.name')}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberField label={t('profile.weightKg')} value={form.weightKg} onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))} icon={<Scale size={14} />} />
            <NumberField label={t('profile.heightCm')} value={form.heightCm} onChange={(v) => setForm((f) => ({ ...f, heightCm: v }))} icon={<Ruler size={14} />} />
            <NumberField label={t('profile.age')} value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} icon={<Calendar size={14} />} />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black tracking-[0.08em] uppercase text-ink-soft flex items-center gap-1.5"><Target size={12} className="text-amber-500" /> {t('profile.goal')}</span>
            <Select
              value={form.goal}
              onChange={(value) => setForm((f) => ({ ...f, goal: value as Goal }))}
              options={goals.map((goal) => ({ value: goal, label: t(`onboarding.goal.${goal}`) }))}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black tracking-[0.08em] uppercase text-ink-soft flex items-center gap-1.5"><Activity size={12} className="text-amber-500" /> {t('profile.activityLevel')}</span>
            <Select
              value={form.activityLevel}
              onChange={(value) => setForm((f) => ({ ...f, activityLevel: value as ActivityLevel }))}
              options={activityLevels.map((level) => ({ value: level, label: t(`profile.activity.${level}`) }))}
            />
          </label>

          <Button onClick={() => void handleSave()} loading={saving} className="w-full mt-2 !rounded-full !py-3.5 !text-[14px] bg-gradient-to-r from-[#FF6B2D] to-[#FF8C42] border-0 shadow-[0_8px_24px_rgba(255,107,45,0.28)] hover:shadow-[0_12px_32px_rgba(255,107,45,0.32)]">
            {saved ? `✓ ${t('profile.saved')}` : t('profile.save')}
          </Button>
          <p className="text-center text-[11px] font-medium text-ink-faint">{t('profile.calorieHint')}</p>
        </div>
      </div>
    </div>
  )
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-[var(--line)] p-3 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="mx-auto h-7 w-7 rounded-full bg-surface-2 border border-amber-500/10 grid place-items-center text-amber-600">{icon}</div>
      <p className="text-[10px] font-black tracking-wide uppercase text-ink-faint mt-1">{label}</p>
      <p className="text-sm font-black tracking-tight">{value}</p>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  icon?: React.ReactNode
}) {
  const [text, setText] = useState(() => String(value))
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-black tracking-[0.08em] uppercase text-ink-soft flex items-center gap-1">{icon} {label}</span>
      <input
        type="number"
        value={text}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          const parsed = Number(next)
          if (next.trim() !== '' && Number.isFinite(parsed)) onChange(parsed)
        }}
        className="rounded-full border border-[var(--line)] bg-surface-2 px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6B2D] focus:bg-surface transition"
      />
    </label>
  )
}
