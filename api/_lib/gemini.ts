// Override without redeploying code when the provider retires a model.
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash'

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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new GeminiError('not_configured', 'GEMINI_API_KEY is missing from this deployment')

  let data: GeminiResponse
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      signal: AbortSignal.timeout(25_000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [...history.map((row) => ({ role: row.role === 'assistant' ? 'model' : 'user', parts: [{ text: row.content }] })), { role: 'user', parts: [{ text: userPrompt }] }],
      }),
    })
    if (!res.ok) {
      console.error('Gemini API error', res.status, await res.text())
      const code = res.status === 429 ? 'quota_exceeded' : res.status === 401 || res.status === 403 ? 'credentials_invalid' : res.status === 404 ? 'model_unavailable' : 'unavailable'
      throw new GeminiError(code, 'The AI service could not complete this request')
    }
    data = (await res.json()) as GeminiResponse
  } catch (error) {
    if (error instanceof GeminiError) throw error
    console.error('Gemini request failed', error)
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) throw new GeminiError('timeout', 'The AI request timed out')
    throw new GeminiError('unavailable', 'The AI service is temporarily unavailable')
  }

  if (data.promptFeedback?.blockReason) {
    throw new GeminiError('request_blocked', 'The request was blocked by content filtering')
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new GeminiError('unavailable', 'The AI service returned an empty response')
  return text
}
