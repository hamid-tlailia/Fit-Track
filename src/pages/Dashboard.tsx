import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronRight, Plus, Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

import { foods } from '@/data/foods'
import { api } from '@/lib/api'
import { workouts } from '@/data/workouts'
import { calculateBMR, calculateMacros, calculateTDEE } from '@/lib/calculations'
import { useAuthStore } from '@/store/useAuthStore'
import { dateKeyOf, todayKey, useTrackerStore } from '@/store/useTrackerStore'

function currentWeek(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const foodLog = useTrackerStore((state) => state.foodLog)
  const waterByDate = useTrackerStore((state) => state.waterByDate)
  const completedWorkouts = useTrackerStore((state) => state.completedWorkouts)
  const streak = useTrackerStore((state) => state.currentStreak())
  const addWater = useTrackerStore((state) => state.addWater)

  const [steps, setSteps] = useState<number | null>(null)
  const [fitCalories, setFitCalories] = useState<number | null>(null)
  const [fitConnected, setFitConnected] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => { todayRef.current?.scrollIntoView({ inline: 'end', block: 'nearest' }) }, [])

  // Google Fit sync: steps + caloriesBurned together — fix sync issue
  useEffect(() => {
    let cancelled = false
    async function fetchFit() {
      try {
        const data = await api.get<{ connected: boolean; steps?: number | null; caloriesBurned?: number | null }>(`/fit?action=steps&tzOffset=${new Date().getTimezoneOffset()}`)
        if (cancelled) return
        setFitConnected(!!data.connected)
        setSteps(data.connected ? (data.steps ?? 0) : null)
        setFitCalories(data.connected && data.caloriesBurned != null ? data.caloriesBurned : null)
      } catch {
        if (!cancelled) { setSteps(null); setFitCalories(null); setFitConnected(false) }
      }
    }
    fetchFit()
    const id = setInterval(fetchFit, 60000)
    const onVis = () => { if (document.visibilityState === 'visible') fetchFit() }
    document.addEventListener('visibilitychange', onVis)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  useEffect(() => {
    api.get<{ unreadCount: number }>('/push?action=list').then((d) => setHasUnreadNotifications(d.unreadCount > 0)).catch(() => undefined)
  }, [])

  const isAr = i18n.language === 'ar'
  const locale = isAr ? 'ar' : 'en-US'
  const key = todayKey()
  const waterMl = waterByDate[key] ?? 0
  const waterL = waterMl / 1000

  const caloriesTarget = user
    ? Math.round(calculateMacros(calculateTDEE(calculateBMR(user.weightKg, user.heightCm, user.age, user.gender), user.activityLevel), user.goal).calories)
    : 2347
  const caloriesToday = Math.round(
    foodLog.filter((e) => dateKeyOf(e.loggedAt) === key).reduce((sum, entry) => {
      const food = foods.find((f) => f.id === entry.foodId)
      return food ? sum + (food.kcalPer100g * entry.grams) / 100 : sum
    }, 0),
  )
  // Calories burned: prefer Google Fit when connected, otherwise local workouts — fixes sync
  const localCaloriesBurned = completedWorkouts.filter((e) => dateKeyOf(e.dateISO) === key).reduce((sum, w) => sum + w.calories, 0)
  const caloriesBurnedToday = fitConnected && fitCalories != null ? fitCalories : localCaloriesBurned

  const caloriesPct = Math.min(100, Math.round((caloriesToday / caloriesTarget) * 100))
  const waterPct = Math.min(100, Math.round((waterL / 2.5) * 100))
  const burnedPct = Math.min(100, Math.round((caloriesBurnedToday / 600) * 100))
  const stepsPct = steps != null ? Math.min(100, Math.round((steps / 10000) * 100)) : 0

  const suggested = workouts[0]
  const initial = (user?.name?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <div className="max-w-[560px] mx-auto px-4 pt-5 pb-8 md:pt-8 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover border border-[var(--line)]" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-brand-500 grid place-items-center text-white font-black text-sm">
              {initial}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-extrabold leading-none">{user?.name ?? 'Hamid Tlailia'}</h1>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-brand-500 text-white">Pro</span>
              {streak > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                  <Flame size={10} /> {streak} {isAr ? 'يوم' : 'd'}
                </span>
              )}
            </div>
            <p className="text-[13px] font-semibold text-ink-soft mt-0.5 flex items-center gap-1.5">
              {fitConnected ? (
                <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Google Fit • {t('dashboard.subtitle')}</>
              ) : t('dashboard.subtitle')}
            </p>
          </div>
        </div>
        <Link to="/notifications" className="relative h-9 w-9 grid place-items-center rounded-full bg-surface border border-[var(--line)] text-ink-soft shadow-sm">
          <Bell size={16} />
          {hasUnreadNotifications && <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-brand-500" />}
        </Link>
      </div>

      <div className="mt-5 flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        {currentWeek().map((d) => {
          const isToday = d.toDateString() === new Date().toDateString()
          const dayLetter = d.toLocaleDateString(locale, { weekday: 'narrow' })
          return (
            <div
              key={d.toISOString()}
              ref={isToday ? todayRef : undefined}
              className={`flex flex-col items-center justify-center rounded-2xl min-w-[44px] px-2 py-2 border text-center ${
                isToday ? 'bg-white border-brand-500 text-ink shadow-sm' : 'bg-white border-[var(--line)] text-ink-soft'
              }`}
            >
              <span className="text-[11px] font-bold">{dayLetter}</span>
              <span className={`text-[13px] font-extrabold mt-0.5 h-7 w-7 grid place-items-center rounded-full ${isToday ? 'bg-brand-500 text-white' : ''}`}>
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      <h2 className="mt-6 text-[15px] font-extrabold flex items-center gap-2">
        {t('dashboard.recentActivity')}
        {fitConnected && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Google Fit</span>}
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3 relative">
        <ActivityCircleCard
          value={caloriesToday}
          sub={`${caloriesToday}/${caloriesTarget} kcal`}
          pct={caloriesPct}
          color="var(--brand-500)"
          bg="rgba(255,107,45,0.12)"
        />
        <ActivityCircleCard
          value={`${(waterMl / 1000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}`}
          suffix=" L"
          sub={`${waterMl} ml`}
          pct={waterPct}
          color="#3B82F6"
          bg="rgba(59,130,246,0.12)"
        />
        {/* Calories Burned — synced with Google Fit when connected */}
        <ActivityCircleCard
          value={caloriesBurnedToday}
          sub={fitConnected ? `${caloriesBurnedToday} kcal • Fit` : `${caloriesBurnedToday} kcal`}
          pct={burnedPct}
          color="var(--brand-500)"
          bg="rgba(255,107,45,0.12)"
        />
        <ActivityCircleCard
          value={steps ?? 0}
          sub={fitConnected ? `${(steps ?? 0).toLocaleString(locale)} ${isAr ? 'خطوة' : 'steps'} • Fit` : `${(steps ?? 0).toLocaleString(locale)} ${isAr ? 'خطوة' : 'steps'}`}
          pct={stepsPct}
          color="var(--brand-500)"
          bg="rgba(255,107,45,0.12)"
        />
        <button
          onClick={() => setFabOpen((v) => !v)}
          className="absolute -bottom-3 end-0 translate-x-1 h-10 w-10 rounded-xl bg-brand-500 text-white grid place-items-center shadow-[0_6px_16px_rgba(255,107,45,0.35)] border-2 border-bg"
        >
          <Plus size={18} strokeWidth={2.7} />
        </button>
      </div>

      {fabOpen && (
        <div className="mt-6 flex flex-wrap gap-2 animate-[slide-up_0.2s_ease]">
          <Link to="/workouts" className="rounded-full bg-brand-500 text-white px-4 py-2 text-xs font-bold">
            {t('dashboard.startWorkout')}
          </Link>
          <Link to="/nutrition" className="rounded-full bg-surface border border-[var(--line)] px-4 py-2 text-xs font-bold">
            {t('dashboard.logFood')}
          </Link>
          {/* Fixed: adds exactly 250ml, display now shows exact ml so no 300 confusion */}
          <button onClick={() => void addWater(250)} className="rounded-full bg-white border border-[var(--line)] px-4 py-2 text-xs font-bold">
            {t('dashboard.addWater')} • 250ml
          </button>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-[14px] font-extrabold">{t('dashboard.todaySession')}</h2>
        <Link to="/workouts" className="text-xs font-bold text-brand-500 flex items-center gap-1">
          {t('dashboard.viewAll')} <ChevronRight size={12} />
        </Link>
      </div>
      <Link to={`/workouts/${suggested.id}`} className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-surface p-3">
        <div className="h-12 w-12 rounded-xl overflow-hidden relative shrink-0">
          <img src={`https://images.unsplash.com/photo-${suggested.photoId}?w=200&h=200&fit=crop&q=60`} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold truncate">{isAr ? suggested.titleAr : suggested.titleEn}</p>
          <p className="text-xs text-ink-soft">
            {suggested.durationMin} {t('common.minutes')} · {suggested.calories} {t('common.kcal')}
          </p>
        </div>
        <span className="rounded-full bg-brand-500 text-white text-xs font-bold px-4 py-2">{t('workoutDetail.start')}</span>
      </Link>
    </div>
  )
}

function ActivityCircleCard({
  value,
  sub,
  suffix,
  pct,
  color,
  bg,
}: {
  value: number | string
  sub: string
  suffix?: string
  pct: number
  color: string
  bg: string
}) {
  return (
    <div className="rounded-[20px] bg-surface border border-[var(--line)] p-4 flex flex-col items-center text-center shadow-sm">
      <div className="relative h-[72px] w-[72px]">
        <RadialBarChart width={72} height={72} innerRadius={28} outerRadius={36} barSize={6} data={[{ value: pct, fill: color }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={999} background={{ fill: bg }} />
        </RadialBarChart>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[15px] font-black">
            {value}
            {suffix ?? ''}
          </span>
        </div>
      </div>
      <p className="text-[11px] font-bold text-ink-soft mt-1 text-center leading-tight">{sub}</p>
    </div>
  )
}
