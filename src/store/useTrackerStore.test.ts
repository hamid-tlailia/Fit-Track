import { describe, expect, it } from 'vitest'

import { dateKeyOf } from './useTrackerStore'

describe('dateKeyOf', () => {
  it('uses the local calendar date, not the UTC one', () => {
    // 2026-01-01T01:00 local time in a timezone 3 hours ahead of UTC is
    // still 2025-12-31 in UTC — `.toISOString().slice(0, 10)` would report
    // the wrong (previous) day here, which was the bug.
    const local = new Date(2026, 0, 1, 1, 0, 0)
    expect(dateKeyOf(local)).toBe('2026-01-01')
  })

  it('parses an ISO timestamp string the same way as a Date object', () => {
    const iso = new Date(2026, 5, 15, 12, 0, 0).toISOString()
    expect(dateKeyOf(iso)).toBe(dateKeyOf(new Date(iso)))
  })

  it('pads single-digit months and days', () => {
    expect(dateKeyOf(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
