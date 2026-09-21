import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, api } from './api'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed body on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { hello: 'world' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.get<{ hello: string }>('/ping')
    expect(result).toEqual({ hello: 'world' })
  })

  it('calls the /api-prefixed path with credentials included', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await api.get('/me')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    )
  })

  it('serializes the body as JSON for POST requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await api.post('/weight', { kg: 70 })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ kg: 70 }))
  })

  it('throws an ApiError with the status/code/message from an error response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(409, { error: 'An account with this email already exists', code: 'email_taken' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.post('/auth/register', {})).rejects.toMatchObject({
      status: 409,
      code: 'email_taken',
      message: 'An account with this email already exists',
    })
  })

  it('throws an ApiError even when the error response has no JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    const error = await api.get('/broken').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(500)
    expect((error as ApiError).code).toBe('unknown')
  })
  it('rejects a successful HTML fallback page instead of treating it as an API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html></html>', { headers: { 'content-type': 'text/html' } })))
    await expect(api.get('/ai/coach')).rejects.toMatchObject({ code: 'invalid_response' })
  })

})
