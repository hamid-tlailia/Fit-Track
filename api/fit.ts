import { aggregateTotal, averageHeartRate, isMetricAuthFailure, isReauthRequired, type FitAggregate } from './_lib/fitData.js'
import { randomBytes } from 'node:crypto'

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseCookie, stringifySetCookie } from 'cookie'

import { getUserFromRequest } from './_lib/auth.js'
import { ensureSchema, sql } from './_lib/db.js'

const STATE_COOKIE = 'fitforge_fit_state'
const SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.location.read'
const AGGREGATE_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate'

interface FitTokenRow {
  access_token: string
  refresh_token: string
  expires_at: string
}

type AggregateSpec = { dataTypeName: string } | { dataSourceId: string }

/**
 * How a single metric ended up. `authDenied` means the token cannot read this
 * scope (the user rejected some of the granular consent checkboxes), `failed`
 * means a transport/server error — never present real numbers as zeroes when
 * a metric is merely unreadable.
 */
interface MetricResult {
  total: number | null
  authDenied: boolean
  failed: boolean
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

function authUrl(req: VercelRequest, clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
    // The consent screen shows one checkbox per non-Sign-In scope and leaves
    // the optional ones unchecked — tell Google this client can be granted
    // scopes incrementally instead of all-or-nothing.
    include_granted_scopes: 'true',
    enable_granular_consent: 'true',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
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
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string }
  if (!res.ok || !body.access_token) {
    const err = new Error(`Token refresh failed: ${res.status}`) as Error & { code?: string }
    err.code = body.error ?? `http_${res.status}`
    throw err
  }
  return { access_token: body.access_token, expires_in: Number(body.expires_in ?? 3600) }
}

/**
 * Try each aggregate spec in order. Aggregating by dataTypeName uses the
 * account's default source and returns an empty set when the user simply has
 * no readings; some accounts (mainly older ones) have no default source for a
 * type at all and the request errors instead — for those, fall back to the
 * well-known merged sources (e.g. `estimated_steps`, what the Fit app shows).
 */
async function metricTotal(
  accessToken: string,
  specs: AggregateSpec[],
  startOfDay: number,
  nowMs: number,
  pick: (data: FitAggregate) => number | null,
): Promise<MetricResult> {
  let authDenied = false
  for (const spec of specs) {
    let res: Response
    try {
      res = await fetch(AGGREGATE_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(8_000),
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [spec],
          bucketByTime: { durationMillis: 86_400_000 },
          startTimeMillis: startOfDay,
          endTimeMillis: nowMs,
        }),
      })
    } catch {
      return { total: null, authDenied, failed: true }
    }
    if (isMetricAuthFailure(res.status)) {
      authDenied = true
      continue
    }
    if (!res.ok) continue // e.g. 404 "datasource not found" → try the next spec
    const total = pick((await res.json()) as FitAggregate)
    if (total != null) return { total, authDenied, failed: false }
  }
  return { total: null, authDenied, failed: false }
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
      if (req.query.format === 'json') {
        return res.status(503).json({ error: 'Google Fit is not configured', code: 'not_configured' })
      }
      return res.redirect(302, settingsRedirect(req, 'fit=error&reason=not_configured'))
    }

    const state = randomBytes(16).toString('hex')
    const stateCookie = stringifySetCookie({
      name: STATE_COOKIE,
      value: state,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    })
    const url = authUrl(req, clientId, state)

    // The Settings UI fetches this endpoint and keeps a button spinner up
    // until it navigates — give it the URL instead of a redirect it can't follow.
    if (req.query.format === 'json') {
      res.setHeader('Set-Cookie', stateCookie)
      return res.status(200).json({ url })
    }

    res.setHeader('Set-Cookie', stateCookie)
    return res.redirect(302, url)
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
      const tokens = (await tokenRes.json().catch(() => ({}))) as {
        access_token?: string
        refresh_token?: string
        expires_in?: number
        error?: string
      }
      if (!tokenRes.ok || !tokens.access_token) throw new Error(tokens.error ?? `Token exchange failed: ${tokenRes.status}`)
      let refreshToken = tokens.refresh_token
      if (!refreshToken) {
        const existing = await sql`SELECT refresh_token FROM google_fit_tokens WHERE user_id = ${user.id}`
        refreshToken = (existing[0] as { refresh_token: string } | undefined)?.refresh_token
      }
      if (!refreshToken) return res.redirect(302, settingsRedirect(req, 'fit=error&reason=no_refresh_token'))
      const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()
      await sql`
        INSERT INTO google_fit_tokens (user_id, access_token, refresh_token, expires_at)
        VALUES (${user.id}, ${tokens.access_token}, ${refreshToken}, ${expiresAt})
        ON CONFLICT (user_id) DO UPDATE SET access_token = ${tokens.access_token}, refresh_token = ${refreshToken}, expires_at = ${expiresAt}
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
        const code = (err as { code?: string }).code ?? null
        console.error('Google Fit token refresh failed', code)
        if (isReauthRequired(code)) {
          // Revoked/expired grant — keeping dead tokens only leaves the UI
          // "connected" while nothing can ever sync. Clear and ask to reconnect.
          await sql`DELETE FROM google_fit_tokens WHERE user_id = ${user.id}`
          return res.status(200).json({ connected: false, status: 'reauth_required' })
        }
        return res.status(200).json({ connected: true, status: 'unavailable', steps: null, caloriesBurned: null, heartRate: null, distanceMeters: null })
      }
    }

    const offset = Number(req.query.tzOffset) || 0
    const tzOffsetMinutes = Number.isFinite(offset) ? Math.max(-840, Math.min(840, offset)) : 0
    const nowMs = Date.now()
    const localMs = nowMs - tzOffsetMinutes * 60_000
    const startOfDay = Math.floor(localMs / 86_400_000) * 86_400_000 + tzOffsetMinutes * 60_000

    // Each metric gets its own request and its own fallbacks. Google's
    // granular consent lets a user grant only some of the requested scopes,
    // and a single failing aggregateBy must not blank every other number.
    const [steps, calories, heart, distance] = await Promise.all([
      metricTotal(accessToken, [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps' },
      ], startOfDay, nowMs, (data) => aggregateTotal(data, 0)),
      metricTotal(accessToken, [{ dataTypeName: 'com.google.calories.expended' }], startOfDay, nowMs, (data) => aggregateTotal(data, 0)),
      metricTotal(accessToken, [{ dataTypeName: 'com.google.heart_rate.bpm' }], startOfDay, nowMs, (data) => averageHeartRate(data)),
      metricTotal(accessToken, [{ dataTypeName: 'com.google.distance.delta' }], startOfDay, nowMs, (data) => aggregateTotal(data, 0)),
    ])

    const results = [steps, calories, heart, distance]
    const anyDenied = results.some((m) => m.authDenied)
    const coreMissing = steps.total == null && calories.total == null
    const status = results.every((m) => m.failed)
      ? 'unavailable'
      : coreMissing && anyDenied
        ? 'permission_denied'
        : coreMissing && results.every((m) => !m.failed)
          ? 'no_data'
          : 'ok'

    return res.status(200).json({
      connected: true,
      status,
      steps: steps.total,
      caloriesBurned: calories.total == null ? null : Math.round(calories.total),
      heartRate: heart.total,
      distanceMeters: distance.total,
    })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
