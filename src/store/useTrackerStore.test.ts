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

import { afterEach, vi } from 'vitest'
import { useTrackerStore } from './useTrackerStore'

describe('workout streak', () => {
  afterEach(() => { vi.useRealTimers(); useTrackerStore.getState().reset() })
  const setDays = (...days: number[]) => {
    useTrackerStore.setState({ completedWorkouts: days.map((day, i) => ({
      id: String(i), workoutId: 'strength', dateISO: new Date(2026, 8, day, 12).toISOString(), durationMin: 20, calories: 100,
    })) })
  }
  it('keeps yesterday’s streak before today’s workout', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 21, 10))
    setDays(20, 19, 18)
    expect(useTrackerStore.getState().currentStreak()).toBe(3)
  })
  it('counts local days once and stops at a gap', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 21, 18))
    setDays(21, 21, 20, 18)
    expect(useTrackerStore.getState().currentStreak()).toBe(2)
  })
  it('resets only after an entire missed day', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 21, 10))
    setDays(19, 18)
    expect(useTrackerStore.getState().currentStreak()).toBe(0)
  })
  it('handles month and year boundaries', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2027, 0, 1, 10))
    useTrackerStore.setState({ completedWorkouts: [31, 30].map((day) => ({ id: String(day), workoutId: 'test', dateISO: new Date(2026, 11, day, 12).toISOString(), durationMin: 20, calories: 100 })) })
    expect(useTrackerStore.getState().currentStreak()).toBe(2)
  })
})
