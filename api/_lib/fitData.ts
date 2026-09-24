export interface FitAggregate {
  bucket?: { dataset?: { point?: { value?: { intVal?: number; fpVal?: number }[] }[] }[] }[]
}

/** Each requested type is returned in request order. Sum buckets, not duplicate sources. */
export function aggregateTotal(data: FitAggregate, index: number): number | null {
  const points = (data.bucket ?? []).flatMap((b) => b.dataset?.[index]?.point ?? [])
  const values = points.map((p) => p.value?.[0]?.fpVal ?? p.value?.[0]?.intVal).filter((n): n is number => n != null && Number.isFinite(n) && n >= 0)
  return values.length ? values.reduce((a, b) => a + b, 0) : null
}

export function averageHeartRate(data: FitAggregate): number | null {
  // A daily aggregate returns average, maximum, minimum (in that order).
  // Scan every bucket: a day can come back split across buckets, and any of
  // them may hold the summary point.
  for (const bucket of data.bucket ?? []) {
    for (const point of bucket.dataset?.[0]?.point ?? []) {
      const value = point.value?.[0]?.fpVal ?? point.value?.[0]?.intVal
      if (value != null && Number.isFinite(value) && value > 0) return value
    }
  }
  return null
}

/** The token exists but Google won't let it read this metric (missing/rejected scope). */
export function isMetricAuthFailure(status: number): boolean {
  return status === 401 || status === 403
}

/**
 * `invalid_grant` from the token endpoint means the refresh token was
 * revoked or expired — the only recovery is the user reconnecting, so the
 * stored tokens are dead weight and must be cleared.
 */
export function isReauthRequired(tokenErrorCode: string | null | undefined): boolean {
  return tokenErrorCode === 'invalid_grant'
}
