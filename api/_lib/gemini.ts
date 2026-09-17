const GEMINI_MODEL = 'gemini-3.6-flash'

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
    finishReason?: string
  }[]
  promptFeedback?: { blockReason?: string }
}

export class GeminiError extends Error {
  code: 'not_configured' | 'unavailable'
  constructor(code: 'not_configured' | 'unavailable', message: string) {
    super(message)
    this.code = code
  }
}

/** Single-shot Gemini call: one system instruction, one user prompt, plain text back. */
export async function callGemini(systemInstruction: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new GeminiError('not_configured', 'GEMINI_API_KEY is missing from this deployment')

  let data: GeminiResponse
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      }),
    })
    if (!res.ok) {
      console.error('Gemini API error', res.status, await res.text())
      throw new GeminiError('unavailable', 'The AI service is temporarily unavailable')
    }
    data = (await res.json()) as GeminiResponse
  } catch (error) {
    if (error instanceof GeminiError) throw error
    console.error('Gemini request failed', error)
    throw new GeminiError('unavailable', 'The AI service is temporarily unavailable')
  }

  if (data.promptFeedback?.blockReason) {
    throw new GeminiError('unavailable', 'The request was blocked by content filtering')
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new GeminiError('unavailable', 'The AI service returned an empty response')
  return text
}
