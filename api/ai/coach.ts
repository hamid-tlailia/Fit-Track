import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from '../_lib/auth.js'
import { ensureSchema, sql } from '../_lib/db.js'
import { checkRateLimit } from '../_lib/rateLimit.js'
import type { UserRow } from '../_lib/types.js'

const HISTORY_LIMIT = 20

function buildSystemPrompt(user: UserRow): string {
  return `You are the in-app AI fitness coach for FitForge, a bilingual (Arabic/English) fitness tracking app.
Always reply in the same language the user writes in (Arabic or English) — match their language exactly.
The user's profile: goal=${user.goal}, gender=${user.gender}, weight=${user.weight_kg}kg, height=${user.height_cm}cm, age=${user.age}, activity level=${user.activity_level}.
Give concise, practical, encouraging fitness and nutrition guidance tailored to this profile.
You are not a medical professional. For injury, pain, or any medical condition, tell the user to consult a doctor or qualified professional instead of diagnosing or prescribing treatment.
Keep replies focused and conversational, generally under 150 words unless the user explicitly asks for more detail.`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (user.subscription_tier === 'free') {
    return res.status(403).json({ error: 'AI coach chat requires Premium or Pro', code: 'requires_premium' })
  }

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT role, content, created_at AS "createdAt" FROM chat_messages
      WHERE user_id = ${user.id} ORDER BY created_at ASC LIMIT ${HISTORY_LIMIT}
    `
    return res.status(200).json({ messages: rows })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const allowed = await checkRateLimit(`coach:${user.id}`, 20, 60 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many messages, try again in a bit', code: 'rate_limited' })
  }

  const { message } = req.body ?? {}
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'The AI coach is not configured yet — an ANTHROPIC_API_KEY is missing from this deployment.',
      code: 'ai_not_configured',
    })
  }

  const historyRows = (await sql`
    SELECT role, content FROM chat_messages
    WHERE user_id = ${user.id} ORDER BY created_at ASC LIMIT ${HISTORY_LIMIT}
  `) as { role: string; content: string }[]

  const client = new Anthropic({ apiKey })
  const trimmedMessage = message.trim()

  let response
  try {
    response = await client.beta.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system: buildSystemPrompt(user),
      output_config: { effort: 'low' },
      // Opus 5's safety classifiers can decline a benign request; route declines
      // to Anthropic's recommended fallback model instead of surfacing a refusal.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        ...historyRows.map((row) => ({
          role: row.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: row.content,
        })),
        { role: 'user' as const, content: trimmedMessage },
      ],
    })
  } catch (error) {
    console.error('Anthropic API error', error)
    return res.status(502).json({ error: 'The AI coach is temporarily unavailable', code: 'ai_unavailable' })
  }

  if (response.stop_reason === 'refusal') {
    return res.status(200).json({
      reply: { role: 'assistant', content: "I can't help with that particular request — let's talk fitness or nutrition instead." },
    })
  }

  const replyText =
    response.content.find((block) => block.type === 'text')?.text ??
    "Sorry, I couldn't come up with a response just now — try again?"

  await sql`INSERT INTO chat_messages (user_id, role, content) VALUES (${user.id}, 'user', ${trimmedMessage})`
  const savedRows = await sql`
    INSERT INTO chat_messages (user_id, role, content) VALUES (${user.id}, 'assistant', ${replyText})
    RETURNING role, content, created_at AS "createdAt"
  `

  return res.status(200).json({ reply: savedRows[0] })
}
