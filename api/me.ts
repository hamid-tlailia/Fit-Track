import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'
import type {
  CompletedWorkoutRow,
  FoodLogRow,
  PersonalRecordRow,
  UserRow,
  WeightEntryRow,
} from './_lib/types.js'
import { serializeUser } from './_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (req.query.export === '1') return handleExport(req, res, user)

  const [weightEntries, foodLog, waterRows, completedWorkouts, personalRecords] = await Promise.all([
    sql`SELECT id, kg, logged_at FROM weight_entries WHERE user_id = ${user.id} ORDER BY logged_at ASC`,
    sql`SELECT id, food_id, grams, meal, logged_at FROM food_log WHERE user_id = ${user.id} ORDER BY logged_at ASC`,
    sql`SELECT logged_at::date::text AS date, SUM(ml) AS ml FROM water_log WHERE user_id = ${user.id} GROUP BY logged_at::date`,
    sql`SELECT id, workout_id, duration_min, calories, completed_at FROM completed_workouts WHERE user_id = ${user.id} ORDER BY completed_at ASC`,
    sql`SELECT id, exercise_name_en, exercise_name_ar, value, logged_at FROM personal_records WHERE user_id = ${user.id} ORDER BY logged_at DESC`,
  ])

  const waterByDate: Record<string, number> = {}
  for (const row of waterRows as { date: string; ml: string }[]) {
    waterByDate[row.date] = Number(row.ml)
  }

  return res.status(200).json({
    user: serializeUser(user),
    weightEntries: (weightEntries as WeightEntryRow[]).map((row) => ({
      id: row.id,
      kg: Number(row.kg),
      dateISO: row.logged_at,
    })),
    foodLog: (foodLog as FoodLogRow[]).map((row) => ({
      id: row.id,
      foodId: row.food_id,
      grams: Number(row.grams),
      meal: row.meal,
      loggedAt: row.logged_at,
    })),
    waterByDate,
    completedWorkouts: (completedWorkouts as CompletedWorkoutRow[]).map((row) => ({
      id: row.id,
      workoutId: row.workout_id,
      durationMin: row.duration_min,
      calories: row.calories,
      dateISO: row.completed_at,
    })),
    personalRecords: (personalRecords as PersonalRecordRow[]).map((row) => ({
      id: row.id,
      exerciseNameEn: row.exercise_name_en,
      exerciseNameAr: row.exercise_name_ar,
      value: row.value,
      dateISO: row.logged_at,
    })),
  })
}

async function handleExport(req: VercelRequest, res: VercelResponse, user: UserRow) {
  if (user.subscription_tier !== 'pro') {
    return res.status(403).json({ error: 'Data export requires a Pro subscription', code: 'requires_pro' })
  }

  const [weightEntries, foodLog, waterLog, completedWorkouts, personalRecords, chatMessages] = await Promise.all([
    sql`SELECT kg, logged_at FROM weight_entries WHERE user_id = ${user.id} ORDER BY logged_at ASC`,
    sql`SELECT food_id, grams, meal, logged_at FROM food_log WHERE user_id = ${user.id} ORDER BY logged_at ASC`,
    sql`SELECT ml, logged_at FROM water_log WHERE user_id = ${user.id} ORDER BY logged_at ASC`,
    sql`SELECT workout_id, duration_min, calories, completed_at FROM completed_workouts WHERE user_id = ${user.id} ORDER BY completed_at ASC`,
    sql`SELECT exercise_name_en, exercise_name_ar, value, logged_at FROM personal_records WHERE user_id = ${user.id} ORDER BY logged_at ASC`,
    sql`SELECT role, content, created_at FROM chat_messages WHERE user_id = ${user.id} ORDER BY created_at ASC`,
  ])

  return res.status(200).json({
    exportedAt: new Date().toISOString(),
    profile: serializeUser(user),
    weightEntries,
    foodLog,
    waterLog,
    completedWorkouts,
    personalRecords,
    chatMessages,
  })
}
