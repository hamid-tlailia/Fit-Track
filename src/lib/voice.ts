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

  // "female".includes("male") is true, so a bare substring check on the
  // "male" hint matched female-named voices too (e.g. "Google UK English
  // Female"), and it would often win the tiebreak — male selection kept
  // silently speaking in a female voice. Female matching has no such clash.
  const genderMatch =
    gender === 'female'
      ? femaleNameHints.some((hint) => name.includes(hint))
      : maleNameHints.some((hint) => name.includes(hint)) && !name.includes('female')
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

// Most phones only ship a single system voice per language (often the same
// voice regardless of what name-based matching above picks), so "male" and
// "female" can end up producing byte-identical audio. Nudging the pitch
// keeps the two options audibly different even on a device with no real
// male-sounding voice installed, without distorting a genuinely different
// voice too much when one *is* available.
const genderPitchBias: Record<VoiceGender, number> = { male: -0.18, female: 0.12 }

export function speak(text: string, options: SpeakOptions): void {
  if (!isSpeechSupported()) return
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(cachedVoices, options.lang, options.gender)
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang ?? bcp47ByLanguage[options.lang]
  utterance.rate = options.rate ?? 1
  utterance.pitch = options.pitch ?? Math.min(2, Math.max(0, 1 + genderPitchBias[options.gender]))
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
