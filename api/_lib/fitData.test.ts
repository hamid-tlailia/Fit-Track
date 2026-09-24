import { describe, expect, it } from 'vitest'

import { averageHeartRate, isMetricAuthFailure, isReauthRequired } from './fitData'

describe('Google Fit sync helpers', () => {
  it('finds the heart-rate summary in any bucket, not only the first', () => {
    const empty = { bucket: [{ dataset: [{ point: [] }] }, { dataset: [{ point: [{ value: [{ fpVal: 71.5 }, { fpVal: 90 }, { fpVal: 58 }] }] }] }] }
    expect(averageHeartRate(empty)).toBe(71.5)
  })

  it('treats 401/403 as a scope problem and nothing else', () => {
    expect(isMetricAuthFailure(401)).toBe(true)
    expect(isMetricAuthFailure(403)).toBe(true)
    expect(isMetricAuthFailure(404)).toBe(false)
    expect(isMetricAuthFailure(400)).toBe(false)
    expect(isMetricAuthFailure(500)).toBe(false)
  })

  it('only asks for reconnection when the refresh token is actually dead', () => {
    expect(isReauthRequired('invalid_grant')).toBe(true)
    expect(isReauthRequired('temporarily_unavailable')).toBe(false)
    expect(isReauthRequired('http_503')).toBe(false)
    expect(isReauthRequired(null)).toBe(false)
  })
})
