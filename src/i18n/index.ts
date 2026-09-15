import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import ar from './locales/ar.json'
import en from './locales/en.json'

export const supportedLanguages = ['en', 'ar'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageDirection: Record<SupportedLanguage, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
}

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'fit-track-language',
      caches: ['localStorage'],
    },
  })

export function applyDocumentDirection(lang: string) {
  const supported = (supportedLanguages as readonly string[]).includes(lang)
    ? (lang as SupportedLanguage)
    : 'en'
  document.documentElement.lang = supported
  document.documentElement.dir = languageDirection[supported]
}

i18next.on('languageChanged', applyDocumentDirection)

export default i18next
