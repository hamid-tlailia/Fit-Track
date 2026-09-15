import { Pause, Play, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import type { Workout } from '@/data/workouts'
import { getWorkoutById } from '@/data/workouts'
import type { SupportedLanguage } from '@/i18n'
import { loadVoices, speak, stopSpeaking } from '@/lib/voice'
import { useAppStore } from '@/store/useAppStore'
import { useTrackerStore } from '@/store/useTrackerStore'

interface Phase {
  type: 'work' | 'rest'
  exerciseIndex: number
  setNumber: number
  totalSets: number
  durationSec?: number
}

function buildPhases(exercises: Workout['exercises']): Phase[] {
  const phases: Phase[] = []
  exercises.forEach((exercise, exerciseIndex) => {
    const totalSets = exercise.sets ?? 1
    for (let setNumber = 1; setNumber <= totalSets; setNumber += 1) {
      phases.push({ type: 'work', exerciseIndex, setNumber, totalSets, durationSec: exercise.durationSec })
      const isLast = exerciseIndex === exercises.length - 1 && setNumber === totalSets
      if (!isLast && exercise.restSec > 0) {
        phases.push({ type: 'rest', exerciseIndex, setNumber, totalSets, durationSec: exercise.restSec })
      }
    }
  })
  return phases
}

export default function WorkoutPlayer() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const navigate = useNavigate()
  const { workoutId } = useParams()
  const workout = workoutId ? getWorkoutById(workoutId) : undefined

  const voiceGender = useAppStore((state) => state.voiceGender)
  const voiceEnabled = useAppStore((state) => state.voiceEnabled)
  const setVoiceEnabled = useAppStore((state) => state.setVoiceEnabled)
  const completeWorkout = useTrackerStore((state) => state.completeWorkout)

  const phases = useMemo(() => buildPhases(workout?.exercises ?? []), [workout])
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [remaining, setRemaining] = useState(phases[0]?.durationSec ?? 0)
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)
  const spokenPhaseRef = useRef(-1)

  useEffect(() => {
    void loadVoices()
  }, [])

  const phase = phases[phaseIndex]
  const exercise = workout && phase ? workout.exercises[phase.exerciseIndex] : undefined

  useEffect(() => {
    if (!phase || !exercise || !voiceEnabled) return
    if (spokenPhaseRef.current === phaseIndex) return
    spokenPhaseRef.current = phaseIndex
    const lang = i18n.language as SupportedLanguage
    const text =
      phase.type === 'work'
        ? isAr
          ? exercise.cueAr
          : exercise.cueEn
        : t('player.restCue')
    speak(text, { lang, gender: voiceGender })
  }, [phase, exercise, phaseIndex, voiceEnabled, voiceGender, isAr, t, i18n.language])

  useEffect(() => {
    setRemaining(phases[phaseIndex]?.durationSec ?? 0)
  }, [phaseIndex, phases])

  useEffect(() => {
    if (!running || finished || !phase?.durationSec) return
    if (remaining <= 0) {
      goToNextPhase()
      return
    }
    const timeout = setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, finished, phase])

  useEffect(() => stopSpeaking, [])

  if (!workout) return <Navigate to="/workouts" replace />

  function goToNextPhase() {
    if (phaseIndex + 1 >= phases.length) {
      finishWorkout()
      return
    }
    setPhaseIndex((index) => index + 1)
  }

  function finishWorkout() {
    if (!workout) return
    stopSpeaking()
    completeWorkout(workout.id, workout.durationMin, workout.calories)
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-bg text-ink">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-extrabold">{t('player.complete.title')}</h1>
        <p className="text-ink-soft max-w-xs">
          {t('player.complete.subtitle', { calories: workout.calories })}
        </p>
        <div className="flex gap-3 mt-3">
          <Button variant="secondary" onClick={() => navigate('/workouts')}>
            {t('player.complete.backToWorkouts')}
          </Button>
          <Button onClick={() => navigate('/')}>{t('player.complete.dashboard')}</Button>
        </div>
      </div>
    )
  }

  if (!phase || !exercise) return null

  const progressPct = ((phaseIndex + 1) / phases.length) * 100

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-ink px-6 py-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/workouts/${workout.id}`)}
          className="text-ink-soft flex items-center gap-1.5 text-sm font-semibold"
        >
          <X size={18} /> {t('player.exit')}
        </button>
        <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="text-ink-soft">
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-accent transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            phase.type === 'rest' ? 'bg-accent/20 text-accent' : 'bg-brand-500/20 text-brand-400'
          }`}
        >
          {phase.type === 'rest' ? t('player.rest') : t('player.setLabel', { current: phase.setNumber, total: phase.totalSets })}
        </span>

        <h1 className="text-3xl font-extrabold max-w-sm">
          {phase.type === 'rest' ? t('player.rest') : isAr ? exercise.nameAr : exercise.nameEn}
        </h1>

        {phase.durationSec ? (
          <div className="text-7xl font-black tabular-nums">{remaining}</div>
        ) : (
          <p className="text-2xl font-bold text-ink-soft">
            {exercise.reps} {t('player.reps')}
          </p>
        )}

        {phase.type === 'work' && <p className="text-ink-soft max-w-xs">{isAr ? exercise.cueAr : exercise.cueEn}</p>}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        {phase.durationSec ? (
          <button
            onClick={() => setRunning((value) => !value)}
            className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg"
          >
            {running ? <Pause size={26} /> : <Play size={26} />}
          </button>
        ) : (
          <Button className="px-8 py-3" onClick={goToNextPhase}>
            {t('player.done')}
          </Button>
        )}
        <button
          onClick={goToNextPhase}
          className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink-soft"
          aria-label={t('player.skip')}
        >
          <SkipForward size={20} />
        </button>
      </div>

      <p className="text-center text-xs text-ink-soft mt-4">
        <Link to={`/workouts/${workout.id}`} className="underline">
          {isAr ? workout.titleAr : workout.titleEn}
        </Link>
      </p>
    </div>
  )
}
