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

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
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
    const { totalMlToday } = await api.post<{ totalMlToday: number }>('/tracking', { resource: 'water', ml })
    set((state) => ({ waterByDate: { ...state.waterByDate, [todayKey()]: totalMlToday } }))
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
    const dates = new Set(get().completedWorkouts.map((w) => w.dateISO.slice(0, 10)))
    let streak = 0
    const cursor = new Date()
    for (;;) {
      const key = cursor.toISOString().slice(0, 10)
      if (!dates.has(key)) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  },
}))
