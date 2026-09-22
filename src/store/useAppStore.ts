import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'energy' | 'warrior' | 'calm' | 'neon'
export type ColorMode = 'light' | 'dark' | 'system'
export type VoiceGender = 'male' | 'female'
export type Units = 'metric' | 'imperial'
export type SubscriptionTier = 'free' | 'premium' | 'pro'
export type Goal = 'loseWeight' | 'buildMuscle' | 'stayFit' | 'endurance'
export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive'

/**
 * Device-local preferences only. Account data (profile, subscription,
 * workout/nutrition history) lives server-side — see useAuthStore and
 * useTrackerStore, which are hydrated from the API instead of localStorage.
 */
interface AppState {
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
  theme: ThemeId
  voiceGender: VoiceGender
  voiceEnabled: boolean
  units: Units

  setTheme: (theme: ThemeId) => void
  setVoiceGender: (gender: VoiceGender) => void
  setVoiceEnabled: (enabled: boolean) => void
  setUnits: (units: Units) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'energy',
      colorMode: 'system',
      setColorMode: (colorMode) => set({ colorMode }),
      voiceGender: 'female',
      voiceEnabled: true,
      units: 'metric',

      setTheme: (theme) => set({ theme }),
      setVoiceGender: (voiceGender) => set({ voiceGender }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setUnits: (units) => set({ units }),
    }),
    { name: 'fit-track-app-store' },
  ),
)
