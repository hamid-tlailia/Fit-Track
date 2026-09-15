import { describe, expect, it } from 'vitest'

import {
  calculateBMR,
  calculateMacros,
  calculateTDEE,
  cmToFtIn,
  kgToLb,
  lbToKg,
} from './calculations'

describe('calculateBMR', () => {
  it('matches the Mifflin-St Jeor equation for a male', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR(80, 180, 30, 'male')).toBe(1780)
  })

  it('matches the Mifflin-St Jeor equation for a female', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(calculateBMR(60, 165, 25, 'female')).toBeCloseTo(1345.25)
  })

  it('is lower for a female than a male with identical stats (the +5/-161 offset)', () => {
    const male = calculateBMR(70, 170, 25, 'male')
    const female = calculateBMR(70, 170, 25, 'female')
    expect(male - female).toBe(166)
  })
})

describe('calculateTDEE', () => {
  it('scales BMR by the sedentary multiplier', () => {
    expect(calculateTDEE(1500, 'sedentary')).toBeCloseTo(1800)
  })

  it('scales BMR by the very active multiplier', () => {
    expect(calculateTDEE(1500, 'veryActive')).toBeCloseTo(2850)
  })

  it('increases monotonically with activity level', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active', 'veryActive'] as const
    const values = levels.map((level) => calculateTDEE(1500, level))
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })
})

describe('calculateMacros', () => {
  it('creates a calorie deficit for weight loss', () => {
    const macros = calculateMacros(2500, 'loseWeight')
    expect(macros.calories).toBe(2100)
  })

  it('creates a calorie surplus for building muscle', () => {
    const macros = calculateMacros(2500, 'buildMuscle')
    expect(macros.calories).toBe(2800)
  })

  it('keeps calories at maintenance for stayFit/endurance', () => {
    expect(calculateMacros(2500, 'stayFit').calories).toBe(2500)
    expect(calculateMacros(2500, 'endurance').calories).toBe(2500)
  })

  it('derives protein/carb/fat grams that reconstruct ~the target calories', () => {
    const macros = calculateMacros(2000, 'stayFit')
    const reconstructed = macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9
    expect(reconstructed).toBeCloseTo(2000, -1) // within ~10 kcal after rounding
  })
})

describe('unit conversions', () => {
  it('converts kg to lb and back within rounding tolerance', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462)
    expect(lbToKg(220.462)).toBeCloseTo(100, 2)
  })

  it('converts cm to feet/inches', () => {
    expect(cmToFtIn(180)).toEqual({ ft: 5, inch: 11 })
  })
})
