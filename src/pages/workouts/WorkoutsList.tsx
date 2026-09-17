import { Camera, Dumbbell, Flame, Lock, Waves, Zap } from 'lucide-react'
import type { ComponentType } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AiPlanCard } from '@/components/AiPlanCard'
import type { WorkoutCategory } from '@/data/workouts'
import { workouts } from '@/data/workouts'
import { isPremium, useAuthStore } from '@/store/useAuthStore'

const categories: (WorkoutCategory | 'all')[] = ['all', 'strength', 'hiit', 'cardio', 'mobility']

// Real per-exercise cutout photography isn't something we can source here, so
// each category gets a large, softly-lit watermark icon instead of a flat
// gradient — still a distinct visual per workout type without needing
// licensed stock photos.
const categoryIcon: Record<WorkoutCategory, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  strength: Dumbbell,
  hiit: Zap,
  cardio: Flame,
  mobility: Waves,
}

export default function WorkoutsList() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const [filter, setFilter] = useState<(typeof categories)[number]>('all')
  const tier = useAuthStore((state) => state.user?.subscriptionTier ?? 'free')

  const filtered = filter === 'all' ? workouts : workouts.filter((w) => w.category === filter)

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-6 md:pt-10">
      <h1 className="text-2xl font-extrabold">{t('workouts.title')}</h1>

      <Link
        to="/form-check"
        className="mt-4 flex items-center gap-3 rounded-2xl p-4 text-white"
        style={{ background: 'linear-gradient(135deg, #d21fff, #39ffd6)' }}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
          <Camera size={20} />
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-sm">{t('formCheck.title')}</p>
          <p className="text-xs text-white/80">{t('formCheck.subtitle')}</p>
        </div>
        {!isPremium(tier) && (
          <span className="flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold shrink-0">
            <Lock size={11} /> {t('workouts.premiumBadge')}
          </span>
        )}
      </Link>

      <div className="mt-4">
        <AiPlanCard type="training" />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === category
                ? 'bg-brand-500 text-[var(--ink-on-brand)]'
                : 'bg-surface text-ink-soft border border-surface-2'
            }`}
          >
            {t(`workouts.categories.${category}`)}
          </button>
        ))}
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        {filtered.map((workout) => {
          const locked = workout.premium && !isPremium(tier)
          const CategoryIcon = categoryIcon[workout.category]
          return (
            <Link
              key={workout.id}
              to={`/workouts/${workout.id}`}
              className="relative overflow-hidden rounded-2xl p-5 text-white min-h-[140px] flex flex-col justify-end"
              style={{ background: `linear-gradient(135deg, ${workout.gradient[0]}, ${workout.gradient[1]})` }}
            >
              <CategoryIcon
                size={96}
                strokeWidth={1.5}
                className="pointer-events-none select-none absolute -end-4 -bottom-4 text-white/15 rotate-[-12deg]"
              />
              {locked && (
                <div className="absolute top-3 end-3 flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                  <Lock size={12} /> {t('workouts.premiumBadge')}
                </div>
              )}
              <p className="relative font-extrabold text-lg leading-tight">{isAr ? workout.titleAr : workout.titleEn}</p>
              <p className="relative text-white/85 text-sm mt-1">
                {workout.durationMin} {t('common.minutes')} · {workout.calories} {t('common.kcal')} ·{' '}
                {t(`workouts.level.${workout.level}`)}
              </p>
              <p className="relative text-white/70 text-xs mt-0.5">
                {t('workouts.exercisesCount', { count: workout.exercises.length })}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
