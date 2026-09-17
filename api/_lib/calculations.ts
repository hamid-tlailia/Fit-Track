const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

/** Mirrors src/lib/calculations.ts, duplicated to avoid importing across the api/src boundary (different tsconfig, path aliases). */
export function estimateCalorieTarget(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string,
  goal: string,
): number {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161)
  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.375)
  if (goal === 'loseWeight') return Math.round(tdee - 400)
  if (goal === 'buildMuscle') return Math.round(tdee + 300)
  return Math.round(tdee)
}
