import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

interface TrackerState {
  weightEntries: WeightEntry[]
  foodLog: LoggedFoodEntry[]
  waterByDate: Record<string, number>
  completedWorkouts: CompletedWorkout[]
  personalRecords: PersonalRecord[]

  addWeightEntry: (kg: number) => void
  logFood: (entry: Omit<LoggedFoodEntry, 'id' | 'loggedAt'>) => void
  removeFoodEntry: (id: string) => void
  addWater: (ml: number) => void
  completeWorkout: (workoutId: string, durationMin: number, calories: number) => void
  addPersonalRecord: (record: Omit<PersonalRecord, 'id' | 'dateISO'>) => void

  currentStreak: () => number
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      weightEntries: [],
      foodLog: [],
      waterByDate: {},
      completedWorkouts: [],
      personalRecords: [],

      addWeightEntry: (kg) =>
        set((state) => ({
          weightEntries: [
            ...state.weightEntries,
            { id: crypto.randomUUID(), dateISO: new Date().toISOString(), kg },
          ],
        })),

      logFood: (entry) =>
        set((state) => ({
          foodLog: [
            ...state.foodLog,
            { ...entry, id: crypto.randomUUID(), loggedAt: new Date().toISOString() },
          ],
        })),

      removeFoodEntry: (id) =>
        set((state) => ({ foodLog: state.foodLog.filter((entry) => entry.id !== id) })),

      addWater: (ml) =>
        set((state) => {
          const key = todayKey()
          const current = state.waterByDate[key] ?? 0
          return { waterByDate: { ...state.waterByDate, [key]: Math.max(0, current + ml) } }
        }),

      completeWorkout: (workoutId, durationMin, calories) =>
        set((state) => ({
          completedWorkouts: [
            ...state.completedWorkouts,
            { id: crypto.randomUUID(), workoutId, dateISO: new Date().toISOString(), durationMin, calories },
          ],
        })),

      addPersonalRecord: (record) =>
        set((state) => ({
          personalRecords: [
            { ...record, id: crypto.randomUUID(), dateISO: new Date().toISOString() },
            ...state.personalRecords,
          ],
        })),

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
    }),
    { name: 'fit-track-tracker-store' },
  ),
)

export { todayKey }
