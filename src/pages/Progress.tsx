import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/Button'
import { dateKeyOf, useTrackerStore } from '@/store/useTrackerStore'

function lastNDays(n: number): string[] {
  const days: string[] = []
  const cursor = new Date()
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(cursor)
    d.setDate(cursor.getDate() - i)
    days.push(dateKeyOf(d))
  }
  return days
}

export default function Progress() {
  const { t, i18n } = useTranslation()
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

  const weightData = weightEntries.map((entry) => ({ date: entry.dateISO.slice(5, 10), kg: entry.kg }))
  const latestWeight = weightEntries.at(-1)?.kg ?? '—'

  const days = lastNDays(7)
  const activityData = days.map((day) => ({
    date: day.slice(5, 10),
    calories: completedWorkouts.filter((w) => dateKeyOf(w.dateISO) === day).reduce((sum, w) => sum + w.calories, 0),
  }))
  async function handleAddWeight() {
    const kg = Number(weightInput)
    if (!kg || kg <= 0) return
    setAddingWeight(true)
    try { await addWeightEntry(kg); setWeightInput('') } finally { setAddingWeight(false) }
  }
  async function handleAddPR() {
    if (!prName.trim() || !prValue.trim()) return
    setAddingPR(true)
    try { await addPersonalRecord({ exerciseNameEn: prName, exerciseNameAr: prName, value: prValue }); setPrName(''); setPrValue('') } finally { setAddingPR(false) }
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 pt-6 pb-10 md:pt-8 md:px-6">
      <h1 className="text-[22px] font-black tracking-tight">{t('progress.title')}</h1>

      <div className="mt-4 rounded-[24px] bg-surface border border-[var(--line)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold">{t('progress.weight')}</h2>
          <span className="text-sm font-black">{latestWeight} {t('common.kg')}</span>
        </div>
        {weightEntries.length === 0 && <p className="text-sm text-ink-soft mt-3">{t('progress.noWeightData')}</p>}
        <div className="h-[140px] mt-3 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8C42" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#4A90E2" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#B8AEA2" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#B8AEA2" fontSize={11} tickLine={false} axisLine={false} width={32} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 12 }} />
              <Area type="monotone" name={t('common.kg')} dataKey="kg" stroke="#FF6B2D" strokeWidth={2} fill="url(#weightGrad)" dot={{ r: 3, fill: '#FF6B2D', stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-2">
          <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder={t('progress.addWeight')} className="flex-1 rounded-full border border-[var(--line)] bg-surface-2 px-4 py-2.5 text-sm outline-none" />
          <Button onClick={() => void handleAddWeight()} loading={addingWeight} className="!rounded-full">{t('progress.add')}</Button>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] bg-surface border border-[var(--line)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold">{t('dashboard.recentActivity')}</h2>
          <span className="text-xs font-bold text-ink-soft">{t('progress.weeklyActivity')}</span>
        </div>
        <div className="h-[160px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <XAxis dataKey="date" stroke="#B8AEA2" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#B8AEA2" fontSize={11} tickLine={false} axisLine={false} width={16} domain={[0, 'auto']} />
              <Tooltip contentStyle={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 12 }} />
              <Bar name={t('common.kcal')} dataKey="calories" fill="#5B9CF6" radius={[6, 6, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] bg-surface border border-[var(--line)] p-4 shadow-sm">
        <h2 className="text-sm font-extrabold">{t('progress.personalRecords')}</h2>
        {personalRecords.length === 0 ? (
          <p className="text-sm text-ink-soft mt-2">{t('progress.noPRs')}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {personalRecords.map((pr) => (
              <li key={pr.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
                <span className="font-bold">{i18n.language === 'ar' ? pr.exerciseNameAr : pr.exerciseNameEn}</span>
                <span className="text-ink-soft font-semibold">{pr.value}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input value={prName} onChange={(e) => setPrName(e.target.value)} placeholder={t('progress.exerciseName')} className="rounded-full border border-[var(--line)] bg-surface-2 px-3 py-2.5 text-sm outline-none" />
          <input value={prValue} onChange={(e) => setPrValue(e.target.value)} placeholder={t('progress.value')} className="rounded-full border border-[var(--line)] bg-surface-2 px-3 py-2.5 text-sm outline-none" />
        </div>
        <Button className="w-full mt-2 !rounded-full" variant="secondary" onClick={() => void handleAddPR()} loading={addingPR}>
          {t('progress.addPR')}
        </Button>
      </div>
    </div>
  )
}
