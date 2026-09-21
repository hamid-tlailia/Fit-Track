// Keep the default on a currently supported stable Flash model. It can still
// be overridden per deployment when Google changes model availability.
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'
const FALLBACK_GEMINI_MODEL = 'gemini-1.5-flash'

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

/** Single-shot Gemini call: one system instruction, one user prompt, plain text back. */
export async function callGemini(systemInstruction: string, userPrompt: string, history: { role: string; content: string }[] = []): Promise<string> {
  // GEMINI_API_KEY is the documented name. GOOGLE_API_KEY is accepted as a
  // compatibility fallback for projects created directly in Google AI Studio.
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
  if (!apiKey) throw new GeminiError('not_configured', 'GEMINI_API_KEY is missing from this deployment')

  const configuredModel = (process.env.GEMINI_MODEL || '').trim().replace(/^models\//, '')
  const primaryModel = configuredModel || DEFAULT_GEMINI_MODEL
  const modelsToTry = configuredModel ? [primaryModel] : [primaryModel, FALLBACK_GEMINI_MODEL, 'gemini-1.5-flash-latest']

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
        if (res.status === 404 && modelsToTry.length > 1) {
          lastError = new GeminiError('model_unavailable', `Model ${model} not available`)
          continue // try next fallback model
        }
        const code = res.status === 429 ? 'quota_exceeded' : res.status === 401 || res.status === 403 ? 'credentials_invalid' : res.status === 404 ? 'model_unavailable' : 'unavailable'
        throw new GeminiError(code, 'The AI service could not complete this request')
      }
      data = (await res.json()) as GeminiResponse
      break
    } catch (error) {
      if (error instanceof GeminiError) {
        // If it's model_unavailable and we have fallbacks left, try next
        if (error.code === 'model_unavailable' && modelsToTry.indexOf(model) < modelsToTry.length - 1) {
          lastError = error
          continue
        }
        throw error
      }
      console.error('Gemini request failed', model, error)
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new GeminiError('timeout', 'The AI request timed out')
      }
      // For network errors, try next model if available
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
