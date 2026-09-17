import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronRight, Droplets, Flame, Footprints, Plus, Salad, X, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Line, LineChart, PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

import { Card } from '@/components/ui/Card'
import { foods } from '@/data/foods'
import { api } from '@/lib/api'
import { workouts } from '@/data/workouts'
import { calculateBMR, calculateMacros, calculateTDEE } from '@/lib/calculations'
import { useAppStore } from '@/store/useAppStore'
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
  const theme = useAppStore((state) => state.theme)
  const foodLog = useTrackerStore((state) => state.foodLog)
  const waterByDate = useTrackerStore((state) => state.waterByDate)
  const weightEntries = useTrackerStore((state) => state.weightEntries)
  const completedWorkouts = useTrackerStore((state) => state.completedWorkouts)
  const streak = useTrackerStore((state) => state.currentStreak())
  const addWater = useTrackerStore((state) => state.addWater)

  const [fabOpen, setFabOpen] = useState(false)
  const [steps, setSteps] = useState<number | null>(null)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: 'end', block: 'nearest' })
  }, [])

  useEffect(() => {
    api
      .get<{ connected: boolean; steps?: number | null }>(`/fit?action=steps&tzOffset=${new Date().getTimezoneOffset()}`)
      .then((data) => setSteps(data.connected ? (data.steps ?? null) : null))
      .catch(() => setSteps(null))
  }, [])

  useEffect(() => {
    api
      .get<{ unreadCount: number }>('/push?action=list')
      .then((data) => setHasUnreadNotifications(data.unreadCount > 0))
      .catch(() => undefined)
  }, [])

  const isAr = i18n.language === 'ar'
  const locale = isAr ? 'ar' : 'en-US'
  const key = todayKey()
  const waterMl = waterByDate[key] ?? 0

  const caloriesTarget = user
    ? Math.round(calculateMacros(calculateTDEE(calculateBMR(user.weightKg, user.heightCm, user.age, user.gender), user.activityLevel), user.goal).calories)
    : 2000

  const caloriesToday = Math.round(
    foodLog
      .filter((entry) => dateKeyOf(entry.loggedAt) === key)
      .reduce((sum, entry) => {
        const food = foods.find((f) => f.id === entry.foodId)
        return food ? sum + (food.kcalPer100g * entry.grams) / 100 : sum
      }, 0),
  )
  const caloriesRemaining = caloriesTarget - caloriesToday
  const caloriesPct = Math.min(100, Math.round((caloriesToday / caloriesTarget) * 100))

  const caloriesBurnedToday = Math.round(
    completedWorkouts
      .filter((entry) => dateKeyOf(entry.dateISO) === key)
      .reduce((sum, entry) => sum + entry.calories, 0),
  )

  const suggested = workouts[0]

  const weightData = weightEntries.slice(-10).map((entry) => ({ kg: entry.kg }))
  const latestWeight = weightEntries.at(-1)?.kg
  const previousWeight = weightEntries.at(-2)?.kg
  const weightDelta = latestWeight != null && previousWeight != null ? latestWeight - previousWeight : null

  const initial = (user?.name?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-8 md:pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-accent grid place-items-center text-[var(--ink-on-brand)] font-extrabold">
            {initial}
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">{t('dashboard.greeting', { name: user?.name ?? '' })}</h1>
            <p className="text-ink-soft text-sm">{t('dashboard.subtitle')}</p>
          </div>
        </div>
        <Link
          to="/notifications"
          aria-label={t('nav.notifications')}
          className="relative h-10 w-10 shrink-0 grid place-items-center rounded-full bg-surface border border-surface-2 text-ink-soft hover:text-ink hover:border-brand-500/50 transition"
        >
          <Bell size={18} />
          {hasUnreadNotifications && (
            <span className="absolute top-2 end-2 h-2 w-2 rounded-full bg-brand-500" />
          )}
        </Link>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar">
        {currentWeek().map((d) => {
          const isToday = d.toDateString() === new Date().toDateString()
          return (
            <div
              key={d.toISOString()}
              ref={isToday ? todayRef : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3.5 py-2.5 shrink-0 ${
                isToday
                  ? 'bg-brand-500 text-[var(--ink-on-brand)] shadow-[0_0_20px_-4px_var(--brand-500)]'
                  : 'bg-surface border border-surface-2 text-ink-soft'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {d.toLocaleDateString(locale, { weekday: 'short' })}
              </span>
              <span className="text-sm font-extrabold">{d.getDate()}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-brand-500/30 bg-surface p-5 relative overflow-hidden">
        <span className="pointer-events-none absolute -end-4 -top-4 text-7xl font-black tracking-tighter text-brand-500/10 select-none">
          {t(`themes.${theme}.name`)}
        </span>
        <p className="relative font-extrabold text-lg text-brand-400">{t(`dashboard.motivation.${theme}`)}</p>
      </div>

      <h2 className="mt-7 mb-3 font-bold text-ink-soft text-sm uppercase tracking-wide">
        {t('dashboard.recentActivity')}
      </h2>
      <Card className="p-2">
        <ActivityRow
          icon={<Flame size={18} className="text-brand-400" />}
          label={t('dashboard.caloriesToday')}
          primary={`${caloriesToday}`}
          suffix={`/ ${caloriesTarget} ${t('common.kcal')}`}
        />
        <ActivityRow
          icon={<Flame size={18} className="text-accent" />}
          label={t('dashboard.caloriesBurned')}
          primary={`${caloriesBurnedToday}`}
          suffix={t('common.kcal')}
        />
        <ActivityRow
          icon={<Droplets size={18} className="text-accent" />}
          label={t('dashboard.waterToday')}
          primary={(waterMl / 1000).toFixed(1)}
          suffix="L"
        />
        <ActivityRow
          icon={<Zap size={18} className="text-brand-400" />}
          label={t('dashboard.streakLabel')}
          primary={`${streak}`}
          suffix={t('common.streak')}
          last={steps == null}
        />
        {steps != null && (
          <ActivityRow
            icon={<Footprints size={18} className="text-brand-400" />}
            label={t('dashboard.steps')}
            primary={steps.toLocaleString(locale)}
            suffix={t('dashboard.stepsUnit')}
            last
          />
        )}
      </Card>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-bold text-ink-soft text-sm uppercase tracking-wide">{t('dashboard.todaySession')}</h2>
        <Link to="/workouts" className="text-sm font-semibold text-brand-400 inline-flex items-center gap-0.5">
          {t('dashboard.viewAll')} <ChevronRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
      <Link
        to={`/workouts/${suggested.id}`}
        className="mt-3 flex items-center gap-4 rounded-2xl border border-surface-2 bg-surface p-4 hover:border-brand-500/50 transition"
      >
        <div
          className="h-14 w-14 shrink-0 rounded-xl grid place-items-center text-[var(--ink-on-brand)] font-extrabold text-lg"
          style={{ background: `linear-gradient(135deg, ${suggested.gradient[0]}, ${suggested.gradient[1]})` }}
        >
          {(isAr ? suggested.titleAr : suggested.titleEn).slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold truncate">{isAr ? suggested.titleAr : suggested.titleEn}</p>
          <p className="text-ink-soft text-sm mt-0.5">
            {suggested.durationMin} {t('common.minutes')} · {suggested.calories} {t('common.kcal')}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-500 text-[var(--ink-on-brand)] text-sm font-bold px-4 py-2 shadow-[0_0_20px_-4px_var(--brand-500)]">
          {t('workoutDetail.start')}
        </span>
      </Link>

      <h2 className="mt-7 mb-3 font-bold text-ink-soft text-sm uppercase tracking-wide">
        {t('dashboard.healthMetrics')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-ink-soft font-semibold">{t('dashboard.weightTrend')}</p>
          {latestWeight != null ? (
            <>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold">{latestWeight}</span>
                <span className="text-ink-soft text-sm">kg</span>
                {weightDelta != null && weightDelta !== 0 && (
                  <span className={`text-xs font-bold ${weightDelta < 0 ? 'text-brand-400' : 'text-ink-soft'}`}>
                    {weightDelta > 0 ? '+' : ''}
                    {weightDelta.toFixed(1)}
                  </span>
                )}
              </div>
              {weightData.length > 1 ? (
                <div className="h-12 mt-2 -mx-1">
                  <RechartsWeightSparkline data={weightData} />
                </div>
              ) : (
                <div className="h-12" />
              )}
            </>
          ) : (
            <Link to="/progress" className="text-sm text-ink-soft mt-3 block">
              {t('dashboard.noWeightYet')}
            </Link>
          )}
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <div className="relative h-20 w-20">
            <RadialBarChart
              width={80}
              height={80}
              innerRadius={28}
              outerRadius={38}
              barSize={7}
              data={[{ value: caloriesPct, fill: 'var(--brand-500)' }]}
              startAngle={90}
              endAngle={-270}
            >
              {/* Without an explicit 0-100 domain, Recharts derives the scale
                  from this single data point and always renders a full
                  circle no matter the actual percentage. */}
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--surface-2)' }} />
            </RadialBarChart>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-base font-black">{caloriesPct}%</span>
            </div>
          </div>
          <p className="text-xs text-ink-soft font-semibold mt-2">{t('dashboard.calorieGoal')}</p>
          <p className="text-[11px] text-ink-soft mt-0.5">
            {caloriesRemaining >= 0
              ? t('dashboard.kcalLeft', { count: caloriesRemaining })
              : t('dashboard.kcalOver', { count: Math.abs(caloriesRemaining) })}
          </p>
        </Card>
      </div>

      <div className="fixed bottom-24 end-5 md:bottom-8 z-30 flex flex-col items-end gap-2.5">
        {fabOpen && (
          <>
            <FabAction to="/workouts" icon={<Zap size={16} />} label={t('dashboard.startWorkout')} onClick={() => setFabOpen(false)} />
            <FabAction to="/nutrition" icon={<Salad size={16} />} label={t('dashboard.logFood')} onClick={() => setFabOpen(false)} />
            <button
              onClick={() => {
                void addWater(250)
                setFabOpen(false)
              }}
              className="flex items-center gap-2 rounded-full bg-surface border border-surface-2 pe-4 ps-3 py-2.5 text-sm font-semibold shadow-lg shadow-black/20"
            >
              <Droplets size={16} className="text-accent" /> {t('dashboard.addWater')}
            </button>
          </>
        )}
        <button
          onClick={() => setFabOpen((v) => !v)}
          aria-label={t('dashboard.quickActions')}
          className="h-14 w-14 rounded-full bg-brand-500 text-[var(--ink-on-brand)] grid place-items-center shadow-[0_0_28px_-4px_var(--brand-500)] hover:brightness-110 active:brightness-95 transition"
        >
          {fabOpen ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>
    </div>
  )
}

function ActivityRow({
  icon,
  label,
  primary,
  suffix,
  last,
}: {
  icon: React.ReactNode
  label: string
  primary: string
  suffix: string
  last?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-2.5 py-3 ${last ? '' : 'border-b border-surface-2'}`}>
      <div className="h-10 w-10 shrink-0 rounded-full bg-brand-500/10 grid place-items-center">{icon}</div>
      <span className="flex-1 text-sm text-ink-soft font-medium">{label}</span>
      <span className="text-end leading-none">
        <span className="text-lg font-black tracking-tight">{primary}</span>
        <span className="text-xs text-ink-soft font-semibold ms-1">{suffix}</span>
      </span>
    </div>
  )
}

function FabAction({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-surface border border-surface-2 pe-4 ps-3 py-2.5 text-sm font-semibold shadow-lg shadow-black/20"
    >
      <span className="text-brand-400">{icon}</span> {label}
    </Link>
  )
}

function RechartsWeightSparkline({ data }: { data: { kg: number }[] }) {
  return (
    <LineChart width={140} height={48} data={data}>
      <Line type="monotone" dataKey="kg" stroke="var(--brand-500)" strokeWidth={2} dot={false} />
    </LineChart>
  )
}
