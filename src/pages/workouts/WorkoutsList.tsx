import { Camera, Lock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AiPlanCard } from '@/components/AiPlanCard'
import type { WorkoutCategory } from '@/data/workouts'
import { workouts } from '@/data/workouts'
import { isPremium, useAuthStore } from '@/store/useAuthStore'

const categories: (WorkoutCategory | 'all')[] = ['all', 'strength', 'hiit', 'cardio', 'mobility']

function workoutPhotoUrl(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?w=640&h=360&fit=crop&q=60`
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
          return (
            <Link
              key={workout.id}
              to={`/workouts/${workout.id}`}
              className="relative overflow-hidden rounded-2xl p-5 text-white min-h-[140px] flex flex-col justify-end"
              style={{ background: `linear-gradient(135deg, ${workout.gradient[0]}, ${workout.gradient[1]})` }}
            >
              <img
                src={workoutPhotoUrl(workout.photoId)}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Photos vary a lot in brightness/contrast — this scrim is what
                  keeps the title/stats readable on top of any of them. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
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
