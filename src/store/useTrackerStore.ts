import { create } from 'zustand'

import { api } from '@/lib/api'
import type { LoggedFoodEntry } from '@/data/foods'

export interface WeightEntry {
  id: string
  dateISO: string
  kg: number
}

export interface CompletedWorkout {
  id: string
  workoutId: string
  dateISO: string
  durationMin: number
  calories: number
}

export interface PersonalRecord {
  id: string
  exerciseNameEn: string
  exerciseNameAr: string
  value: string
  dateISO: string
}

// A "YYYY-MM-DD" key in the browser's *local* calendar day. Using
// `.toISOString().slice(0, 10)` instead (as this used to) reports the UTC
// calendar date — for anyone east of UTC, that day only rolls over a few
// hours after their actual local midnight, so today's totals kept showing
// as "yesterday" for the first part of each new day.
export function dateKeyOf(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return dateKeyOf(new Date())
}

interface HydratePayload {
  weightEntries: WeightEntry[]
  foodLog: LoggedFoodEntry[]
  waterByDate: Record<string, number>
  completedWorkouts: CompletedWorkout[]
  personalRecords: PersonalRecord[]
}

interface TrackerState {
  weightEntries: WeightEntry[]
  foodLog: LoggedFoodEntry[]
  waterByDate: Record<string, number>
  completedWorkouts: CompletedWorkout[]
  personalRecords: PersonalRecord[]

  hydrate: (data: HydratePayload) => void
  reset: () => void

  addWeightEntry: (kg: number) => Promise<void>
  logFood: (entry: Omit<LoggedFoodEntry, 'id' | 'loggedAt'>) => Promise<void>
  removeFoodEntry: (id: string) => Promise<void>
  addWater: (ml: number) => Promise<void>
  completeWorkout: (workoutId: string, durationMin: number, calories: number) => Promise<void>
  addPersonalRecord: (record: Omit<PersonalRecord, 'id' | 'dateISO'>) => Promise<void>

  currentStreak: () => number
}

const empty: HydratePayload = {
  weightEntries: [],
  foodLog: [],
  waterByDate: {},
  completedWorkouts: [],
  personalRecords: [],
}

export const useTrackerStore = create<TrackerState>()((set, get) => ({
  ...empty,

  hydrate: (data) => set(data),
  reset: () => set(empty),

  addWeightEntry: async (kg) => {
    const { entry } = await api.post<{ entry: WeightEntry }>('/tracking', { resource: 'weight', kg })
    set((state) => ({ weightEntries: [...state.weightEntries, entry] }))
  },

  logFood: async (entry) => {
    const { entry: created } = await api.post<{ entry: LoggedFoodEntry }>('/tracking', {
      resource: 'food-log',
      ...entry,
    })
    set((state) => ({ foodLog: [...state.foodLog, created] }))
  },

  removeFoodEntry: async (id) => {
    await api.delete(`/tracking?resource=food-log&id=${encodeURIComponent(id)}`)
    set((state) => ({ foodLog: state.foodLog.filter((entry) => entry.id !== id) }))
  },

  addWater: async (ml) => {
    const key = todayKey()
    // Show the new total immediately instead of waiting on the round-trip,
    // then reconcile with the DB's real total once it comes back.
    set((state) => ({ waterByDate: { ...state.waterByDate, [key]: (state.waterByDate[key] ?? 0) + ml } }))
    try {
      const { totalMlToday } = await api.post<{ totalMlToday: number }>('/tracking', {
        resource: 'water',
        ml,
        tzOffset: new Date().getTimezoneOffset(),
      })
      set((state) => ({ waterByDate: { ...state.waterByDate, [key]: totalMlToday } }))
    } catch (err) {
      set((state) => ({ waterByDate: { ...state.waterByDate, [key]: Math.max(0, (state.waterByDate[key] ?? ml) - ml) } }))
      throw err
    }
  },

  completeWorkout: async (workoutId, durationMin, calories) => {
    const { entry } = await api.post<{ entry: CompletedWorkout }>('/tracking', {
      resource: 'workout',
      workoutId,
      durationMin,
      calories,
    })
    set((state) => ({ completedWorkouts: [...state.completedWorkouts, entry] }))
  },

  addPersonalRecord: async (record) => {
    const { record: created } = await api.post<{ record: PersonalRecord }>('/tracking', {
      resource: 'personal-record',
      ...record,
    })
    set((state) => ({ personalRecords: [created, ...state.personalRecords] }))
  },

  currentStreak: () => {
    const dates = new Set(get().completedWorkouts.map((w) => dateKeyOf(w.dateISO)))
    let streak = 0
    const cursor = new Date()
    for (;;) {
      const key = dateKeyOf(cursor)
      if (!dates.has(key)) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  },
}))
