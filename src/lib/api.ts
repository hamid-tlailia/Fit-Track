export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, message: string, code = 'unknown') {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    // AI plan generation can be slower on a cold serverless function; keep
    // the browser timeout just above the provider's server-side timeout.
    signal: AbortSignal.timeout(55_000),
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : null

  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Request failed with status ${res.status}`, body?.code)
  }
  if (!isJson || body === null) throw new ApiError(502, 'The API returned an invalid response', 'invalid_response')
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
