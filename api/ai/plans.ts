import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from '../_lib/auth.js'
import { ensureSchema, sql } from '../_lib/db.js'
import { GeminiError, callGemini } from '../_lib/gemini.js'
import { checkRateLimit } from '../_lib/rateLimit.js'
import type { UserRow } from '../_lib/types.js'

const VALID_TYPES = new Set(['nutrition', 'training'])
const LANGUAGE_NAMES: Record<string, string> = { ar: 'Arabic', en: 'English' }

function buildPrompt(type: string, user: UserRow, language: string): { system: string; prompt: string } {
  const languageName = LANGUAGE_NAMES[language] ?? 'English'
  const profile = `goal=${user.goal}, gender=${user.gender}, weight=${user.weight_kg}kg, height=${user.height_cm}cm, age=${user.age}, activity level=${user.activity_level}`

  const system = `You are FitForge's AI plan generator, producing a personalized, structured plan for one user of this bilingual fitness app.
Write the ENTIRE response in ${languageName} — headings, labels, and all text, no mixing languages.
Use lightweight markdown only: "## " for section headings (one per day), "- " for bullet list items, "**text**" for bold emphasis on key numbers. No tables, no code blocks, no links.
Keep it realistic and practical for the user's stated profile. You are not a medical professional — do not diagnose, prescribe treatment, or recommend supplements/medication; if relevant, suggest consulting a doctor or qualified professional instead.`

  if (type === 'nutrition') {
    return {
      system,
      prompt: `Create a 7-day meal plan for this user: ${profile}.
For each day, use a "## Day N" heading, then list Breakfast/Lunch/Dinner/Snack as bullet items with a short food description and an approximate calorie count each. End with a short "## Notes" section (2-3 practical tips for this goal). Keep each day concise — no long paragraphs.`,
    }
  }

  return {
    system,
    prompt: `Create a weekly training program for this user: ${profile}.
Use a "## Day N" heading per training day (pick an appropriate number of training days and rest days for this activity level), listing exercises as bullet items with sets x reps (or duration for cardio/mobility work). End with a short "## Notes" section (2-3 practical tips, e.g. on progression or rest). Keep it concise and realistic for a home or gym setting — no long paragraphs.`,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (user.subscription_tier !== 'pro') {
    return res.status(403).json({ error: 'AI-generated plans require Pro', code: 'requires_pro' })
  }

  const type = req.method === 'GET' ? req.query.type : (req.body ?? {}).type
  if (typeof type !== 'string' || !VALID_TYPES.has(type)) {
    return res.status(400).json({ error: 'type must be "nutrition" or "training"' })
  }

  if (req.method === 'GET') {
    const language = req.query.language === 'ar' ? 'ar' : 'en'
    const rows = await sql`
      SELECT id, type, language, content, created_at AS "createdAt" FROM ai_plans
      WHERE user_id = ${user.id} AND type = ${type} AND language = ${language}
      ORDER BY created_at DESC LIMIT 1
    `
    return res.status(200).json({ plan: rows[0] ?? null })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const allowed = await checkRateLimit(`plans:${user.id}`, 5, 60 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many plan generations, try again in a bit', code: 'rate_limited' })
  }

  const language = (req.body ?? {}).language === 'ar' ? 'ar' : 'en'
  const { system, prompt } = buildPrompt(type, user, language)

  let content: string
  try {
    content = await callGemini(system, prompt)
  } catch (error) {
    if (error instanceof GeminiError) {
      const status = error.code === 'not_configured' ? 503 : 502
      return res.status(status).json({ error: error.message, code: `ai_${error.code}` })
    }
    throw error
  }

  const rows = await sql`
    INSERT INTO ai_plans (user_id, type, language, content)
    VALUES (${user.id}, ${type}, ${language}, ${content})
    RETURNING id, type, language, content, created_at AS "createdAt"
  `
  return res.status(201).json({ plan: rows[0] })
}
