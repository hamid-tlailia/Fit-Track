/** Google Fit total energy includes resting metabolism; never label it as exercise energy. */
export function estimateActiveCalories(totalKcal: number, dailyBmr: number, elapsedMinutes: number): number {
  if (![totalKcal, dailyBmr, elapsedMinutes].every(Number.isFinite)) return 0
  return Math.round(Math.max(0, totalKcal - dailyBmr * Math.min(1440, Math.max(0, elapsedMinutes)) / 1440))
}

/** Scale the catalog estimate by actual unpaused session time, capped at the full session. */
export function workoutCalories(catalogCalories: number, plannedMinutes: number, elapsedSeconds: number): number {
  if (plannedMinutes <= 0 || elapsedSeconds <= 0) return 0
  return Math.round(catalogCalories * Math.min(1, elapsedSeconds / (plannedMinutes * 60)))
}
