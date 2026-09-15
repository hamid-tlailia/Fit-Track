import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth'
import { ensureSchema, sql } from './_lib/db'
import type { WeightEntryRow } from './_lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const { kg } = req.body ?? {}
  const value = Number(kg)
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ error: 'A valid weight in kg is required' })
  }

  const rows = await sql`
    INSERT INTO weight_entries (user_id, kg) VALUES (${user.id}, ${value}) RETURNING id, kg, logged_at
  `
  const row = rows[0] as WeightEntryRow
  return res.status(201).json({ entry: { id: row.id, kg: Number(row.kg), dateISO: row.logged_at } })
}
