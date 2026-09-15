import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'energy' | 'warrior' | 'calm' | 'neon'
export type VoiceGender = 'male' | 'female'
export type Units = 'metric' | 'imperial'
export type SubscriptionTier = 'free' | 'premium' | 'pro'
export type Goal = 'loseWeight' | 'buildMuscle' | 'stayFit' | 'endurance'
export type Gender = 'male' | 'female'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive'

export interface AppUser {
  name: string
  email: string
  gender: Gender
  goal: Goal
  weightKg: number
  heightCm: number
  age: number
  activityLevel: ActivityLevel
}

export interface Subscription {
  tier: SubscriptionTier
  renewsAt: string | null
}

interface AppState {
  onboardingComplete: boolean
  user: AppUser | null
  theme: ThemeId
  voiceGender: VoiceGender
  voiceEnabled: boolean
  units: Units
  subscription: Subscription

  completeOnboarding: (user: AppUser) => void
  updateProfile: (patch: Partial<AppUser>) => void
  setTheme: (theme: ThemeId) => void
  setVoiceGender: (gender: VoiceGender) => void
  setVoiceEnabled: (enabled: boolean) => void
  setUnits: (units: Units) => void
  setSubscription: (tier: SubscriptionTier) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      user: null,
      theme: 'energy',
      voiceGender: 'female',
      voiceEnabled: true,
      units: 'metric',
      subscription: { tier: 'free', renewsAt: null },

      completeOnboarding: (user) =>
        set({ onboardingComplete: true, user, voiceGender: user.gender }),
      updateProfile: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
      setTheme: (theme) => set({ theme }),
      setVoiceGender: (voiceGender) => set({ voiceGender }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setUnits: (units) => set({ units }),
      setSubscription: (tier) =>
        set({
          subscription: {
            tier,
            renewsAt:
              tier === 'free'
                ? null
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }),
      logout: () =>
        set({ onboardingComplete: false, user: null, subscription: { tier: 'free', renewsAt: null } }),
    }),
    { name: 'fit-track-app-store' },
  ),
)

export const isPremium = (tier: SubscriptionTier) => tier === 'premium' || tier === 'pro'
export const isPro = (tier: SubscriptionTier) => tier === 'pro'
