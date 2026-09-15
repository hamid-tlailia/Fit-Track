import type { SupportedLanguage } from '@/i18n'
import type { VoiceGender } from '@/store/useAppStore'

/**
 * Thin wrapper around the Web Speech API (SpeechSynthesis).
 * Voice availability and quality depend entirely on the OS/browser's installed
 * TTS voices — there is no way to guarantee a specific "correct" pronunciation
 * or a female Arabic voice on every device. We do best-effort matching by
 * language + a name heuristic for gender, and fail silently if unsupported.
 */

const bcp47ByLanguage: Record<SupportedLanguage, string> = {
  en: 'en-US',
  ar: 'ar-SA',
}

const femaleNameHints = [
  'female', 'zira', 'samantha', 'salma', 'laila', 'hoda', 'amira', 'fatima',
  'tarana', 'hala', 'noor', 'lina', 'reem', 'yasmin', 'aria', 'jenny', 'salli',
]

const maleNameHints = [
  'male', 'david', 'alex', 'fred', 'majed', 'maged', 'tarik', 'hamed', 'naayf',
  'omar', 'khalid', 'guy', 'daniel', 'matthew',
]

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let cachedVoices: SpeechSynthesisVoice[] = []

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([])
  const existing = window.speechSynthesis.getVoices()
  if (existing.length > 0) {
    cachedVoices = existing
    return Promise.resolve(existing)
  }
  return new Promise((resolve) => {
    const handler = () => {
      cachedVoices = window.speechSynthesis.getVoices()
      window.speechSynthesis.removeEventListener('voiceschanged', handler)
      resolve(cachedVoices)
    }
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    setTimeout(() => resolve(cachedVoices), 1500)
  })
}

function scoreVoice(voice: SpeechSynthesisVoice, lang: SupportedLanguage, gender: VoiceGender): number {
  const name = voice.name.toLowerCase()
  const langMatches = voice.lang.toLowerCase().startsWith(lang)
  if (!langMatches) return -1

  const hints = gender === 'female' ? femaleNameHints : maleNameHints
  const genderMatch = hints.some((hint) => name.includes(hint))
  let score = 10
  if (genderMatch) score += 10
  if (voice.lang.toLowerCase() === bcp47ByLanguage[lang].toLowerCase()) score += 2
  if (voice.localService) score += 1
  return score
}

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: SupportedLanguage,
  gender: VoiceGender,
): SpeechSynthesisVoice | undefined {
  const candidates = voices
    .map((voice) => ({ voice, score: scoreVoice(voice, lang, gender) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)
  return candidates[0]?.voice
}

export interface SpeakOptions {
  lang: SupportedLanguage
  gender: VoiceGender
  rate?: number
  pitch?: number
}

export function speak(text: string, options: SpeakOptions): void {
  if (!isSpeechSupported()) return
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(cachedVoices, options.lang, options.gender)
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang ?? bcp47ByLanguage[options.lang]
  utterance.rate = options.rate ?? 1
  utterance.pitch = options.pitch ?? 1
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
