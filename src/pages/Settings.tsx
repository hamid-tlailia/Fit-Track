import { Check, Download, LogOut, Trash2, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { PremiumGate } from '@/components/PremiumGate'
import { Card } from '@/components/ui/Card'
import i18n, { type SupportedLanguage, supportedLanguages } from '@/i18n'
import { api } from '@/lib/api'
import { speak } from '@/lib/voice'
import { applyTheme, themes } from '@/lib/themes'
import type { Units, VoiceGender } from '@/store/useAppStore'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

const languageLabels: Record<SupportedLanguage, string> = { en: 'English', ar: 'العربية' }

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const voiceGender = useAppStore((state) => state.voiceGender)
  const setVoiceGender = useAppStore((state) => state.setVoiceGender)
  const voiceEnabled = useAppStore((state) => state.voiceEnabled)
  const setVoiceEnabled = useAppStore((state) => state.setVoiceEnabled)
  const units = useAppStore((state) => state.units)
  const setUnits = useAppStore((state) => state.setUnits)
  const logout = useAuthStore((state) => state.logout)
  const deleteAccount = useAuthStore((state) => state.deleteAccount)

  const [exported, setExported] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleTestVoice() {
    speak(t('settings.testVoiceSample'), {
      lang: i18n.language as SupportedLanguage,
      gender: voiceGender,
    })
  }

  async function handleLogout() {
    await logout()
    navigate('/onboarding')
  }

  async function handleExport() {
    const data = await api.get('/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fitforge-data-export.json'
    link.click()
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 1800)
  }

  async function handleDeleteAccount() {
    await deleteAccount()
    navigate('/onboarding')
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-10 md:pt-10">
      <h1 className="text-2xl font-extrabold">{t('settings.title')}</h1>

      <Card className="mt-5">
        <h2 className="font-bold mb-3">{t('settings.language')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => void i18n.changeLanguage(lang)}
              className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
                i18n.language === lang ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-surface-2'
              }`}
            >
              {languageLabels[lang]}
              {i18n.language === lang && <Check size={16} />}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold mb-3">{t('settings.theme')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((def) => (
            <button
              key={def.id}
              onClick={() => {
                setTheme(def.id)
                applyTheme(def.id)
              }}
              className={`flex flex-col gap-2 rounded-xl border p-3 text-start ${
                theme === def.id ? 'border-brand-500' : 'border-surface-2'
              }`}
            >
              <div
                className="h-8 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${def.swatch[0]}, ${def.swatch[1]})` }}
              />
              <span className="text-sm font-semibold flex items-center justify-between">
                {t(def.nameKey)}
                {theme === def.id && <Check size={15} className="text-brand-400" />}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold mb-3">{t('settings.voiceCoach')}</h2>
        <label className="flex items-center justify-between text-sm mb-3">
          <span>{t('settings.voiceEnabled')}</span>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(event) => setVoiceEnabled(event.target.checked)}
            className="h-5 w-5 accent-[var(--brand-500)]"
          />
        </label>
        <p className="text-sm font-semibold text-ink-soft mb-2">{t('settings.voiceGender')}</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['male', 'female'] as VoiceGender[]).map((gender) => (
            <button
              key={gender}
              onClick={() => setVoiceGender(gender)}
              className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
                voiceGender === gender ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-surface-2'
              }`}
            >
              {t(`settings.${gender}`)}
            </button>
          ))}
        </div>
        <button
          onClick={handleTestVoice}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold"
        >
          <Volume2 size={16} /> {t('settings.testVoice')}
        </button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold mb-3">{t('settings.units')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['metric', 'imperial'] as Units[]).map((unit) => (
            <button
              key={unit}
              onClick={() => setUnits(unit)}
              className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
                units === unit ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-surface-2'
              }`}
            >
              {t(`settings.${unit}`)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold mb-3">{t('settings.account')}</h2>

        <PremiumGate requires="pro" descriptionKey="settings.exportProOnly">
          <button
            onClick={() => void handleExport()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold"
          >
            <Download size={16} /> {exported ? t('settings.exportDone') : t('settings.exportData')}
          </button>
        </PremiumGate>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-400"
        >
          <LogOut size={16} /> {t('settings.logout')}
        </button>

        <div className="mt-4 border-t border-surface-2 pt-4">
          {confirmingDelete ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-soft">{t('settings.deleteAccountConfirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleDeleteAccount()}
                  className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400"
                >
                  {t('settings.deleteAccountConfirmButton')}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-semibold text-ink-soft"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-red-400"
            >
              <Trash2 size={16} /> {t('settings.deleteAccount')}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
