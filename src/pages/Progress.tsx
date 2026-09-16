import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTrackerStore } from '@/store/useTrackerStore'

function lastNDays(n: number): string[] {
  const days: string[] = []
  const cursor = new Date()
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(cursor)
    d.setDate(cursor.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export default function Progress() {
  const { t } = useTranslation()
  const weightEntries = useTrackerStore((state) => state.weightEntries)
  const addWeightEntry = useTrackerStore((state) => state.addWeightEntry)
  const completedWorkouts = useTrackerStore((state) => state.completedWorkouts)
  const personalRecords = useTrackerStore((state) => state.personalRecords)
  const addPersonalRecord = useTrackerStore((state) => state.addPersonalRecord)

  const [weightInput, setWeightInput] = useState('')
  const [prName, setPrName] = useState('')
  const [prValue, setPrValue] = useState('')
  const [addingWeight, setAddingWeight] = useState(false)
  const [addingPR, setAddingPR] = useState(false)

  const weightData = weightEntries.map((entry) => ({
    date: entry.dateISO.slice(5, 10),
    kg: entry.kg,
  }))
  const latestWeight = weightEntries.at(-1)?.kg

  const days = lastNDays(7)
  const activityData = days.map((day) => ({
    date: day.slice(5, 10),
    calories: completedWorkouts
      .filter((w) => w.dateISO.slice(0, 10) === day)
      .reduce((sum, w) => sum + w.calories, 0),
  }))

  async function handleAddWeight() {
    const kg = Number(weightInput)
    if (!kg || kg <= 0) return
    setAddingWeight(true)
    try {
      await addWeightEntry(kg)
      setWeightInput('')
    } finally {
      setAddingWeight(false)
    }
  }

  async function handleAddPR() {
    if (!prName.trim() || !prValue.trim()) return
    setAddingPR(true)
    try {
      await addPersonalRecord({ exerciseNameEn: prName, exerciseNameAr: prName, value: prValue })
      setPrName('')
      setPrValue('')
    } finally {
      setAddingPR(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-10 md:pt-10">
      <h1 className="text-2xl font-extrabold">{t('progress.title')}</h1>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t('progress.weight')}</h2>
          {latestWeight && (
            <span className="text-sm text-ink-soft">
              {t('progress.currentWeight')}: <b className="text-ink">{latestWeight}kg</b>
            </span>
          )}
        </div>
        {weightData.length > 0 ? (
          <div className="h-48 mt-3 -ms-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <XAxis dataKey="date" stroke="var(--ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--ink-soft)" fontSize={11} tickLine={false} axisLine={false} width={32} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: 'none', borderRadius: 12 }} />
                <Line type="monotone" dataKey="kg" stroke="var(--brand-500)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-ink-soft mt-3">{t('progress.noWeightData')}</p>
        )}
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
            placeholder={t('progress.addWeight')}
            className="flex-1 rounded-xl border border-surface-2 bg-surface-2 px-3 py-2.5 text-sm"
          />
          <Button onClick={() => void handleAddWeight()} loading={addingWeight}>
            {t('progress.add')}
          </Button>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold">{t('progress.weeklyActivity')}</h2>
        <div className="h-44 mt-3 -ms-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <XAxis dataKey="date" stroke="var(--ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--ink-soft)" fontSize={11} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: 'none', borderRadius: 12 }}
                formatter={(value) => [`${value} ${t('progress.caloriesBurned')}`, '']}
              />
              <Bar dataKey="calories" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold">{t('progress.personalRecords')}</h2>
        {personalRecords.length === 0 ? (
          <p className="text-sm text-ink-soft mt-2">{t('progress.noPRs')}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {personalRecords.map((pr) => (
              <li key={pr.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{pr.exerciseNameEn}</span>
                <span className="text-ink-soft">{pr.value}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={prName}
            onChange={(event) => setPrName(event.target.value)}
            placeholder={t('progress.exerciseName')}
            className="rounded-xl border border-surface-2 bg-surface-2 px-3 py-2.5 text-sm"
          />
          <input
            value={prValue}
            onChange={(event) => setPrValue(event.target.value)}
            placeholder={t('progress.value')}
            className="rounded-xl border border-surface-2 bg-surface-2 px-3 py-2.5 text-sm"
          />
        </div>
        <Button className="w-full mt-2" variant="secondary" onClick={() => void handleAddPR()} loading={addingPR}>
          {t('progress.addPR')}
        </Button>
      </Card>
    </div>
  )
}
