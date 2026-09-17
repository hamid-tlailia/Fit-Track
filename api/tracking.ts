import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'
import type { CompletedWorkoutRow, FoodLogRow, PersonalRecordRow, WeightEntryRow } from './_lib/types.js'

const VALID_MEALS = new Set(['breakfast', 'lunch', 'dinner', 'snack'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method === 'DELETE') {
    const resource = req.query.resource
    const id = typeof req.query.id === 'string' ? req.query.id : undefined
    if (resource !== 'food-log' || !id) {
      return res.status(400).json({ error: 'resource=food-log and id are required' })
    }
    await sql`DELETE FROM food_log WHERE id = ${id} AND user_id = ${user.id}`
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { resource } = req.body ?? {}

  if (resource === 'weight') {
    const value = Number(req.body?.kg)
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: 'A valid weight in kg is required' })
    }
    const rows = await sql`
      INSERT INTO weight_entries (user_id, kg) VALUES (${user.id}, ${value}) RETURNING id, kg, logged_at
    `
    const row = rows[0] as WeightEntryRow
    return res.status(201).json({ entry: { id: row.id, kg: Number(row.kg), dateISO: row.logged_at } })
  }

  if (resource === 'food-log') {
    const { foodId, grams, meal } = req.body ?? {}
    const gramsValue = Number(grams)
    if (typeof foodId !== 'string' || !foodId || !Number.isFinite(gramsValue) || gramsValue <= 0) {
      return res.status(400).json({ error: 'foodId and a positive grams value are required' })
    }
    const mealValue = VALID_MEALS.has(meal) ? meal : 'snack'
    const rows = await sql`
      INSERT INTO food_log (user_id, food_id, grams, meal)
      VALUES (${user.id}, ${foodId}, ${gramsValue}, ${mealValue})
      RETURNING id, food_id, grams, meal, logged_at
    `
    const row = rows[0] as FoodLogRow
    return res.status(201).json({
      entry: { id: row.id, foodId: row.food_id, grams: Number(row.grams), meal: row.meal, loggedAt: row.logged_at },
    })
  }

  if (resource === 'water') {
    const value = Number(req.body?.ml)
    if (!Number.isFinite(value) || value === 0) {
      return res.status(400).json({ error: 'A non-zero ml delta is required' })
    }
    await sql`INSERT INTO water_log (user_id, ml) VALUES (${user.id}, ${Math.round(value)})`

    // `logged_at::date = now()::date` compares in the database's own
    // timezone (UTC on Neon), so "today" rolled over hours after anyone
    // east of UTC actually hit local midnight. The client sends its real
    // UTC offset (JS getTimezoneOffset() convention: minutes *behind* UTC)
    // so the boundary can be computed in the user's own local day instead.
    const tzOffsetMinutes = Number(req.body?.tzOffset) || 0
    const nowMs = Date.now()
    const localMs = nowMs - tzOffsetMinutes * 60_000
    const startOfDayMs = Math.floor(localMs / 86_400_000) * 86_400_000 + tzOffsetMinutes * 60_000
    const endOfDayMs = startOfDayMs + 86_400_000

    const rows = await sql`
      SELECT COALESCE(SUM(ml), 0) AS total FROM water_log
      WHERE user_id = ${user.id}
        AND logged_at >= ${new Date(startOfDayMs).toISOString()}
        AND logged_at < ${new Date(endOfDayMs).toISOString()}
    `
    return res.status(200).json({ totalMlToday: Number((rows[0] as { total: string }).total) })
  }

  if (resource === 'workout') {
    const { workoutId, durationMin, calories } = req.body ?? {}
    if (typeof workoutId !== 'string' || !workoutId) {
      return res.status(400).json({ error: 'workoutId is required' })
    }
    const rows = await sql`
      INSERT INTO completed_workouts (user_id, workout_id, duration_min, calories)
      VALUES (${user.id}, ${workoutId}, ${Number(durationMin) || 0}, ${Number(calories) || 0})
      RETURNING id, workout_id, duration_min, calories, completed_at
    `
    const row = rows[0] as CompletedWorkoutRow
    return res.status(201).json({
      entry: {
        id: row.id,
        workoutId: row.workout_id,
        durationMin: row.duration_min,
        calories: row.calories,
        dateISO: row.completed_at,
      },
    })
  }

  if (resource === 'personal-record') {
    const { exerciseNameEn, exerciseNameAr, value } = req.body ?? {}
    if (typeof exerciseNameEn !== 'string' || !exerciseNameEn.trim() || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'exerciseNameEn and value are required' })
    }
    const rows = await sql`
      INSERT INTO personal_records (user_id, exercise_name_en, exercise_name_ar, value)
      VALUES (${user.id}, ${exerciseNameEn.trim()}, ${(exerciseNameAr || exerciseNameEn).trim()}, ${value.trim()})
      RETURNING id, exercise_name_en, exercise_name_ar, value, logged_at
    `
    const row = rows[0] as PersonalRecordRow
    return res.status(201).json({
      record: {
        id: row.id,
        exerciseNameEn: row.exercise_name_en,
        exerciseNameAr: row.exercise_name_ar,
        value: row.value,
        dateISO: row.logged_at,
      },
    })
  }

  return res.status(400).json({ error: 'Unknown resource' })
}
