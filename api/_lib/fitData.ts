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
  // A single daily aggregate returns average, maximum, minimum (in that order).
  const value = data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal
  return value != null && Number.isFinite(value) && value > 0 ? value : null
}
