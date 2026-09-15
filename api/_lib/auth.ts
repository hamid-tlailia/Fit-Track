import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

import bcrypt from 'bcryptjs'
import { parseCookie, stringifySetCookie } from 'cookie'

import { ensureSchema, sql } from './db.js'
import type { UserRow } from './types.js'

const COOKIE_NAME = 'fitforge_session'
const SESSION_DAYS = 30

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt.toISOString()})`
  return token
}

export function setSessionCookie(res: ServerResponse, token: string): void {
  res.setHeader(
    'Set-Cookie',
    stringifySetCookie({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    }),
  )
}

export function clearSessionCookie(res: ServerResponse): void {
  res.setHeader(
    'Set-Cookie',
    stringifySetCookie({
      name: COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }),
  )
}

export async function getSessionToken(req: IncomingMessage): Promise<string | null> {
  const cookies = parseCookie(req.headers.cookie ?? '')
  return cookies[COOKIE_NAME] ?? null
}

export async function getUserFromRequest(req: IncomingMessage): Promise<UserRow | null> {
  const token = await getSessionToken(req)
  if (!token) return null
  await ensureSchema()
  const rows = await sql`
    SELECT u.* FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
  `
  return (rows[0] as UserRow | undefined) ?? null
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`
}
