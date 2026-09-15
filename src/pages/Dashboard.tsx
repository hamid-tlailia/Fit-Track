import { Droplets, Flame, Plus, Salad } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { foods } from '@/data/foods'
import { workouts } from '@/data/workouts'
import { calculateBMR, calculateMacros, calculateTDEE } from '@/lib/calculations'
import { useAppStore } from '@/store/useAppStore'
import { todayKey, useTrackerStore } from '@/store/useTrackerStore'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const user = useAppStore((state) => state.user)
  const theme = useAppStore((state) => state.theme)
  const foodLog = useTrackerStore((state) => state.foodLog)
  const waterByDate = useTrackerStore((state) => state.waterByDate)
  const streak = useTrackerStore((state) => state.currentStreak())

  const isAr = i18n.language === 'ar'
  const key = todayKey()
  const waterMl = waterByDate[key] ?? 0
  const addWater = useTrackerStore((state) => state.addWater)

  const caloriesTarget = user
    ? Math.round(calculateMacros(calculateTDEE(calculateBMR(user.weightKg, user.heightCm, user.age, user.gender), user.activityLevel), user.goal).calories)
    : 2000

  const caloriesToday = foodLog
    .filter((entry) => entry.loggedAt.slice(0, 10) === key)
    .reduce((sum, entry) => {
      const food = foods.find((f) => f.id === entry.foodId)
      return food ? sum + (food.kcalPer100g * entry.grams) / 100 : sum
    }, 0)

  const suggested = workouts[0]

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-6 md:pt-10">
      <h1 className="text-2xl font-extrabold">{t('dashboard.greeting', { name: user?.name ?? '' })}</h1>
      <p className="text-ink-soft mt-1">{t('dashboard.subtitle')}</p>

      <div
        className="mt-5 rounded-2xl p-5 text-white font-bold text-lg"
        style={{ background: `linear-gradient(135deg, var(--brand-500), var(--accent))` }}
      >
        {t(`dashboard.motivation.${theme}`)}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center gap-1 text-center">
          <Flame size={18} className="text-brand-400" />
          <span className="text-lg font-extrabold">{Math.round(caloriesToday)}</span>
          <span className="text-[11px] text-ink-soft">
            {t('dashboard.caloriesToday')} / {caloriesTarget}
          </span>
        </Card>
        <Card className="flex flex-col items-center gap-1 text-center">
          <Droplets size={18} className="text-accent" />
          <span className="text-lg font-extrabold">{(waterMl / 1000).toFixed(1)}L</span>
          <span className="text-[11px] text-ink-soft">{t('dashboard.waterToday')}</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-extrabold">🔥{streak}</span>
          <span className="text-[11px] text-ink-soft">{t('dashboard.streakLabel')}</span>
        </Card>
      </div>

      <h2 className="mt-7 mb-3 font-bold text-ink-soft text-sm uppercase tracking-wide">
        {t('dashboard.quickActions')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/workouts"
          className="rounded-2xl border border-surface-2 bg-surface p-4 font-semibold hover:border-brand-500 transition"
        >
          {t('dashboard.startWorkout')}
        </Link>
        <Link
          to="/nutrition"
          className="rounded-2xl border border-surface-2 bg-surface p-4 font-semibold hover:border-brand-500 transition flex items-center gap-2"
        >
          <Salad size={17} /> {t('dashboard.logFood')}
        </Link>
        <button
          onClick={() => addWater(250)}
          className="rounded-2xl border border-surface-2 bg-surface p-4 font-semibold hover:border-brand-500 transition flex items-center gap-2 text-start"
        >
          <Plus size={17} /> {t('dashboard.addWater')}
        </button>
        <Link
          to="/progress"
          className="rounded-2xl border border-surface-2 bg-surface p-4 font-semibold hover:border-brand-500 transition"
        >
          {t('nav.progress')}
        </Link>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-bold text-ink-soft text-sm uppercase tracking-wide">
          {t('dashboard.suggestedWorkout')}
        </h2>
        <Link to="/workouts" className="text-sm font-semibold text-brand-400">
          {t('dashboard.viewAll')}
        </Link>
      </div>
      <Link
        to={`/workouts/${suggested.id}`}
        className="mt-3 block rounded-2xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${suggested.gradient[0]}, ${suggested.gradient[1]})` }}
      >
        <p className="font-extrabold text-lg">{isAr ? suggested.titleAr : suggested.titleEn}</p>
        <p className="text-white/80 text-sm mt-1">
          {suggested.durationMin} {t('common.minutes')} · {suggested.calories} {t('common.kcal')}
        </p>
      </Link>
    </div>
  )
}
