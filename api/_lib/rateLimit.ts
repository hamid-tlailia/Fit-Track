import type { IncomingMessage } from 'node:http'

import { sql } from './db.js'

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return value?.split(',')[0]?.trim() ?? 'unknown'
}

/**
 * DB-backed fixed-window rate limiter — serverless functions have no shared
 * memory between invocations, so an in-process counter would reset every
 * cold start and let limits be bypassed trivially.
 */
export async function checkRateLimit(bucketKey: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await sql`
    SELECT COUNT(*) AS count FROM rate_limit_hits
    WHERE bucket_key = ${bucketKey} AND created_at > now() - make_interval(secs => ${windowSeconds})
  `
  const count = Number((rows[0] as { count: string }).count)
  if (count >= limit) return false

  await sql`INSERT INTO rate_limit_hits (bucket_key) VALUES (${bucketKey})`
  return true
}
