import { ArrowLeft, Clock, Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'

import { PremiumGate } from '@/components/PremiumGate'
import { Button } from '@/components/ui/Button'
import { getWorkoutById } from '@/data/workouts'

export default function WorkoutDetail() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const { workoutId } = useParams()
  const workout = workoutId ? getWorkoutById(workoutId) : undefined

  if (!workout) return <Navigate to="/workouts" replace />

  const content = (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${workout.gradient[0]}, ${workout.gradient[1]})` }}
      >
        <img
          src={`https://images.unsplash.com/photo-${workout.photoId}?w=800&h=400&fit=crop&q=60`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <p className="relative text-2xl font-extrabold">{isAr ? workout.titleAr : workout.titleEn}</p>
        <div className="relative mt-2 flex items-center gap-4 text-sm text-white/85">
          <span className="flex items-center gap-1">
            <Clock size={15} /> {workout.durationMin} {t('common.minutes')}
          </span>
          <span className="flex items-center gap-1">
            <Flame size={15} /> {workout.calories} {t('common.kcal')}
          </span>
          <span>{t(`workouts.level.${workout.level}`)}</span>
        </div>
      </div>

      <h2 className="mt-6 mb-3 font-bold text-ink-soft text-sm uppercase tracking-wide">
        {t('workoutDetail.exercises')}
      </h2>
      <ol className="flex flex-col gap-2">
        {workout.exercises.map((exercise, index) => (
          <li
            key={exercise.id}
            className="flex items-center gap-3 rounded-xl border border-surface-2 bg-surface p-3.5"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{isAr ? exercise.nameAr : exercise.nameEn}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {exercise.durationSec
                  ? `${exercise.durationSec}s`
                  : `${exercise.sets ?? 1} × ${exercise.reps} ${t('player.reps')}`}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Link to={`/workouts/${workout.id}/play`}>
        <Button className="w-full mt-6">{t('workoutDetail.start')}</Button>
      </Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-10 md:pt-10">
      <Link to="/workouts" className="inline-flex items-center gap-1.5 text-sm text-ink-soft mb-4">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t('workouts.title')}
      </Link>

      {workout.premium ? (
        <PremiumGate descriptionKey="workoutDetail.premiumDescription">{content}</PremiumGate>
      ) : (
        content
      )}
    </div>
  )
}
