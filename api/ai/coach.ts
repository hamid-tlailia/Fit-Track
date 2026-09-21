import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getUserFromRequest } from '../_lib/auth.js'
import { ensureSchema, sql } from '../_lib/db.js'
import { checkRateLimit } from '../_lib/rateLimit.js'
import type { UserRow } from '../_lib/types.js'

const HISTORY_LIMIT = 20
const GEMINI_MODEL = 'gemini-3.6-flash'
const TITLE_MAX_LENGTH = 60

function buildSystemPrompt(user: UserRow): string {
  return `You are the in-app AI fitness coach for FitForge, a bilingual (Arabic/English) fitness tracking app.
Always reply in the same language the user writes in (Arabic or English) — match their language exactly.
The user's profile: goal=${user.goal}, gender=${user.gender}, weight=${user.weight_kg}kg, height=${user.height_cm}cm, age=${user.age}, activity level=${user.activity_level}.
Give concise, practical, encouraging fitness and nutrition guidance tailored to this profile.
You are not a medical professional. For injury, pain, or any medical condition, tell the user to consult a doctor or qualified professional instead of diagnosing or prescribing treatment.
Keep replies focused and conversational, generally under 150 words unless the user explicitly asks for more detail.
Format with plain markdown when it helps (short paragraphs, "- " bullet lists, **bold** for key terms) — the app renders it.

You know FitForge's real structure — when a user asks how to do something in the app, describe these exact screens and flows, never invent a feature, tab, or field that isn't listed here:
- Home: today's activity (calories/water/streak, plus real step count if Google Fit is connected), a suggested workout, weight trend and calorie-goal progress.
- Workouts: a library of pre-built programs, filterable by category (Strength, HIIT, Cardio, Mobility) and level. Each workout has a fixed exercise list — there's no custom/manual workout builder for these. Opening one shows its exercises; tapping "Start workout" launches a guided player with a set/rep timer and rest cues. Finishing it automatically logs the duration, calories, and streak — nothing is entered by hand. This page also has an "AI Training Plan" card (Pro) that generates a full personalized weekly program and can be downloaded as a PDF.
- Nutrition: log food under a meal (Breakfast/Lunch/Dinner/Snack) by picking an item from the built-in food database (grouped by category: protein, carbs, fruit, vegetable, dairy, fat, legumes, mixed dishes) and entering grams. Also has a one-tap "add water" button and an "AI Nutrition Plan" card (Pro) that generates a personalized 7-day meal plan, downloadable as a PDF.
- Progress: a weight-log chart (manual entries), a 7-day calories-burned chart from completed workouts, and personal records (exercise name + value, e.g. "Bench press: 80kg x 5").
- AI Coach: this chat (Premium/Pro only).
- AI Form Check: camera-based rep counting and basic form feedback for squats and push-ups, using on-device pose detection (Premium/Pro only, beta, not a substitute for a real coach).
- Premium: shows the Free/Premium/Pro plans and their features.
- Settings: language, one of 4 motivational workout themes, voice-coach on/off and voice gender, metric/imperial units, a Google Fit connection for real step counts (Pro), data export (Pro), account deletion.
- Profile: edit weight, height, age, goal, and activity level (used to calculate calorie/macro targets).
AI-generated nutrition/training plans and Google Fit are written entirely in the language the plan was generated in / the user's chosen app language, in the same style as the rest of the app.`
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
    finishReason?: string
  }[]
  promptFeedback?: { blockReason?: string }
}

interface ConversationRow {
  id: string
  title: string
  updated_at: string
}

function titleFromMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ')
  return trimmed.length > TITLE_MAX_LENGTH ? `${trimmed.slice(0, TITLE_MAX_LENGTH - 1)}…` : trimmed
}

