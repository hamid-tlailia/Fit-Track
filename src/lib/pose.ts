export interface Point {
  x: number
  y: number
}

/** Angle at vertex b, in degrees, formed by rays b->a and b->c. */
export function angleBetween(a: Point, b: Point, c: Point): number {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const magAB = Math.hypot(ab.x, ab.y)
  const magCB = Math.hypot(cb.x, cb.y)
  if (magAB === 0 || magCB === 0) return 0
  const cos = Math.min(1, Math.max(-1, (ab.x * cb.x + ab.y * cb.y) / (magAB * magCB)))
  return (Math.acos(cos) * 180) / Math.PI
}

export interface Keypoint extends Point {
  name?: string
  score?: number
}

export function findKeypoint(keypoints: Keypoint[], name: string): Keypoint | undefined {
  return keypoints.find((k) => k.name === name)
}

const MIN_SCORE = 0.3

/**
 * Picks whichever body side (left/right) has higher-confidence keypoints for
 * the given joint triplet, and returns the joint angle — or null if neither
 * side is confidently visible (e.g. person out of frame, poor lighting).
 */
export function bestSideAngle(
  keypoints: Keypoint[],
  jointBaseNames: [string, string, string],
): number | null {
  const sides: ('left' | 'right')[] = ['left', 'right']
  let best: { angle: number; confidence: number } | null = null

  for (const side of sides) {
    const [a, b, c] = jointBaseNames.map((base) => findKeypoint(keypoints, `${side}_${base}`))
    if (!a || !b || !c) continue
    const confidence = Math.min(a.score ?? 0, b.score ?? 0, c.score ?? 0)
    if (confidence < MIN_SCORE) continue
    if (!best || confidence > best.confidence) {
      best = { angle: angleBetween(a, b, c), confidence }
    }
  }

  return best?.angle ?? null
}

export type RepPhase = 'up' | 'down'

export interface ExerciseConfig {
  id: 'squat' | 'pushup'
  nameKey: string
  jointTriplet: [string, string, string]
  downThreshold: number
  upThreshold: number
}

export const exercises: ExerciseConfig[] = [
  { id: 'squat', nameKey: 'formCheck.exercises.squat', jointTriplet: ['hip', 'knee', 'ankle'], downThreshold: 100, upThreshold: 160 },
  { id: 'pushup', nameKey: 'formCheck.exercises.pushup', jointTriplet: ['shoulder', 'elbow', 'wrist'], downThreshold: 95, upThreshold: 160 },
]

export interface RepCounterState {
  phase: RepPhase
  reps: number
}

/** Pure state-machine step: feed the latest joint angle, get the next state. */
export function stepRepCounter(
  state: RepCounterState,
  angle: number | null,
  config: ExerciseConfig,
): RepCounterState {
  if (angle === null) return state
  if (state.phase === 'up' && angle < config.downThreshold) {
    return { phase: 'down', reps: state.reps }
  }
  if (state.phase === 'down' && angle > config.upThreshold) {
    return { phase: 'up', reps: state.reps + 1 }
  }
  return state
}
