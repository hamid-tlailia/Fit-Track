import { ArrowLeft, Camera, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PremiumGate } from '@/components/PremiumGate'
import { Button } from '@/components/ui/Button'
import type { ExerciseConfig, Keypoint, RepCounterState } from '@/lib/pose'
import { bestSideAngle, exercises, stepRepCounter } from '@/lib/pose'

const SKELETON_PAIRS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
]

function drawSkeleton(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
  const byName = new Map(keypoints.map((k) => [k.name, k]))
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 3
  for (const [a, b] of SKELETON_PAIRS) {
    const pa = byName.get(a)
    const pb = byName.get(b)
    if (!pa || !pb || (pa.score ?? 0) < 0.3 || (pb.score ?? 0) < 0.3) continue
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
  }
  ctx.fillStyle = '#f84f14'
  for (const point of keypoints) {
    if ((point.score ?? 0) < 0.3) continue
    ctx.beginPath()
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

type Stage = 'pick' | 'loading' | 'ready' | 'error'

// Minimal structural types for the lazily-imported pose-detection package,
// so this file doesn't need it as a top-level (bundle-inflating) import.
interface PoseDetector {
  estimatePoses: (input: HTMLVideoElement) => Promise<{ keypoints: Keypoint[]; score?: number }[]>
  dispose?: () => void
}

function FormCheckSession() {
  const { t } = useTranslation()
  const [stage, setStage] = useState<Stage>('pick')
  const [exercise, setExercise] = useState<ExerciseConfig | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [repState, setRepState] = useState<RepCounterState>({ phase: 'up', reps: 0 })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [personVisible, setPersonVisible] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const rafRef = useRef<number | null>(null)
  const repStateRef = useRef(repState)
  const exerciseRef = useRef<ExerciseConfig | null>(null)
  const runningRef = useRef(false)
  const mountedRef = useRef(true)

  function stopCamera() {
    runningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    detectorRef.current?.dispose?.()
    streamRef.current = null
    detectorRef.current = null
  }

  useEffect(
    () => () => {
      mountedRef.current = false
      stopCamera()
    },
    [],
  )

  function loop() {
    rafRef.current = requestAnimationFrame(async () => {
      if (!runningRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      const detector = detectorRef.current
      const config = exerciseRef.current
      if (video && canvas && detector && config && video.readyState >= 2) {
        const poses = await detector.estimatePoses(video)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          const keypoints = poses[0]?.keypoints ?? []
          drawSkeleton(ctx, keypoints)
          setPersonVisible(keypoints.length > 0 && (poses[0]?.score ?? 0) > 0.25)

          const angle = bestSideAngle(keypoints, config.jointTriplet)
          const next = stepRepCounter(repStateRef.current, angle, config)
          if (next.reps !== repStateRef.current.reps) {
            setFeedback(t('formCheck.feedback.goodRep'))
            setTimeout(() => setFeedback(null), 1200)
          }
          if (next.phase !== repStateRef.current.phase || next.reps !== repStateRef.current.reps) {
            repStateRef.current = next
            setRepState(next)
          }
        }
      }
      loop()
    })
  }

  async function startExercise(config: ExerciseConfig) {
    setExercise(config)
    exerciseRef.current = config
    setRepState({ phase: 'up', reps: 0 })
    repStateRef.current = { phase: 'up', reps: 0 }
    setStage('loading')
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const [tf, poseDetection] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/pose-detection'),
      ])
      await tf.ready()
      const detector = (await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      })) as PoseDetector
      if (!mountedRef.current) {
        detector.dispose?.()
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      detectorRef.current = detector

      runningRef.current = true
      setStage('ready')
      loop()
    } catch (error) {
      stopCamera()
      setStage('error')
      setErrorMessage(
        error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'NotFoundError')
          ? t('formCheck.cameraPermissionDenied')
          : t('formCheck.notSupported'),
      )
    }
  }

  function handleBack() {
    stopCamera()
    setStage('pick')
    setExercise(null)
  }

  function handleReset() {
    setRepState({ phase: 'up', reps: 0 })
    repStateRef.current = { phase: 'up', reps: 0 }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-10 md:pt-10">
      <h1 className="text-2xl font-extrabold flex items-center gap-2">
        <Camera size={22} className="text-brand-400" /> {t('formCheck.title')}
      </h1>
      <p className="text-ink-soft mt-1">{t('formCheck.subtitle')}</p>
      <p className="mt-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs text-ink-soft">{t('formCheck.betaNotice')}</p>

      {stage === 'pick' && (
        <div className="mt-6">
          <h2 className="font-bold mb-3">{t('formCheck.chooseExercise')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {exercises.map((config) => (
              <button
                key={config.id}
                onClick={() => void startExercise(config)}
                className="rounded-2xl border border-surface-2 bg-surface p-6 text-center font-semibold hover:border-brand-500 transition"
              >
                {t(config.nameKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'loading' && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-full border-4 border-surface-2 border-t-brand-500 animate-spin" />
          <p className="text-ink-soft">{t('formCheck.loadingModel')}</p>
        </div>
      )}

      {stage === 'error' && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-red-400 text-sm max-w-sm">{errorMessage}</p>
          <Button variant="secondary" onClick={handleBack}>
            {t('formCheck.back')}
          </Button>
        </div>
      )}

      {stage === 'ready' && exercise && (
        <div className="mt-5">
          <div className="relative overflow-hidden rounded-2xl bg-black" style={{ transform: 'scaleX(-1)' }}>
            <video ref={videoRef} muted playsInline className="w-full" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          </div>

          {!personVisible && (
            <p className="mt-3 text-center text-sm text-amber-400">{t('formCheck.getInPosition')}</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-soft">{t('formCheck.reps')}</p>
              <p className="text-4xl font-black tabular-nums">{repState.reps}</p>
            </div>
            {feedback && (
              <p className="rounded-full bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-400">{feedback}</p>
            )}
          </div>

          <p className="mt-2 text-xs text-ink-soft">{t('formCheck.practiceNotice')}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold"
            >
              <ArrowLeft size={16} className="rtl:rotate-180" /> {t('formCheck.back')}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold"
            >
              <RotateCcw size={16} /> {t('formCheck.reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FormCheck() {
  return (
    <PremiumGate requires="premium">
      <FormCheckSession />
    </PremiumGate>
  )
}