async function requireOwnedConversation(userId: string, conversationId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM conversations WHERE id = ${conversationId} AND user_id = ${userId}`
  return rows.length > 0
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (user.subscription_tier === 'free') {
    return res.status(403).json({ error: 'AI coach chat requires Premium or Pro', code: 'requires_premium' })
  }

  const action = req.query.action

  if (action === 'conversations' && req.method === 'GET') {
    const rows = (await sql`
      SELECT id, title, updated_at AS "updatedAt" FROM conversations
      WHERE user_id = ${user.id} ORDER BY updated_at DESC LIMIT 50
    `) as ConversationRow[]
    return res.status(200).json({ conversations: rows })
  }

  if (action === 'new' && req.method === 'POST') {
    const rows = await sql`
      INSERT INTO conversations (user_id, title) VALUES (${user.id}, 'New chat')
      RETURNING id, title, updated_at AS "updatedAt"
    `
    return res.status(201).json({ conversation: rows[0] })
  }

  if (action === 'rename' && req.method === 'PATCH') {
    const { conversationId, title } = req.body ?? {}
    if (typeof conversationId !== 'string' || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'conversationId and a non-empty title are required' })
    }
    if (!(await requireOwnedConversation(user.id, conversationId))) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    const rows = await sql`
      UPDATE conversations SET title = ${title.trim().slice(0, TITLE_MAX_LENGTH)}
      WHERE id = ${conversationId} RETURNING id, title, updated_at AS "updatedAt"
    `
    return res.status(200).json({ conversation: rows[0] })
  }

  if (req.method === 'DELETE') {
    const conversationId = req.query.conversationId
    if (typeof conversationId !== 'string' || !conversationId) {
      return res.status(400).json({ error: 'conversationId is required' })
    }
    if (!(await requireOwnedConversation(user.id, conversationId))) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    await sql`DELETE FROM conversations WHERE id = ${conversationId}`
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'GET') {
    const requestedId = req.query.conversationId
    let conversationId = typeof requestedId === 'string' && requestedId ? requestedId : null
    if (conversationId && !(await requireOwnedConversation(user.id, conversationId))) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    if (!conversationId) {
      const rows = (await sql`
        SELECT id FROM conversations WHERE user_id = ${user.id} ORDER BY updated_at DESC LIMIT 1
      `) as { id: string }[]
      conversationId = rows[0]?.id ?? null
    }
    if (!conversationId) return res.status(200).json({ conversationId: null, messages: [] })

    const rows = await sql`
      SELECT role, content, created_at AS "createdAt" FROM chat_messages
      WHERE conversation_id = ${conversationId} ORDER BY created_at ASC LIMIT 200
    `
    return res.status(200).json({ conversationId, messages: rows })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const allowed = await checkRateLimit(`coach:${user.id}`, 20, 60 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many messages, try again in a bit', code: 'rate_limited' })
  }

  const { message, conversationId: requestedConversationId } = req.body ?? {}
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'The AI coach is not configured yet — a GEMINI_API_KEY is missing from this deployment.',
      code: 'ai_not_configured',
    })
  }

  const trimmedMessage = message.trim()

  let conversationId: string
  if (typeof requestedConversationId === 'string' && requestedConversationId) {
    if (!(await requireOwnedConversation(user.id, requestedConversationId))) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    conversationId = requestedConversationId
    // Auto-title "New chat" conversations on first user message
    const existingTitleRows = (await sql`SELECT title FROM conversations WHERE id = ${conversationId}`) as { title: string }[]
    const currentTitle = existingTitleRows[0]?.title
    const historyCount = (await sql`SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = ${conversationId}`) as { count: string }[]
    const msgCount = Number(historyCount[0]?.count || 0)
    if (currentTitle === 'New chat' && msgCount === 0) {
      const newTitle = titleFromMessage(trimmedMessage)
      await sql`UPDATE conversations SET title = ${newTitle} WHERE id = ${conversationId}`
    }
  } else {
    const created = await sql`
      INSERT INTO conversations (user_id, title) VALUES (${user.id}, ${titleFromMessage(trimmedMessage)}) RETURNING id
    `
    conversationId = (created[0] as { id: string }).id
  }

  const historyRows = (await sql`
    SELECT role, content FROM chat_messages
    WHERE conversation_id = ${conversationId} ORDER BY created_at ASC LIMIT ${HISTORY_LIMIT}
  `) as { role: string; content: string }[]

  let data: GeminiResponse
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(user) }] },
          contents: [
            ...historyRows.map((row) => ({
              role: row.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: row.content }],
            })),
            { role: 'user', parts: [{ text: trimmedMessage }] },
          ],
        }),
      },
    )
    if (!geminiRes.ok) {
      console.error('Gemini API error', geminiRes.status, await geminiRes.text())
      return res.status(502).json({ error: 'The AI coach is temporarily unavailable', code: 'ai_unavailable' })
    }
    data = (await geminiRes.json()) as GeminiResponse
  } catch (error) {
    console.error('Gemini request failed', error)
    return res.status(502).json({ error: 'The AI coach is temporarily unavailable', code: 'ai_unavailable' })
  }

  if (data.promptFeedback?.blockReason) {
    return res.status(200).json({
      conversationId,
      reply: { role: 'assistant', content: "I can't help with that particular request — let's talk fitness or nutrition instead." },
    })
  }

  const replyText =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ||
    "Sorry, I couldn't come up with a response just now — try again?"

  await sql`INSERT INTO chat_messages (user_id, conversation_id, role, content) VALUES (${user.id}, ${conversationId}, 'user', ${trimmedMessage})`
  const savedRows = await sql`
    INSERT INTO chat_messages (user_id, conversation_id, role, content) VALUES (${user.id}, ${conversationId}, 'assistant', ${replyText})
    RETURNING role, content, created_at AS "createdAt"
  `
  await sql`UPDATE conversations SET updated_at = now() WHERE id = ${conversationId}`

  return res.status(200).json({ conversationId, reply: savedRows[0] })
}
