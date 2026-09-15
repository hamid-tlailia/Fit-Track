export interface UserRow {
  id: string
  name: string
  email: string
  password_hash: string
  gender: string
  goal: string
  weight_kg: number
  height_cm: number
  age: number
  activity_level: string
  subscription_tier: string
  created_at: string
}

export interface WeightEntryRow {
  id: string
  kg: number
  logged_at: string
}

export interface FoodLogRow {
  id: string
  food_id: string
  grams: number
  meal: string
  logged_at: string
}

export interface CompletedWorkoutRow {
  id: string
  workout_id: string
  duration_min: number
  calories: number
  completed_at: string
}

export interface PersonalRecordRow {
  id: string
  exercise_name_en: string
  exercise_name_ar: string
  value: string
  logged_at: string
}

export function serializeUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    gender: row.gender,
    goal: row.goal,
    weightKg: Number(row.weight_kg),
    heightCm: Number(row.height_cm),
    age: row.age,
    activityLevel: row.activity_level,
    subscriptionTier: row.subscription_tier,
  }
}
