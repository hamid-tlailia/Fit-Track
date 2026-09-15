import type { VercelRequest, VercelResponse } from '@vercel/node'

import { clearSessionCookie, getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  // All per-user tables reference users(id) with ON DELETE CASCADE.
  await sql`DELETE FROM users WHERE id = ${user.id}`
  clearSessionCookie(res)
  return res.status(200).json({ ok: true })
}
