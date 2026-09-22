import { aggregateTotal, averageHeartRate, type FitAggregate } from './_lib/fitData.js'
import { randomBytes } from 'node:crypto'

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseCookie, stringifySetCookie } from 'cookie'

import { getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'

const STATE_COOKIE = 'fitforge_fit_state'
const SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.location.read'

interface FitTokenRow {
  access_token: string
  refresh_token: string
  expires_at: string
}

function redirectUri(req: VercelRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'https'
  const host = req.headers.host
  return `${proto}://${host}/api/fit?action=callback`
}

function settingsRedirect(req: VercelRequest, query: string): string {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'https'
  return `${proto}://${req.headers.host}/settings?${query}`
}

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return (await res.json()) as { access_token: string; expires_in: number }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const action = req.query.action

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (action === 'authorize') {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Not authenticated' })
    if (user.subscription_tier !== 'pro') {
      return res.status(403).json({ error: 'Connecting Google Fit requires Pro', code: 'requires_pro' })
    }
    if (!clientId) {
      return res.redirect(302, settingsRedirect(req, 'fit=error&reason=not_configured'))
    }

    const state = randomBytes(16).toString('hex')
    res.setHeader(
      'Set-Cookie',
      stringifySetCookie({
        name: STATE_COOKIE,
        value: state,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 600,
      }),
    )

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(req),
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  }

  if (action === 'callback') {
    const user = await getUserFromRequest(req)
    if (!user) return res.redirect(302, settingsRedirect(req, 'fit=error&reason=session_expired'))

    const cookies = parseCookie(req.headers.cookie ?? '')
    const expectedState = cookies[STATE_COOKIE]
    const { code, state, error } = req.query
    if (error) return res.redirect(302, settingsRedirect(req, 'fit=error&reason=denied'))
    if (!code || typeof code !== 'string' || !state || state !== expectedState) {
      return res.redirect(302, settingsRedirect(req, 'fit=error&reason=invalid_state'))
    }
    if (!clientId || !clientSecret) {
      return res.redirect(302, settingsRedirect(req, 'fit=error&reason=not_configured'))
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri(req),
        }),
      })
      if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)
      const tokens = (await tokenRes.json()) as { access_token: string; refresh_token?: string; expires_in: number }
      if (!tokens.refresh_token) {
        const existing = await sql`SELECT refresh_token FROM google_fit_tokens WHERE user_id = ${user.id}`
        const existingToken = (existing[0] as { refresh_token: string } | undefined)?.refresh_token
        if (!existingToken) return res.redirect(302, settingsRedirect(req, 'fit=error&reason=no_refresh_token'))
        tokens.refresh_token = existingToken
      }
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      await sql`
        INSERT INTO google_fit_tokens (user_id, access_token, refresh_token, expires_at)
        VALUES (${user.id}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt})
        ON CONFLICT (user_id) DO UPDATE SET access_token = ${tokens.access_token}, refresh_token = ${tokens.refresh_token}, expires_at = ${expiresAt}
      `
    } catch (err) {
      console.error('Google Fit token exchange failed', err)
      return res.redirect(302, settingsRedirect(req, 'fit=error&reason=exchange_failed'))
    }

    return res.redirect(302, settingsRedirect(req, 'fit=connected'))
  }

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (action === 'disconnect' && req.method === 'DELETE') {
    await sql`DELETE FROM google_fit_tokens WHERE user_id = ${user.id}`
    return res.status(200).json({ ok: true })
  }

  if ((action === 'steps' || action === 'data') && req.method === 'GET') {
    const rows = await sql`SELECT access_token, refresh_token, expires_at FROM google_fit_tokens WHERE user_id = ${user.id}`
    const row = rows[0] as FitTokenRow | undefined
    if (!row) return res.status(200).json({ connected: false })
    if (!clientId || !clientSecret) return res.status(200).json({ connected: false })

    let accessToken = row.access_token
    if (new Date(row.expires_at).getTime() < Date.now() + 60_000) {
      try {
        const refreshed = await refreshAccessToken(clientId, clientSecret, row.refresh_token)
        accessToken = refreshed.access_token
        const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        await sql`UPDATE google_fit_tokens SET access_token = ${accessToken}, expires_at = ${expiresAt} WHERE user_id = ${user.id}`
      } catch (err) {
        console.error('Google Fit token refresh failed', err)
        return res.status(200).json({ connected: true, steps: null, caloriesBurned: null, error: 'refresh_failed' })
      }
    }

    const offset = Number(req.query.tzOffset) || 0
    const tzOffsetMinutes = Number.isFinite(offset) ? Math.max(-840, Math.min(840, offset)) : 0
    const nowMs = Date.now()
    const localMs = nowMs - tzOffsetMinutes * 60_000
    const startOfDay = Math.floor(localMs / 86_400_000) * 86_400_000 + tzOffsetMinutes * 60_000
    try {
      const aggRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.calories.expended' },
          ],
          bucketByTime: { durationMillis: 86_400_000 },
          startTimeMillis: startOfDay,
          endTimeMillis: nowMs,
        }),
      })
      if (!aggRes.ok) throw new Error(`Fitness API error: ${aggRes.status}`)
      const data = await aggRes.json() as FitAggregate
      const steps = aggregateTotal(data, 0)
      const calories = aggregateTotal(data, 1)
      // Optional scopes must not break steps/calories for existing connections.
      async function optionalMetric(type: string): Promise<FitAggregate | null> {
        try {
          const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
            method: 'POST', signal: AbortSignal.timeout(8_000),
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ aggregateBy: [{ dataTypeName: type }], bucketByTime: { durationMillis: 86_400_000 }, startTimeMillis: startOfDay, endTimeMillis: nowMs }),
          })
          return response.ok ? await response.json() as FitAggregate : null
        } catch { return null }
      }
      const [heart, distance] = await Promise.all([optionalMetric('com.google.heart_rate.bpm'), optionalMetric('com.google.distance.delta')])
      return res.status(200).json({
        connected: true, steps, caloriesBurned: calories == null ? null : Math.round(calories),
        heartRate: heart ? averageHeartRate(heart) : null,
        distanceMeters: distance ? aggregateTotal(distance, 0) : null,
      })
    } catch (err) {
      console.error('Google Fit aggregate fetch failed', err)
      return res.status(200).json({ connected: true, steps: null, caloriesBurned: null, error: 'fetch_failed' })
    }
  }

  return res.status(400).json({ error: 'Unknown action' })
}
