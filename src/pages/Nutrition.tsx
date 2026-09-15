import { Droplets, Minus, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { SelectGroup } from '@/components/ui/Select'
import { Select } from '@/components/ui/Select'
import type { FoodCategory, LoggedFoodEntry } from '@/data/foods'
import { foods } from '@/data/foods'
import { calculateBMR, calculateMacros, calculateTDEE } from '@/lib/calculations'
import { useAppStore } from '@/store/useAppStore'
import { todayKey, useTrackerStore } from '@/store/useTrackerStore'

const meals: LoggedFoodEntry['meal'][] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function Nutrition() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const user = useAppStore((state) => state.user)

  const foodLog = useTrackerStore((state) => state.foodLog)
  const logFood = useTrackerStore((state) => state.logFood)
  const removeFoodEntry = useTrackerStore((state) => state.removeFoodEntry)
  const waterByDate = useTrackerStore((state) => state.waterByDate)
  const addWater = useTrackerStore((state) => state.addWater)

  const key = todayKey()
  const waterMl = waterByDate[key] ?? 0
  const todayLog = foodLog.filter((entry) => entry.loggedAt.slice(0, 10) === key)

  const [foodId, setFoodId] = useState(foods[0].id)
  const [grams, setGrams] = useState(100)
  const [meal, setMeal] = useState<LoggedFoodEntry['meal']>('breakfast')

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

  function handleAddFood() {
    logFood({ foodId, grams, meal })
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-6 md:pt-10">
      <h1 className="text-2xl font-extrabold">{t('nutrition.title')}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Macro label={t('nutrition.calories')} value={Math.round(totals.calories)} target={targets.calories} unit={t('common.kcal')} />
        <Card className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Droplets size={16} className="text-accent" /> {t('nutrition.water')}
          </div>
          <p className="text-xl font-extrabold">{(waterMl / 1000).toFixed(2)}L</p>
          <div className="flex gap-2">
            <button
              onClick={() => addWater(-250)}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => addWater(250)}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"
            >
              <Plus size={14} />
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
            value={grams}
            onChange={(event) => setGrams(Number(event.target.value))}
            placeholder={t('nutrition.grams')}
            className="rounded-xl border border-surface-2 bg-surface-2 px-3 py-2.5 text-sm"
          />
          <Select
            value={meal}
            onChange={(value) => setMeal(value as LoggedFoodEntry['meal'])}
            options={mealOptions}
          />
        </div>
        <Button onClick={handleAddFood}>{t('nutrition.add')}</Button>
      </Card>

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
                <button onClick={() => removeFoodEntry(entry.id)} className="text-ink-soft hover:text-red-400">
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
