import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth'
import { ensureSchema, sql } from './_lib/db'
import type { FoodLogRow } from './_lib/types'

const VALID_MEALS = new Set(['breakfast', 'lunch', 'dinner', 'snack'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method === 'POST') {
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

  if (req.method === 'DELETE') {
    const id = typeof req.query.id === 'string' ? req.query.id : undefined
    if (!id) return res.status(400).json({ error: 'id is required' })
    await sql`DELETE FROM food_log WHERE id = ${id} AND user_id = ${user.id}`
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
