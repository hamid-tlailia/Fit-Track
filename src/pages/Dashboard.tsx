import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Plus, Flame, HeartPulse, Dumbbell, Salad, Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

import { estimateActiveCalories } from '@/lib/activity'
import { foods } from '@/data/foods'
import { api } from '@/lib/api'
import { workouts } from '@/data/workouts'
import { calculateBMR, calculateMacros, calculateTDEE } from '@/lib/calculations'
import { useAuthStore } from '@/store/useAuthStore'
import { dateKeyOf, todayKey, useTrackerStore } from '@/store/useTrackerStore'

// The FAB is portaled into the `#home-fab-root` slot that AppLayout renders, so it floats
// above the page content instead of being clipped by the scroll container. The slot is part
// of the same commit as this page, so it does not exist during the first render — reading it
// through an external store lets React pick it up right after mount without extra state.
const readFabHost = () => document.getElementById('home-fab-root')
const subscribeToFabHost = () => () => {}

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

  const [now, setNow] = useState(() => new Date())
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [waterBusy, setWaterBusy] = useState(false)
  const [actionError, setActionError] = useState(false)
  const [steps, setSteps] = useState<number | null>(null)
  const [fitDay, setFitDay] = useState('')
  const [fitTime, setFitTime] = useState(() => new Date())
  const [fitCalories, setFitCalories] = useState<number | null>(null)
  const [fitConnected, setFitConnected] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const fabHost = useSyncExternalStore(subscribeToFabHost, readFabHost, () => null)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => { todayRef.current?.scrollIntoView({ inline: 'end', block: 'nearest' }) }, [])

  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = setInterval(tick, 30_000)
    window.addEventListener('focus', tick)
    return () => { clearInterval(timer); window.removeEventListener('focus', tick) }
  }, [])

  // Google Fit sync: steps + caloriesBurned together — fix sync issue
  useEffect(() => {
    let cancelled = false
    async function fetchFit() {
      try {
        const requestedAt = new Date()
        const data = await api.get<{ connected: boolean; steps?: number | null; caloriesBurned?: number | null; heartRate?: number | null; distanceMeters?: number | null }>(`/fit?action=steps&tzOffset=${new Date().getTimezoneOffset()}`)
        if (cancelled || dateKeyOf(requestedAt) !== todayKey()) return
        setFitDay(dateKeyOf(requestedAt)); setFitTime(requestedAt)
        setFitConnected(!!data.connected)
        setSteps(data.connected ? (data.steps ?? null) : null)
        setHeartRate(data.heartRate ?? null)
        setDistanceMeters(data.distanceMeters ?? null)
        setFitCalories(data.connected && data.caloriesBurned != null ? data.caloriesBurned : null)
      } catch {
        if (!cancelled) { setSteps(null); setHeartRate(null); setDistanceMeters(null); setFitCalories(null); setFitConnected(false) }
      }
    }
    fetchFit()
    const id = setInterval(fetchFit, 60000)
    const onVis = () => { if (document.visibilityState === 'visible') fetchFit() }
    const onRefresh = () => { void fetchFit() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('fitforge:refresh', onRefresh)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('fitforge:refresh', onRefresh) }
  }, [])

  const isAr = i18n.language === 'ar'
  const locale = isAr ? 'ar' : 'en-US'
  const key = dateKeyOf(now)
  const hasFitToday = fitDay === key
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
  const midnight = new Date(fitTime); midnight.setHours(0, 0, 0, 0)
  const activeFitCalories = hasFitToday && fitCalories != null && user
    ? estimateActiveCalories(fitCalories, calculateBMR(user.weightKg, user.heightCm, user.age, user.gender), (fitTime.getTime() - midnight.getTime()) / 60_000)
    : null
  // Do not add Fit and workout calories: they may describe the same activity.
  const caloriesBurnedToday = activeFitCalories ?? localCaloriesBurned

  const caloriesPct = Math.min(100, Math.round((caloriesToday / caloriesTarget) * 100))
  const waterPct = Math.min(100, Math.round((waterL / 2.5) * 100))
  const burnedPct = Math.min(100, Math.round((caloriesBurnedToday / 600) * 100))
  const stepsPct = steps != null ? Math.min(100, Math.round((steps / 10000) * 100)) : 0

  const suggested = workouts[0]
  const initial = (user?.name?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <div className="max-w-[560px] mx-auto px-4 pt-5 pb-28 md:pt-8 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label={t('nav.profile')}
            className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover border border-[var(--line)]" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 grid place-items-center text-white font-black text-sm">
                {initial}
              </div>
            )}
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[15px] font-extrabold leading-none">{user?.name ?? ''}</h1>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-brand-500 text-white">{t(`subscription.plans.${user?.subscriptionTier ?? 'free'}.name`)}</span>
              {(
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                  <Flame size={10} /> {streak} {t('common.streak')}
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
      </div>

      <div className="mt-5 flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        {currentWeek().map((d) => {
          const isToday = d.toDateString() === new Date().toDateString()
          const dayLetter = d.toLocaleDateString(locale, { weekday: 'long' })
          return (
            <div
              key={d.toISOString()}
              ref={isToday ? todayRef : undefined}
              className={`flex flex-col items-center justify-center rounded-2xl min-w-[68px] flex-1 px-2 py-2 border text-center ${
                isToday ? 'bg-brand-500 border-brand-500 text-white shadow-[var(--glow-brand)]' : 'bg-surface border-[var(--line)] text-ink-soft'
              }`}
            >
              <span className="text-[11px] font-bold">{dayLetter}</span>
              <span className={`text-[13px] font-extrabold mt-0.5 h-7 w-7 grid place-items-center rounded-full ${isToday ? 'bg-white/20 text-white' : ''}`}>
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
          label={t('dashboard.caloriesToday')}
          value={caloriesToday}
          sub={`${caloriesToday}/${caloriesTarget} ${t('common.kcal')}`}
          pct={caloriesPct}
          color="var(--brand-500)"
          bg="rgba(255,107,45,0.12)"
        />
        <ActivityCircleCard
          label={t('dashboard.waterToday')}
          value={`${(waterMl / 1000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}`}
          suffix={` ${t('common.liter')}`}
          sub={`${waterMl} ${t('common.ml')}`}
          pct={waterPct}
          color="#3B82F6"
          bg="rgba(59,130,246,0.12)"
        />
        {/* Calories Burned — synced with Google Fit when connected */}
        <ActivityCircleCard
          label={t('dashboard.activeCalories')}
          value={caloriesBurnedToday}
          sub={`${t('dashboard.estimated')} • ${activeFitCalories != null ? 'Google Fit' : t('nav.workouts')}`}
          pct={burnedPct}
          color="var(--brand-500)"
          bg="rgba(255,107,45,0.12)"
        />
        <ActivityCircleCard
          label={t('dashboard.steps')}
          value={hasFitToday ? steps ?? '—' : '—'}
          sub={!hasFitToday || steps == null ? t('dashboard.noSensorData') : t('dashboard.stepsUnit')}
          pct={hasFitToday ? stepsPct : 0}
          color="var(--brand-500)"
          bg="rgba(255,107,45,0.12)"
        />
      </div>

      <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
        <h3 className="font-bold text-sm flex gap-2 items-center"><HeartPulse size={18} className="text-rose-500" />{t('dashboard.healthMetrics')}</h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><p className="text-ink-soft text-sm">{t('dashboard.heartRate')}</p><p className="font-bold text-lg mt-1">{!hasFitToday || heartRate == null ? '—' : `${Math.round(heartRate)} ${t('dashboard.bpm')}`}</p></div>
          <div><p className="text-ink-soft text-sm">{t('dashboard.distance')}</p><p className="font-bold text-lg mt-1">{!hasFitToday || distanceMeters == null ? '—' : `${(distanceMeters / 1000).toFixed(2)} ${t('common.km')}`}</p></div>
        </div>
        {(!hasFitToday || heartRate == null) && <p className="mt-2 text-xs text-ink-soft">{t('dashboard.sensorHint')}</p>}
        {hasFitToday && fitCalories != null && <p className="mt-2 text-xs text-ink-soft">{t('dashboard.totalEnergy', { count: fitCalories })}</p>}
      </div>

      {fabHost && createPortal(
        <div className="pointer-events-auto flex flex-col items-center gap-3">
          {fabOpen && <div id="home-actions" className="w-64 rounded-2xl border border-line bg-surface p-3 shadow-2xl flex flex-col gap-2 animate-[slide-up_0.2s_ease]">
            <Link to="/workouts" className="rounded-xl bg-brand-500 text-white px-4 py-3 text-sm font-bold flex items-center gap-2.5"><Dumbbell size={16} /> {t('dashboard.startWorkout')}</Link>
            <Link to="/nutrition" className="rounded-xl bg-surface-2 px-4 py-3 text-sm font-bold flex items-center gap-2.5"><Salad size={16} /> {t('dashboard.logFood')}</Link>
            <button disabled={waterBusy} onClick={async () => {
              setWaterBusy(true); setActionError(false)
              try { await addWater(250); setFabOpen(false) } catch { setActionError(true) } finally { setWaterBusy(false) }
            }} className="rounded-xl bg-surface-2 px-4 py-3 text-sm font-bold disabled:opacity-50 flex items-center gap-2.5"><Droplets size={16} /> {waterBusy ? t('common.loading') : t('dashboard.addWater')}</button>
            {actionError && <p role="alert" className="text-xs text-red-500">{t('common.saveError')}</p>}
          </div>}
          <button onClick={() => setFabOpen((v) => !v)} aria-label={fabOpen ? t('common.close') : t('dashboard.quickActions')} aria-expanded={fabOpen} aria-controls="home-actions"
            className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white grid place-items-center shadow-[0_8px_28px_rgba(255,107,45,.4)] border-4 border-bg transition active:scale-95">
            <Plus size={26} strokeWidth={2.5} className={`transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
          </button>
        </div>,
        fabHost,
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
  label,
  value,
  sub,
  suffix,
  pct,
  color,
  bg,
}: {
  label: string
  value: number | string
  sub: string
  suffix?: string
  pct: number
  color: string
  bg: string
}) {
  return (
    <div className="rounded-[20px] bg-surface border border-[var(--line)] p-4 flex flex-col items-center text-center shadow-sm">
      <p className="text-sm font-bold mb-2">{label}</p>
      <div className="relative h-24 w-24">
        <RadialBarChart width={96} height={96} innerRadius={36} outerRadius={47} barSize={9} data={[{ value: pct, fill: color }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={999} background={{ fill: bg }} />
        </RadialBarChart>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl font-black">
            {value}
            {suffix ?? ''}
          </span>
        </div>
      </div>
      <p className="text-xs font-bold text-ink-soft mt-1.5 text-center leading-tight">{sub}</p>
    </div>
  )
}
