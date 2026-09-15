import type { VercelRequest, VercelResponse } from '@vercel/node'

import { createSession, setSessionCookie, verifyPassword } from '../_lib/auth'
import { ensureSchema, sql } from '../_lib/db'
import type { UserRow } from '../_lib/types'
import { serializeUser } from '../_lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required', code: 'invalid_credentials' })
  }

  await ensureSchema()

  const normalizedEmail = email.trim().toLowerCase()
  const rows = await sql`SELECT * FROM users WHERE email = ${normalizedEmail}`
  const user = rows[0] as UserRow | undefined

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password', code: 'invalid_credentials' })
  }

  const token = await createSession(user.id)
  setSessionCookie(res, token)
  return res.status(200).json({ user: serializeUser(user) })
}
