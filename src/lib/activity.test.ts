import { describe, expect, it } from 'vitest'
import { estimateActiveCalories, workoutCalories } from './activity'
import { aggregateTotal, averageHeartRate } from '../../api/_lib/fitData'

describe('honest activity metrics', () => {
  it('removes only elapsed resting energy from Fit total', () => {
    expect(estimateActiveCalories(1200, 1800, 720)).toBe(300)
    expect(estimateActiveCalories(900, 1800, 720)).toBe(0)
    expect(estimateActiveCalories(200, 1800, 720)).toBe(0)
    expect(estimateActiveCalories(Number.NaN, 1800, 720)).toBe(0)
  })
  it('does not award a full workout when phases are skipped', () => {
    expect(workoutCalories(300, 30, 6)).toBe(1)
    expect(workoutCalories(300, 30, 900)).toBe(150)
    expect(workoutCalories(300, 30, 3600)).toBe(300)
    expect(workoutCalories(300, 0, 20)).toBe(0)
  })
  it('distinguishes unavailable sensor readings from actual zero', () => {
    expect(aggregateTotal({}, 0)).toBeNull()
    expect(aggregateTotal({ bucket: [{ dataset: [{ point: [{ value: [{ intVal: 0 }] }] }] }] }, 0)).toBe(0)
    expect(averageHeartRate({})).toBeNull()
  })
  it('adds buckets but does not add unrelated datasets', () => {
    const bucket = { dataset: [{ point: [{ value: [{ intVal: 500 }] }] }, { point: [{ value: [{ fpVal: 800.5 }] }] }] }
    expect(aggregateTotal({ bucket: [bucket, bucket] }, 0)).toBe(1000)
    expect(aggregateTotal({ bucket: [bucket] }, 1)).toBe(800.5)
  })
  it('uses the mean heart rate, not the max/min or a sum of readings', () => {
    expect(averageHeartRate({ bucket: [{ dataset: [{ point: [{ value: [{ fpVal: 75 }, { fpVal: 110 }, { fpVal: 60 }] }] }] }] })).toBe(75)
  })
})
