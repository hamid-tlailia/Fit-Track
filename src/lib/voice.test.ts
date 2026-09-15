import { describe, expect, it } from 'vitest'

import { pickVoice } from './voice'

function mockVoice(name: string, lang: string, localService = true): SpeechSynthesisVoice {
  return { name, lang, localService, default: false, voiceURI: name } as SpeechSynthesisVoice
}

describe('pickVoice', () => {
  it('never picks a voice in the wrong language', () => {
    const voices = [mockVoice('Amira', 'ar-SA'), mockVoice('David', 'en-US')]
    const picked = pickVoice(voices, 'en', 'male')
    expect(picked?.lang).toBe('en-US')
  })

  it('returns undefined when no voice matches the requested language', () => {
    const voices = [mockVoice('Amira', 'ar-SA')]
    expect(pickVoice(voices, 'en', 'female')).toBeUndefined()
  })

  it('prefers a name matching the requested gender over a same-language mismatch', () => {
    const voices = [mockVoice('David', 'en-US'), mockVoice('Samantha', 'en-US')]
    const picked = pickVoice(voices, 'en', 'female')
    expect(picked?.name).toBe('Samantha')
  })

  it('falls back to any same-language voice when no gender-matching name exists', () => {
    const voices = [mockVoice('Generic Voice', 'en-GB')]
    const picked = pickVoice(voices, 'en', 'female')
    expect(picked?.name).toBe('Generic Voice')
  })

  it('prefers an exact BCP-47 region match over a language-only match', () => {
    const voices = [mockVoice('David', 'en-GB'), mockVoice('David', 'en-US')]
    const picked = pickVoice(voices, 'en', 'male')
    expect(picked?.lang).toBe('en-US')
  })

  it('is case-insensitive on both name hints and language codes', () => {
    const voices = [mockVoice('DAVID', 'EN-us')]
    const picked = pickVoice(voices, 'en', 'male')
    expect(picked?.name).toBe('DAVID')
  })
})
