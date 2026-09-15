import type { ActivityLevel, Gender } from '@/store/useAppStore'

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

export const activityLevels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'veryActive']

/** Mifflin-St Jeor equation — weight/height in metric (kg, cm). */
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * activityMultipliers[activity]
}

export interface MacroTargets {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export function calculateMacros(tdee: number, goal: 'loseWeight' | 'buildMuscle' | 'stayFit' | 'endurance'): MacroTargets {
  let calories = tdee
  let proteinRatio = 0.3
  let fatRatio = 0.3

  if (goal === 'loseWeight') {
    calories = tdee - 400
    proteinRatio = 0.35
    fatRatio = 0.28
  } else if (goal === 'buildMuscle') {
    calories = tdee + 300
    proteinRatio = 0.32
    fatRatio = 0.25
  } else if (goal === 'endurance') {
    proteinRatio = 0.25
    fatRatio = 0.25
  }

  const carbRatio = 1 - proteinRatio - fatRatio
  return {
    calories: Math.round(calories),
    proteinG: Math.round((calories * proteinRatio) / 4),
    carbsG: Math.round((calories * carbRatio) / 4),
    fatG: Math.round((calories * fatRatio) / 9),
  }
}

export function kgToLb(kg: number): number {
  return kg * 2.20462
}

export function lbToKg(lb: number): number {
  return lb / 2.20462
}

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalInches = cm / 2.54
  const ft = Math.floor(totalInches / 12)
  const inch = Math.round(totalInches % 12)
  return { ft, inch }
}
