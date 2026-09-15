import { create } from 'zustand'

import type { LoggedFoodEntry } from '@/data/foods'
import { ApiError, api } from '@/lib/api'
import type { ActivityLevel, Gender, Goal, SubscriptionTier } from '@/store/useAppStore'
import type { CompletedWorkout, PersonalRecord, WeightEntry } from '@/store/useTrackerStore'
import { useTrackerStore } from '@/store/useTrackerStore'

export interface AuthUser {
  id: string
  name: string
  email: string
  gender: Gender
  goal: Goal
  weightKg: number
  heightCm: number
  age: number
  activityLevel: ActivityLevel
  subscriptionTier: SubscriptionTier
}

interface BootstrapResponse {
  user: AuthUser
  weightEntries: WeightEntry[]
  foodLog: LoggedFoodEntry[]
  waterByDate: Record<string, number>
  completedWorkouts: CompletedWorkout[]
  personalRecords: PersonalRecord[]
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  gender: Gender
  goal: Goal
  weightKg?: number
  heightCm?: number
  age?: number
  activityLevel?: ActivityLevel
}

export interface LoginPayload {
  email: string
  password: string
}

type Status = 'loading' | 'authenticated' | 'guest'

interface AuthState {
  status: Status
  user: AuthUser | null

  bootstrap: () => Promise<void>
  register: (payload: RegisterPayload) => Promise<{ ok: true } | { ok: false; error: string }>
  login: (payload: LoginPayload) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  updateProfile: (patch: Partial<Pick<AuthUser, 'weightKg' | 'heightCm' | 'age' | 'goal' | 'activityLevel'>>) => Promise<void>
  setSubscriptionTier: (tier: SubscriptionTier) => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  user: null,

  bootstrap: async () => {
    try {
      const data = await api.get<BootstrapResponse>('/me')
      set({ user: data.user, status: 'authenticated' })
      useTrackerStore.getState().hydrate(data)
    } catch {
      set({ user: null, status: 'guest' })
    }
  },

  register: async (payload) => {
    try {
      const data = await api.post<{ user: AuthUser }>('/auth/register', payload)
      set({ user: data.user, status: 'authenticated' })
      useTrackerStore.getState().reset()
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof ApiError ? error.code : 'unknown' }
    }
  },

  login: async (payload) => {
    try {
      const data = await api.post<{ user: AuthUser }>('/auth/login', payload)
      set({ user: data.user, status: 'authenticated' })
      await get().bootstrap()
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof ApiError ? error.code : 'unknown' }
    }
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => undefined)
    set({ user: null, status: 'guest' })
    useTrackerStore.getState().reset()
  },

  deleteAccount: async () => {
    await api.delete('/account')
    set({ user: null, status: 'guest' })
    useTrackerStore.getState().reset()
  },

  updateProfile: async (patch) => {
    const data = await api.patch<{ user: AuthUser }>('/profile', patch)
    set({ user: data.user })
  },

  setSubscriptionTier: async (tier) => {
    const data = await api.post<{ user: AuthUser }>('/subscription', { tier })
    set({ user: data.user })
  },
}))

export const isPremium = (tier: SubscriptionTier) => tier === 'premium' || tier === 'pro'
export const isPro = (tier: SubscriptionTier) => tier === 'pro'
