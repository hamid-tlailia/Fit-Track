import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const { ml } = req.body ?? {}
  const value = Number(ml)
  if (!Number.isFinite(value) || value === 0) {
    return res.status(400).json({ error: 'A non-zero ml delta is required' })
  }

  await sql`INSERT INTO water_log (user_id, ml) VALUES (${user.id}, ${Math.round(value)})`
  const rows = await sql`
    SELECT COALESCE(SUM(ml), 0) AS total FROM water_log
    WHERE user_id = ${user.id} AND logged_at::date = now()::date
  `
  return res.status(200).json({ totalMlToday: Number((rows[0] as { total: string }).total) })
}
