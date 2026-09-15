import type { VercelRequest, VercelResponse } from '@vercel/node'

import { clearSessionCookie, deleteSession, getSessionToken } from '../_lib/auth'
import { ensureSchema } from '../_lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = await getSessionToken(req)
  if (token) {
    await ensureSchema()
    await deleteSession(token)
  }
  clearSessionCookie(res)
  return res.status(200).json({ ok: true })
}
