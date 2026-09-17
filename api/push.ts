import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from './_lib/auth.js'
import { estimateCalorieTarget } from './_lib/calculations.js'
import { ensureSchema, sql } from './_lib/db.js'
import { callGemini } from './_lib/gemini.js'
import { sendPush } from './_lib/push.js'
import type { UserRow } from './_lib/types.js'

interface SubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  language: string
}

async function buildReminder(user: UserRow, language: string): Promise<{ title: string; body: string }> {
  const languageName = language === 'ar' ? 'Arabic' : 'English'

  const [waterRows, calorieRows, lastWorkoutRows] = await Promise.all([
    sql`SELECT COALESCE(SUM(ml), 0) AS total FROM water_log WHERE user_id = ${user.id} AND logged_at::date = now()::date`,
    sql`
      SELECT COALESCE(SUM(fl.grams), 0) AS grams, COUNT(*) AS entries FROM food_log fl
      WHERE fl.user_id = ${user.id} AND fl.logged_at::date = now()::date
    `,
    sql`SELECT completed_at FROM completed_workouts WHERE user_id = ${user.id} ORDER BY completed_at DESC LIMIT 1`,
  ])

  const waterMl = Number((waterRows[0] as { total: string }).total)
  const foodEntriesToday = Number((calorieRows[0] as { entries: string }).entries)
  const lastWorkout = (lastWorkoutRows[0] as { completed_at: string } | undefined)?.completed_at
  const daysSinceWorkout = lastWorkout ? Math.floor((Date.now() - new Date(lastWorkout).getTime()) / 86_400_000) : null

  const calorieTarget = estimateCalorieTarget(
    user.weight_kg,
    user.height_cm,
    user.age,
    user.gender,
    user.activity_level,
    user.goal,
  )

  const system = `You write ONE short daily push notification for a fitness app user, entirely in ${languageName}.
Return exactly two lines, nothing else:
Line 1: a short punchy title (max 6 words).
Line 2: one encouraging sentence (max 20 words) that references the single most relevant fact below — whichever gap or win matters most today. Be warm and motivating, never guilt-tripping or alarmist. Do not use emoji.`

  const prompt = `User profile: goal=${user.goal}, activity level=${user.activity_level}.
Today so far: water logged = ${waterMl}ml, food entries logged = ${foodEntriesToday}, daily calorie target = ${calorieTarget} kcal.
Days since last completed workout: ${daysSinceWorkout === null ? 'never logged one yet' : daysSinceWorkout}.`

  try {
    const text = await callGemini(system, prompt)
    const [title, ...rest] = text.trim().split('\n').filter(Boolean)
    return { title: title || 'FitForge', body: rest.join(' ').trim() || text.trim() }
  } catch {
    return language === 'ar'
      ? { title: 'وقت التحقق من تقدمك', body: 'افتح FitForge وتابع أهدافك اليوم — كل خطوة صغيرة تُحسب.' }
      : { title: 'Time to check in', body: "Open FitForge and log today's progress — every small step counts." }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const action = req.query.action

  if (action === 'vapid-public-key') {
    const publicKey = process.env.VAPID_PUBLIC_KEY
    if (!publicKey) return res.status(503).json({ error: 'Push notifications are not configured', code: 'push_not_configured' })
    return res.status(200).json({ publicKey })
  }

  if (action === 'cron') {
    const secret = process.env.CRON_SECRET
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = (await sql`
      SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth, ps.language, u.*
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps.user_id
    `) as (SubscriptionRow & UserRow)[]

    // One subscription row can exist per browser/device, so the same user
    // could otherwise get the same reminder generated (and stored) more than
    // once a day — build and store it once per user, then push to each of
    // their devices.
    const seenUsers = new Set<string>()
    let sent = 0
    let removed = 0
    for (const row of rows) {
      const reminder = await buildReminder(row, row.language === 'ar' ? 'ar' : 'en')
      if (!seenUsers.has(row.user_id)) {
        seenUsers.add(row.user_id)
        await sql`INSERT INTO notifications (user_id, title, body) VALUES (${row.user_id}, ${reminder.title}, ${reminder.body})`
      }
      const result = await sendPush(
        { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
        reminder,
      )
      if (result === 'sent') sent += 1
      if (result === 'gone') {
        removed += 1
        await sql`DELETE FROM push_subscriptions WHERE id = ${row.id}`
      }
    }
    return res.status(200).json({ processed: rows.length, sent, removed })
  }

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (action === 'subscribe' && req.method === 'POST') {
    const { endpoint, keys, language } = req.body ?? {}
    if (typeof endpoint !== 'string' || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'A valid push subscription is required' })
    }
    const lang = language === 'ar' ? 'ar' : 'en'
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, language)
      VALUES (${user.id}, ${endpoint}, ${keys.p256dh}, ${keys.auth}, ${lang})
      ON CONFLICT (endpoint) DO UPDATE SET user_id = ${user.id}, p256dh = ${keys.p256dh}, auth = ${keys.auth}, language = ${lang}
    `
    return res.status(201).json({ ok: true })
  }

  if (action === 'unsubscribe' && req.method === 'DELETE') {
    const endpoint = req.query.endpoint
    if (typeof endpoint !== 'string' || !endpoint) {
      return res.status(400).json({ error: 'endpoint is required' })
    }
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND user_id = ${user.id}`
    return res.status(200).json({ ok: true })
  }

  if (action === 'status' && req.method === 'GET') {
    const rows = await sql`SELECT 1 FROM push_subscriptions WHERE user_id = ${user.id} LIMIT 1`
    return res.status(200).json({ subscribed: rows.length > 0 })
  }

  if (action === 'list' && req.method === 'GET') {
    const rows = (await sql`
      SELECT id, title, body, read_at, created_at FROM notifications
      WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 50
    `) as { id: string; title: string; body: string; read_at: string | null; created_at: string }[]
    return res.status(200).json({
      notifications: rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        read: row.read_at !== null,
        createdAt: row.created_at,
      })),
      unreadCount: rows.filter((row) => row.read_at === null).length,
    })
  }

  if (action === 'mark-read' && req.method === 'POST') {
    await sql`UPDATE notifications SET read_at = now() WHERE user_id = ${user.id} AND read_at IS NULL`
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
