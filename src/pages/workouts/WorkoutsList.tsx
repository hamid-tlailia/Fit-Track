import { Lock, Clock, Flame, Play } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

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
    <div className="max-w-[560px] mx-auto px-4 pt-6 pb-6 md:pt-8 md:px-6">
      <h1 className="text-[22px] font-black tracking-tight">{t('workouts.title')}</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold border transition ${
              filter === category
                ? 'bg-[#FFEFD9] border-[#E8DDD0] text-ink shadow-sm'
                : 'bg-white border-[var(--line)] text-ink-soft'
            }`}
          >
            {t(`workouts.categories.${category}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {filtered.map((workout) => {
          const locked = workout.premium && !isPremium(tier)
          return (
            <Link
              key={workout.id}
              to={`/workouts/${workout.id}`}
              className="relative overflow-hidden rounded-2xl min-h-[150px] flex flex-col justify-end group"
            >
              <img src={workoutPhotoUrl(workout.photoId)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* play button like screenshot */}
              <div className="absolute top-2.5 start-2.5 h-7 w-7 rounded-full bg-white/90 backdrop-blur grid place-items-center shadow-sm">
                <Play size={12} className="fill-ink text-ink ms-0.5" />
              </div>
              {locked && (
                <div className="absolute top-2.5 end-2.5 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur px-2 py-1 text-[10px] font-bold text-white">
                  <Lock size={10} /> {t('workouts.premiumBadge')}
                </div>
              )}
              <div className="relative p-3 text-white">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold opacity-90">
                  <span className="flex items-center gap-1"><Clock size={10} /> 20 min</span>
                </div>
                <p className="font-extrabold text-[13px] leading-tight mt-1">{isAr ? workout.titleAr : workout.titleEn}</p>
                <p className="text-[11px] opacity-80 flex items-center gap-1 mt-0.5">
                  <Flame size={10} /> {workout.calories} kcal · {t(`workouts.level.${workout.level}`)}
                </p>
                <p className="text-[10px] opacity-60 mt-0.5">{workout.exercises.length} exercises</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* AI cards like screenshot middle: AI Form Check / AI Training */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/form-check" className="rounded-2xl bg-white border border-[var(--line)] p-3 flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-surface-2 grid place-items-center text-ink-soft shrink-0">AI</div>
          <div>
            <p className="text-xs font-extrabold">AI Form Check</p>
            <p className="text-[11px] text-ink-soft">20 min, 220 kcal</p>
          </div>
        </Link>
        <div className="rounded-2xl bg-white border border-[var(--line)] p-3">
          <p className="text-xs font-extrabold">AI Training</p>
          <p className="text-[11px] text-ink-soft">Bimnos, 1R · Intermediate</p>
        </div>
      </div>
    </div>
  )
}
