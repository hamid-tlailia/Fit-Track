import { afterEach, describe, expect, it, vi } from 'vitest'
import { callGemini, DEFAULT_GEMINI_MODEL } from './gemini'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const reply = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Keep going!' }] } }] }), { status: 200 })

// Helper to make fetch mock that handles model discovery + generateContent separately
function makeFetchMock(generateContentResponse: () => Response) {
  return vi.fn().mockImplementation((url: string) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    // Discovery call: GET /v1beta/models
    if (urlStr.includes('/v1beta/models') && !urlStr.includes(':generateContent')) {
      // Return empty list so discovery returns null and falls back to hardcoded list
      return Promise.resolve(new Response(JSON.stringify({ models: [] }), { status: 200 }))
    }
    // generateContent call
    return Promise.resolve(generateContentResponse())
  })
}

describe('shared AI service', () => {
  it('returns a clear missing-configuration error without a provider call', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'not_configured' })
  })
  it('uses the configurable model, language instruction, and conversation context', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only'); vi.stubEnv('GEMINI_MODEL', 'configured-model')
    const fetcher = makeFetchMock(reply)
    vi.stubGlobal('fetch', fetcher)
    expect(await callGemini('Reply in Arabic', 'hello', [{ role: 'assistant', content: 'Welcome' }])).toBe('Keep going!')
    // The first generateContent call should contain configured-model (discovery call is separate)
    const genCalls = fetcher.mock.calls.filter(([u]: [string]) => typeof u === 'string' && u.includes(':generateContent'))
    expect(genCalls[0][0]).toContain('configured-model:generateContent')
    const options = genCalls[0][1] as RequestInit
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(options.body as string).contents[0].role).toBe('model')
    expect(JSON.parse(options.body as string).system_instruction.parts[0].text).toBe('Reply in Arabic')
  })
  it('uses the documented default model', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only'); vi.stubEnv('GEMINI_MODEL', '')
    const fetcher = makeFetchMock(reply)
    vi.stubGlobal('fetch', fetcher)
    await callGemini('coach', 'hi')
    const genCalls = fetcher.mock.calls.filter(([u]: [string]) => typeof u === 'string' && u.includes(':generateContent'))
    expect(genCalls[0][0]).toContain(DEFAULT_GEMINI_MODEL)
  })
  it('rejects empty or blocked replies instead of pretending the coach answered', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.stubGlobal('fetch', makeFetchMock(() => new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }))))
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'request_blocked' })
  })
  it.each([[429, 'quota_exceeded'], [403, 'credentials_invalid'], [404, 'model_unavailable'], [500, 'unavailable']])('diagnoses provider status %s', async (status, code) => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', makeFetchMock(() => new Response('{}', { status: Number(status) })))
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code })
  })
  it('diagnoses a timeout rather than leaving the coach thinking indefinitely', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    // For timeout, discovery should still succeed with empty list, but generateContent times out
    const fetcher = vi.fn().mockImplementation((url: string) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/v1beta/models') && !urlStr.includes(':generateContent')) {
        return Promise.resolve(new Response(JSON.stringify({ models: [] }), { status: 200 }))
      }
      return Promise.reject(new DOMException('timed out', 'TimeoutError'))
    })
    vi.stubGlobal('fetch', fetcher)
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'timeout' })
  })
  it('rejects empty provider responses', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.stubGlobal('fetch', makeFetchMock(() => new Response('{}')))
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'unavailable' })
  })
  it('falls back to next model when first is unavailable', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only'); vi.stubEnv('GEMINI_MODEL', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    let callIndex = 0
    const fetcher = vi.fn().mockImplementation((url: string) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/v1beta/models') && !urlStr.includes(':generateContent')) {
        return Promise.resolve(new Response(JSON.stringify({ models: [] }), { status: 200 }))
      }
      callIndex++
      if (callIndex === 1) {
        // First model fails with 404
        return Promise.resolve(new Response('{}', { status: 404 }))
      }
      return Promise.resolve(reply())
    })
    vi.stubGlobal('fetch', fetcher)
    const result = await callGemini('coach', 'hi')
    expect(result).toBe('Keep going!')
    // Should have tried at least 2 generateContent calls
    const genCalls = fetcher.mock.calls.filter(([u]: [string]) => typeof u === 'string' && u.includes(':generateContent'))
    expect(genCalls.length).toBeGreaterThanOrEqual(2)
  })

})
