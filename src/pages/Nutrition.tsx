import { Minus, Plus, Trash2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

import { AiPlanCard } from '@/components/AiPlanCard'
import { Button } from '@/components/ui/Button'
import type { SelectGroup } from '@/components/ui/Select'
import { Select } from '@/components/ui/Select'
import type { FoodCategory, LoggedFoodEntry } from '@/data/foods'
import { foods } from '@/data/foods'
import { calculateBMR, calculateMacros, calculateTDEE } from '@/lib/calculations'
import { useAuthStore } from '@/store/useAuthStore'
import { dateKeyOf, todayKey, useTrackerStore } from '@/store/useTrackerStore'

const meals: LoggedFoodEntry['meal'][] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function Nutrition() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const user = useAuthStore((state) => state.user)

  const foodLog = useTrackerStore((state) => state.foodLog)
  const logFood = useTrackerStore((state) => state.logFood)
  const removeFoodEntry = useTrackerStore((state) => state.removeFoodEntry)
  const waterByDate = useTrackerStore((state) => state.waterByDate)
  const addWater = useTrackerStore((state) => state.addWater)

  const key = todayKey()
  const waterMl = waterByDate[key] ?? 0
  const todayLog = foodLog.filter((entry) => dateKeyOf(entry.loggedAt) === key)

  const [foodId, setFoodId] = useState(foods[0].id)
  const [gramsText, setGramsText] = useState('100')
  const [meal, setMeal] = useState<LoggedFoodEntry['meal']>('breakfast')
  const [addingFood, setAddingFood] = useState(false)
  const [waterPending, setWaterPending] = useState(false)
  const [search, setSearch] = useState('')

  const foodOptions = useMemo(() => {
    const groups = new Map<FoodCategory, typeof foods>()
    for (const food of foods) {
      const list = groups.get(food.category) ?? []
      list.push(food)
      groups.set(food.category, list)
    }
    const result: SelectGroup[] = Array.from(groups.entries()).map(([category, items]) => ({
      label: t(`nutrition.foodCategories.${category}`),
      options: items
        .filter((f) => (search ? (isAr ? f.nameAr : f.nameEn).toLowerCase().includes(search.toLowerCase()) : true))
        .map((food) => ({ value: food.id, label: isAr ? food.nameAr : food.nameEn })),
    }))
    return result.filter((g) => g.options.length > 0)
  }, [t, isAr, search])

  const mealOptions = meals.map((m) => ({ value: m, label: t(`nutrition.meals.${m}`) }))

  const targets = user
    ? calculateMacros(calculateTDEE(calculateBMR(user.weightKg, user.heightCm, user.age, user.gender), user.activityLevel), user.goal)
    : { calories: 2347, proteinG: 120, carbsG: 220, fatG: 65 }

  const totals = todayLog.reduce(
    (sum, entry) => {
      const food = foods.find((f) => f.id === entry.foodId)
      if (!food) return sum
      const factor = entry.grams / 100
      return {
        calories: sum.calories + food.kcalPer100g * factor,
        protein: sum.protein + food.proteinPer100g * factor,
        carbs: sum.carbs + food.carbsPer100g * factor,
        fat: sum.fat + food.fatPer100g * factor,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const countdown = Math.max(0, Math.round(targets.calories - totals.calories))

  async function handleAddFood() {
    const grams = Number(gramsText)
    if (!Number.isFinite(grams) || grams <= 0) return
    setAddingFood(true)
    try {
      await logFood({ foodId, grams, meal })
    } finally {
      setAddingFood(false)
    }
  }

  async function handleAddWater(ml: number) {
    setWaterPending(true)
    try {
      await addWater(ml)
    } finally {
      setWaterPending(false)
    }
  }

  const proteinPct = Math.min(100, Math.round((totals.protein / targets.proteinG) * 100))
  const carbsPct = Math.min(100, Math.round((totals.carbs / targets.carbsG) * 100))
  const fatPct = Math.min(100, Math.round((totals.fat / targets.fatG) * 100))

  return (
    <div className="max-w-[560px] mx-auto px-4 pt-6 pb-6 md:pt-8 md:px-6">
      <h1 className="text-[22px] font-black tracking-tight">{t('nutrition.title')}</h1>

      {/* Calories card like screenshot */}
      <div className="mt-4 rounded-[24px] bg-surface border border-[var(--line)] p-5 shadow-sm">
        <p className="text-sm font-extrabold">{t('nutrition.calories')}</p>
        <div className="mt-4 flex justify-center">
          <div className="relative h-[160px] w-[160px]">
            {/* donut background arcs: use two overlapping radial charts for orange/yellow/blue like screenshot */}
            <RadialBarChart
              width={160}
              height={160}
              innerRadius={62}
              outerRadius={78}
              barSize={12}
              data={[
                { value: Math.min(100, Math.round((totals.calories / targets.calories) * 100)), fill: '#FF6B2D' },
              ]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="value" cornerRadius={999} background={{ fill: 'var(--surface-2)' }} />
            </RadialBarChart>
            {/* second ring for carbs/fat simulation */}
            <div className="absolute inset-0">
              <RadialBarChart
                width={160}
                height={160}
                innerRadius={52}
                outerRadius={60}
                barSize={6}
                data={[{ value: carbsPct, fill: '#FFC24C' }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" cornerRadius={999} background={{ fill: 'transparent' }} />
              </RadialBarChart>
            </div>
            <div className="absolute inset-0">
              <RadialBarChart
                width={160}
                height={160}
                innerRadius={44}
                outerRadius={50}
                barSize={5}
                data={[{ value: fatPct, fill: '#4A90E2' }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" cornerRadius={999} background={{ fill: 'transparent' }} />
              </RadialBarChart>
            </div>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[28px] font-black leading-none tracking-tight">{countdown}</p>
                <p className="text-xs font-bold text-ink-soft mt-1">{t('nutrition.remaining')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <MacroStrip label={t('nutrition.protein')} value={Math.round(totals.protein)} target={targets.proteinG} pct={proteinPct} color="#FF6B2D" />
          <MacroStrip label={t('nutrition.carbs')} value={Math.round(totals.carbs)} target={targets.carbsG} pct={carbsPct} color="#FFC24C" />
          <MacroStrip label={t('nutrition.fat')} value={Math.round(totals.fat)} target={targets.fatG} pct={fatPct} color="#4A90E2" />
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-2 border border-[var(--line)] px-4 py-3">
          <p className="text-sm font-bold flex items-center gap-2">💧 {t('nutrition.water')} {(waterMl / 1000).toFixed(2)} {t('common.liter')}</p>
          <div className="flex gap-2">
            <button onClick={() => void handleAddWater(-250)} disabled={waterPending} className="h-8 w-8 rounded-full bg-surface border border-[var(--line)] grid place-items-center">
              <Minus size={14} />
            </button>
            <button onClick={() => void handleAddWater(250)} disabled={waterPending} className="h-8 w-8 rounded-full bg-brand-500 text-white grid place-items-center">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Food input like screenshot */}
      <div className="mt-5">
        <h2 className="text-sm font-extrabold">{t('nutrition.addFood')}</h2>
        <div className="mt-3 rounded-[24px] bg-surface border border-[var(--line)] p-4 shadow-sm">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('nutrition.selectFood')}
                className="w-full rounded-full border border-[var(--line)] bg-surface-2 ps-9 pe-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
              {search && (
                <div className="absolute top-full mt-2 w-full rounded-2xl bg-surface border border-[var(--line)] shadow-lg max-h-40 overflow-auto z-10">
                  {foodOptions.flatMap((g) => g.options.slice(0, 3)).map((opt) => (
                    <button key={opt.value} onClick={() => { setFoodId(opt.value); setSearch('') }} className="w-full text-start px-3 py-2 text-sm hover:bg-surface-2">
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => void handleAddFood()} loading={addingFood} className="!rounded-full !px-6">
              {t('nutrition.add')}
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Select value={foodId} onChange={setFoodId} options={foodOptions} className="col-span-2" />
            <input
              type="number"
              min={1}
              value={gramsText}
              onChange={(e) => setGramsText(e.target.value)}
              placeholder={t('nutrition.grams')}
              className="rounded-full border border-[var(--line)] bg-surface-2 px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div className="mt-3">
            <Select value={meal} onChange={(v) => setMeal(v as LoggedFoodEntry['meal'])} options={mealOptions} />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <AiPlanCard type="nutrition" />
      </div>

      <h2 className="mt-6 text-sm font-extrabold">{t('nutrition.log')}</h2>
      {todayLog.length === 0 ? (
        <p className="text-sm text-ink-soft mt-2">{t('nutrition.noEntries')}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {todayLog.map((entry) => {
            const food = foods.find((f) => f.id === entry.foodId)
            if (!food) return null
            return (
              <li key={entry.id} className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-surface p-3.5">
                <div>
                  <p className="text-sm font-bold">{isAr ? food.nameAr : food.nameEn}</p>
                  <p className="text-xs text-ink-soft">
                    {entry.grams} {t('common.grams')} · {t(`nutrition.meals.${entry.meal}`)} · {Math.round((food.kcalPer100g * entry.grams) / 100)} {t('common.kcal')}
                  </p>
                </div>
                <button onClick={() => void removeFoodEntry(entry.id)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-surface-2 text-ink-soft">
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function MacroStrip({ label, value, target, pct, color }: { label: string; value: number; target: number; pct: number; color: string }) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span className="text-ink-soft">{value} / {target} {t('common.grams')}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
