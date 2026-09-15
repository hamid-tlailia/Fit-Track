import type { VercelRequest, VercelResponse } from '@vercel/node'

import { createSession, hashPassword, setSessionCookie } from '../_lib/auth.js'
import { ensureSchema, sql } from '../_lib/db.js'
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.js'
import type { UserRow } from '../_lib/types.js'
import { serializeUser } from '../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const allowed = await checkRateLimit(`register:${getClientIp(req)}`, 8, 15 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many registration attempts, try again later', code: 'rate_limited' })
  }

  const { name, email, password, gender, goal, weightKg, heightCm, age, activityLevel } = req.body ?? {}

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required', code: 'invalid_name' })
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required', code: 'invalid_email' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters', code: 'weak_password' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists', code: 'email_taken' })
  }

  const passwordHash = await hashPassword(password)
  const rows = await sql`
    INSERT INTO users (name, email, password_hash, gender, goal, weight_kg, height_cm, age, activity_level)
    VALUES (
      ${name.trim()}, ${normalizedEmail}, ${passwordHash},
      ${gender === 'female' ? 'female' : 'male'},
      ${goal ?? 'stayFit'},
      ${Number(weightKg) || 70},
      ${Number(heightCm) || 170},
      ${Number(age) || 25},
      ${activityLevel ?? 'moderate'}
    )
    RETURNING *
  `
  const user = rows[0] as UserRow
  const token = await createSession(user.id)
  setSessionCookie(res, token)
  return res.status(201).json({ user: serializeUser(user) })
}
