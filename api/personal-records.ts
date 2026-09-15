import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth'
import { ensureSchema, sql } from './_lib/db'
import type { PersonalRecordRow } from './_lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

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
