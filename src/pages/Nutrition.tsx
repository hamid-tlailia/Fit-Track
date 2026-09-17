import { Droplets, Flame, Minus, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RadialBar, RadialBarChart } from 'recharts'

import { AiPlanCard } from '@/components/AiPlanCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { SelectGroup } from '@/components/ui/Select'
import { Select } from '@/components/ui/Select'
import type { FoodCategory, LoggedFoodEntry } from '@/data/foods'
import { foods } from '@/data/foods'
import { calculateBMR, calculateMacros, calculateTDEE } from '@/lib/calculations'
import { useAuthStore } from '@/store/useAuthStore'
import { todayKey, useTrackerStore } from '@/store/useTrackerStore'

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
  const todayLog = foodLog.filter((entry) => entry.loggedAt.slice(0, 10) === key)

  const [foodId, setFoodId] = useState(foods[0].id)
  const [gramsText, setGramsText] = useState('100')
  const [meal, setMeal] = useState<LoggedFoodEntry['meal']>('breakfast')
  const [addingFood, setAddingFood] = useState(false)
  const [waterPending, setWaterPending] = useState(false)

  const foodOptions = useMemo(() => {
    const groups = new Map<FoodCategory, typeof foods>()
    for (const food of foods) {
      const list = groups.get(food.category) ?? []
      list.push(food)
      groups.set(food.category, list)
    }
    const result: SelectGroup[] = Array.from(groups.entries()).map(([category, items]) => ({
      label: t(`nutrition.foodCategories.${category}`),
      options: items.map((food) => ({ value: food.id, label: isAr ? food.nameAr : food.nameEn })),
    }))
    return result
  }, [t, isAr])

  const mealOptions = meals.map((m) => ({ value: m, label: t(`nutrition.meals.${m}`) }))

  const targets = user
    ? calculateMacros(calculateTDEE(calculateBMR(user.weightKg, user.heightCm, user.age, user.gender), user.activityLevel), user.goal)
    : { calories: 2000, proteinG: 120, carbsG: 220, fatG: 65 }

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
  const caloriesPct = Math.min(100, Math.round((totals.calories / targets.calories) * 100))

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

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-6 md:pt-10">
      <h1 className="text-2xl font-extrabold">{t('nutrition.title')}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24">
            <RadialBarChart
              width={96}
              height={96}
              innerRadius={34}
              outerRadius={46}
              barSize={8}
              data={[{ value: caloriesPct, fill: 'var(--brand-500)' }]}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--surface-2)' }} />
            </RadialBarChart>
            <div className="absolute inset-0 grid place-items-center">
              <Flame size={16} className="text-brand-400" />
            </div>
          </div>
          <p className="text-lg font-black mt-1">{Math.round(totals.calories)}</p>
          <p className="text-xs text-ink-soft font-semibold">
            / {targets.calories} {t('common.kcal')}
          </p>
        </Card>
        <Card className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Droplets size={16} className="text-accent" /> {t('nutrition.water')}
          </div>
          <p className="text-2xl font-black">{(waterMl / 1000).toFixed(2)}L</p>
          <div className="flex gap-2">
            <button
              onClick={() => void handleAddWater(-250)}
              disabled={waterPending}
              className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 disabled:opacity-50"
            >
              {waterPending ? <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/30 border-t-ink animate-spin" /> : <Minus size={15} />}
            </button>
            <button
              onClick={() => void handleAddWater(250)}
              disabled={waterPending}
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-[var(--ink-on-brand)] shadow-[0_0_16px_-4px_var(--brand-500)] disabled:opacity-50"
            >
              {waterPending ? <span className="h-3.5 w-3.5 rounded-full border-2 border-[var(--ink-on-brand)]/30 border-t-[var(--ink-on-brand)] animate-spin" /> : <Plus size={15} />}
            </button>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Macro label={t('nutrition.protein')} value={Math.round(totals.protein)} target={targets.proteinG} unit="g" compact />
        <Macro label={t('nutrition.carbs')} value={Math.round(totals.carbs)} target={targets.carbsG} unit="g" compact />
        <Macro label={t('nutrition.fat')} value={Math.round(totals.fat)} target={targets.fatG} unit="g" compact />
      </div>

      <Card className="mt-6 flex flex-col gap-3">
        <h2 className="font-bold">{t('nutrition.addFood')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Select value={foodId} onChange={setFoodId} options={foodOptions} className="col-span-2" />
          <input
            type="number"
            min={1}
            value={gramsText}
            onChange={(event) => setGramsText(event.target.value)}
            placeholder={t('nutrition.grams')}
            className="rounded-xl border border-surface-2 bg-surface-2 px-3 py-2.5 text-sm"
          />
          <Select
            value={meal}
            onChange={(value) => setMeal(value as LoggedFoodEntry['meal'])}
            options={mealOptions}
          />
        </div>
        <Button onClick={() => void handleAddFood()} loading={addingFood}>
          {t('nutrition.add')}
        </Button>
      </Card>

      <div className="mt-6">
        <AiPlanCard type="nutrition" />
      </div>

      <h2 className="mt-6 mb-3 font-bold text-ink-soft text-sm uppercase tracking-wide">{t('nutrition.log')}</h2>
      {todayLog.length === 0 ? (
        <p className="text-ink-soft text-sm">{t('nutrition.noEntries')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todayLog.map((entry) => {
            const food = foods.find((f) => f.id === entry.foodId)
            if (!food) return null
            return (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-surface-2 bg-surface p-3.5"
              >
                <div>
                  <p className="font-semibold">{isAr ? food.nameAr : food.nameEn}</p>
                  <p className="text-xs text-ink-soft">
                    {entry.grams}g · {t(`nutrition.meals.${entry.meal}`)} · {Math.round((food.kcalPer100g * entry.grams) / 100)} {t('common.kcal')}
                  </p>
                </div>
                <button onClick={() => void removeFoodEntry(entry.id)} className="text-ink-soft hover:text-red-400">
                  <Trash2 size={17} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Macro({
  label,
  value,
  target,
  unit,
  compact,
}: {
  label: string
  value: number
  target: number
  unit: string
  compact?: boolean
}) {
  const { t } = useTranslation()
  const pct = Math.min(100, Math.round((value / target) * 100))
  return (
    <Card className={compact ? 'p-3' : undefined}>
      <p className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{label}</p>
      <p className={`font-extrabold ${compact ? 'text-lg mt-1' : 'text-2xl mt-1'}`}>
        {value}
        <span className="text-ink-soft text-sm font-medium">
          {' '}
          / {target} {unit} {t('nutrition.target')}
        </span>
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-500 to-accent" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  )
}
