import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionToken,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'
import type { UserRow } from './_lib/types.js'
import { serializeUser } from './_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  await ensureSchema()
  const { action } = req.body ?? {}

  if (action === 'register') return handleRegister(req, res)
  if (action === 'login') return handleLogin(req, res)
  if (action === 'logout') return handleLogout(req, res)
  return res.status(400).json({ error: 'Unknown action' })
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
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

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const allowed = await checkRateLimit(`login:${getClientIp(req)}`, 15, 15 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many login attempts, try again later', code: 'rate_limited' })
  }

  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required', code: 'invalid_credentials' })
  }

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

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  const token = await getSessionToken(req)
  if (token) await deleteSession(token)
  clearSessionCookie(res)
  return res.status(200).json({ ok: true })
}
