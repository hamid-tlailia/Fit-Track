import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from '../_lib/auth.js'
import { ensureSchema, sql } from '../_lib/db.js'
import type { CompletedWorkoutRow } from '../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

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
