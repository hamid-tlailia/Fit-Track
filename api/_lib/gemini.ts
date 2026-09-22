// Keep defaults on currently supported stable models.
// Gemini 2.0 models were shut down June 1, 2026 (see https://ai.google.dev/gemini-api/docs/changelog)
// Gemini 1.5 models retired May-Sep 2025. Use 2.5 and 3.x series now.
// The free tier as of 2026 includes: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-flash-latest, gemini-flash-lite-latest, gemini-3.5-flash, gemini-3.1-flash-lite etc.
// We try a robust fallback chain and also attempt dynamic model discovery via ListModels.

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

// Preferred order for free-tier / widely available models (newest stable first, then aliases, then pro fallbacks)
const PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-pro',
  'gemini-pro-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview',
] as const

// Ultimate legacy fallbacks (kept only as last resort, may be retired but harmless to try)
const LEGACY_FALLBACKS = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'] as const

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
    finishReason?: string
  }[]
  promptFeedback?: { blockReason?: string }
}

type GeminiErrorCode = 'not_configured' | 'unavailable' | 'quota_exceeded' | 'credentials_invalid' | 'model_unavailable' | 'request_blocked' | 'timeout'

export class GeminiError extends Error {
  code: GeminiErrorCode
  constructor(code: GeminiErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

interface ModelListItem {
  name?: string // "models/gemini-2.5-flash"
  supportedGenerationMethods?: string[]
}

interface ModelListResponse {
  models?: ModelListItem[]
}

function normalizeModelName(name: string): string {
  return name.trim().replace(/^models\//, '')
}

function buildModelCandidates(): string[] {
  const configured = (process.env.GEMINI_MODEL || '').trim().replace(/^models\//, '')
  const primary = configured || DEFAULT_GEMINI_MODEL
  const all = [primary, ...PREFERRED_MODELS.filter((m) => m !== primary), ...LEGACY_FALLBACKS.filter((m) => m !== primary)]
  // dedupe preserving order
  return [...new Set(all)]
}

async function discoverAvailableModels(apiKey: string): Promise<string[] | null> {
  // Try to list models to discover what this API key / project actually supports.
  // This makes the app resilient to future deprecations.
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
      headers: { 'x-goog-api-key': apiKey },
    })
    if (!res.ok) return null
    const data = (await res.json()) as ModelListResponse
    const models = data.models ?? []
    const usable = models
      .filter((m) => m.name && (m.supportedGenerationMethods?.includes('generateContent') ?? true))
      .map((m) => normalizeModelName(m.name!))
      .filter((n) => {
        // Keep only text generation models, exclude embedding, imagen, veo, tts, etc.
        const lower = n.toLowerCase()
        if (lower.includes('embedding')) return false
        if (lower.includes('imagen')) return false
        if (lower.includes('veo')) return false
        if (lower.includes('tts')) return false
        if (lower.includes('transcribe')) return false
        if (lower.includes('live')) return false
        if (lower.includes('aqa')) return false
        return true
      })
    if (usable.length === 0) return null
    // Order usable by our preference list first, then any other flash models
    const preferredSet = new Set(PREFERRED_MODELS)
    const preferredAvailable = PREFERRED_MODELS.filter((p) => usable.includes(p))
    const otherFlash = usable.filter((u) => !preferredSet.has(u) && (u.includes('flash') || u.includes('pro'))).sort()
    const remaining = usable.filter((u) => !preferredSet.has(u) && !otherFlash.includes(u))
    return [...preferredAvailable, ...otherFlash, ...remaining]
  } catch {
    return null
  }
}

/** Single-shot Gemini call: one system instruction, one user prompt, plain text back. */
export async function callGemini(systemInstruction: string, userPrompt: string, history: { role: string; content: string }[] = []): Promise<string> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
  if (!apiKey) throw new GeminiError('not_configured', 'GEMINI_API_KEY is missing from this deployment')

  let modelsToTry = buildModelCandidates()

  // If we have a configured model, ensure we try to discover actual available models and prioritize accordingly
  // but still keep configured model first if it exists.
  const discovered = await discoverAvailableModels(apiKey)
  if (discovered && discovered.length > 0) {
    const configured = (process.env.GEMINI_MODEL || '').trim().replace(/^models\//, '')
    if (configured) {
      // If configured model is not in discovered list, it likely doesn't exist - put discovered after configured, but still try discovered
      if (!discovered.includes(configured)) {
        modelsToTry = [configured, ...discovered.filter((m) => m !== configured)]
      } else {
        // configured is valid, put it first, then rest of discovered in preference order
        modelsToTry = [configured, ...discovered.filter((m) => m !== configured)]
      }
    } else {
      // No configured model: use discovered order (which already respects PREFERRED_MODELS)
      // Merge with our hardcoded fallback to ensure coverage
      const merged = [...discovered, ...modelsToTry.filter((m) => !discovered.includes(m))]
      modelsToTry = [...new Set(merged)]
    }
  }

  let data: GeminiResponse | null = null
  let lastError: GeminiError | null = null

  for (const model of modelsToTry) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: AbortSignal.timeout(50_000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [...history.map((row) => ({ role: row.role === 'assistant' ? 'model' : 'user', parts: [{ text: row.content }] })), { role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      })
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '')
        console.error('Gemini API error', model, res.status, bodyText)

        // Model not found / not supported -> try next model
        if (res.status === 404 || res.status === 400) {
          lastError = new GeminiError('model_unavailable', `Model ${model} not available (${res.status})`)
          continue
        }

        const code =
          res.status === 429 ? 'quota_exceeded' : res.status === 401 || res.status === 403 ? 'credentials_invalid' : res.status === 404 ? 'model_unavailable' : 'unavailable'

        // For 5xx or generic unavailable, try next model if we have more candidates
        if ((res.status >= 500 || code === 'unavailable') && modelsToTry.indexOf(model) < modelsToTry.length - 1) {
          lastError = new GeminiError(code as GeminiErrorCode, `Model ${model} unavailable`)
          continue
        }

        throw new GeminiError(code as GeminiErrorCode, 'The AI service could not complete this request')
      }
      data = (await res.json()) as GeminiResponse
      if (modelsToTry.indexOf(model) > 0) {
        console.log(`Gemini fallback succeeded with model ${model} (tried ${modelsToTry.indexOf(model)} before)`)
      }
      break
    } catch (error) {
      if (error instanceof GeminiError) {
        if (error.code === 'model_unavailable' && modelsToTry.indexOf(model) < modelsToTry.length - 1) {
          lastError = error
          continue
        }
        throw error
      }
      console.error('Gemini request failed', model, error)
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        // Timeout: try next model if available, else throw timeout
        if (modelsToTry.indexOf(model) < modelsToTry.length - 1) {
          lastError = new GeminiError('timeout', 'The AI request timed out')
          continue
        }
        throw new GeminiError('timeout', 'The AI request timed out')
      }
      if (modelsToTry.indexOf(model) < modelsToTry.length - 1) {
        lastError = new GeminiError('unavailable', 'The AI service is temporarily unavailable')
        continue
      }
      throw new GeminiError('unavailable', 'The AI service is temporarily unavailable')
    }
  }

  if (!data) {
    throw lastError ?? new GeminiError('unavailable', 'The AI service returned no data')
  }

  if (data.promptFeedback?.blockReason) {
    throw new GeminiError('request_blocked', 'The request was blocked by content filtering')
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new GeminiError('unavailable', 'The AI service returned an empty response')
  return text
}
