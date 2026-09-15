import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'
import type { UserRow } from './_lib/types.js'
import { serializeUser } from './_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const { weightKg, heightCm, age, goal, activityLevel } = req.body ?? {}

  const rows = await sql`
    UPDATE users SET
      weight_kg = COALESCE(${weightKg != null ? Number(weightKg) : null}, weight_kg),
      height_cm = COALESCE(${heightCm != null ? Number(heightCm) : null}, height_cm),
      age = COALESCE(${age != null ? Number(age) : null}, age),
      goal = COALESCE(${goal ?? null}, goal),
      activity_level = COALESCE(${activityLevel ?? null}, activity_level)
    WHERE id = ${user.id}
    RETURNING *
  `
  return res.status(200).json({ user: serializeUser(rows[0] as UserRow) })
}
