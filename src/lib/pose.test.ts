import { describe, expect, it } from 'vitest'

import type { RepCounterState } from './pose'
import { angleBetween, bestSideAngle, exercises, stepRepCounter } from './pose'

describe('angleBetween', () => {
  it('is 180 degrees for three collinear points (straight leg)', () => {
    expect(angleBetween({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })).toBeCloseTo(180)
  })

  it('is 90 degrees for a right angle', () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90)
  })

  it('returns 0 when two points coincide (degenerate triangle)', () => {
    expect(angleBetween({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(0)
  })
})

describe('bestSideAngle', () => {
  it('picks the higher-confidence side', () => {
    const keypoints = [
      { name: 'left_hip', x: 0, y: 0, score: 0.9 },
      { name: 'left_knee', x: 0, y: 1, score: 0.9 },
      { name: 'left_ankle', x: 0, y: 2, score: 0.9 },
      { name: 'right_hip', x: 0, y: 0, score: 0.1 },
      { name: 'right_knee', x: 1, y: 0, score: 0.1 },
      { name: 'right_ankle', x: 0, y: 0, score: 0.1 },
    ]
    // left side is collinear -> 180deg; right side is low confidence and should be ignored
    expect(bestSideAngle(keypoints, ['hip', 'knee', 'ankle'])).toBeCloseTo(180)
  })

  it('returns null when no side is confidently visible', () => {
    const keypoints = [
      { name: 'left_hip', x: 0, y: 0, score: 0.1 },
      { name: 'left_knee', x: 0, y: 1, score: 0.1 },
      { name: 'left_ankle', x: 0, y: 2, score: 0.1 },
    ]
    expect(bestSideAngle(keypoints, ['hip', 'knee', 'ankle'])).toBeNull()
  })

  it('returns null when a keypoint is missing entirely', () => {
    const keypoints = [{ name: 'left_hip', x: 0, y: 0, score: 0.9 }]
    expect(bestSideAngle(keypoints, ['hip', 'knee', 'ankle'])).toBeNull()
  })
})

describe('stepRepCounter', () => {
  const squat = exercises.find((e) => e.id === 'squat')!

  it('counts one full rep: up -> down -> up', () => {
    let state: RepCounterState = { phase: 'up', reps: 0 }
    state = stepRepCounter(state, 170, squat) // still up, no change
    expect(state).toEqual({ phase: 'up', reps: 0 })

    state = stepRepCounter(state, 80, squat) // deep enough -> down
    expect(state).toEqual({ phase: 'down', reps: 0 })

    state = stepRepCounter(state, 90, squat) // still below up-threshold -> stays down
    expect(state).toEqual({ phase: 'down', reps: 0 })

    state = stepRepCounter(state, 170, squat) // stood back up -> rep counted
    expect(state).toEqual({ phase: 'up', reps: 1 })
  })

  it('does not count a rep that never reaches full depth', () => {
    let state: RepCounterState = { phase: 'up', reps: 0 }
    state = stepRepCounter(state, 140, squat) // not deep enough to register "down"
    expect(state.phase).toBe('up')
    state = stepRepCounter(state, 170, squat)
    expect(state).toEqual({ phase: 'up', reps: 0 })
  })

  it('ignores a null angle (person momentarily out of frame)', () => {
    const state = { phase: 'down' as const, reps: 3 }
    expect(stepRepCounter(state, null, squat)).toEqual(state)
  })
})
