import { afterEach, describe, expect, it, vi } from 'vitest'
import { callGemini, DEFAULT_GEMINI_MODEL } from './gemini'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const reply = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Keep going!' }] } }] }), { status: 200 })
describe('shared AI service', () => {
  it('returns a clear missing-configuration error without a provider call', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'not_configured' })
  })
  it('uses the configurable model, language instruction, and conversation context', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only'); vi.stubEnv('GEMINI_MODEL', 'configured-model')
    const fetcher = vi.fn().mockResolvedValue(reply()); vi.stubGlobal('fetch', fetcher)
    expect(await callGemini('Reply in Arabic', 'hello', [{ role: 'assistant', content: 'Welcome' }])).toBe('Keep going!')
    expect(fetcher.mock.calls[0][0]).toContain('configured-model:generateContent')
    const options = fetcher.mock.calls[0][1]
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(options.body).contents[0].role).toBe('model')
    expect(JSON.parse(options.body).system_instruction.parts[0].text).toBe('Reply in Arabic')
  })
  it('uses the documented default model', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only'); vi.stubEnv('GEMINI_MODEL', '')
    const fetcher = vi.fn().mockResolvedValue(reply()); vi.stubGlobal('fetch', fetcher)
    await callGemini('coach', 'hi')
    expect(fetcher.mock.calls[0][0]).toContain(DEFAULT_GEMINI_MODEL)
  })
  it('rejects empty or blocked replies instead of pretending the coach answered', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }))))
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'request_blocked' })
  })
  it.each([[429, 'quota_exceeded'], [403, 'credentials_invalid'], [404, 'model_unavailable'], [500, 'unavailable']])('diagnoses provider status %s', async (status, code) => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: Number(status) })))
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code })
  })
  it('diagnoses a timeout rather than leaving the coach thinking indefinitely', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')))
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'timeout' })
  })
  it('rejects empty provider responses', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
    await expect(callGemini('coach', 'hi')).rejects.toMatchObject({ code: 'unavailable' })
  })

})
