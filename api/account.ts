import type { VercelRequest, VercelResponse } from '@vercel/node'

import { clearSessionCookie, getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'
import type { UserRow } from './_lib/types.js'
import { serializeUser } from './_lib/types.js'

const VALID_TIERS = new Set(['free', 'premium', 'pro'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method === 'PATCH') {
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

  if (req.method === 'POST') {
    const { tier } = req.body ?? {}
    if (typeof tier !== 'string' || !VALID_TIERS.has(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' })
    }
    // Demo-mode upgrade: no payment is processed. A real integration would
    // verify a payment provider webhook/checkout session before writing this.
    const rows = await sql`UPDATE users SET subscription_tier = ${tier} WHERE id = ${user.id} RETURNING *`
    return res.status(200).json({ user: serializeUser(rows[0] as UserRow) })
  }

  if (req.method === 'DELETE') {
    // All per-user tables reference users(id) with ON DELETE CASCADE.
    await sql`DELETE FROM users WHERE id = ${user.id}`
    clearSessionCookie(res)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
