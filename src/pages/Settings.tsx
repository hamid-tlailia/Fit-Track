import { Activity, Bell, Check, Download, LogOut, Trash2, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { PremiumGate } from '@/components/PremiumGate'
import { Card } from '@/components/ui/Card'
import i18n, { type SupportedLanguage, supportedLanguages } from '@/i18n'
import { api } from '@/lib/api'
import { getCurrentSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push'
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
  const [exporting, setExporting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const redirectStatus = window.location.search.includes('fit=')
    ? new URLSearchParams(window.location.search).get('fit')
    : null
  const redirectReason = redirectStatus ? new URLSearchParams(window.location.search).get('reason') : null

  const [fitConnected, setFitConnected] = useState<boolean | null>(redirectStatus === 'connected' ? true : null)
  const [fitBusy, setFitBusy] = useState(false)
  const [remindersOn, setRemindersOn] = useState<boolean | null>(() => (isPushSupported() ? null : false))
  const [remindersBusy, setRemindersBusy] = useState(false)
  const [remindersError, setRemindersError] = useState<string | null>(null)
  const [fitMessage] = useState<string | null>(() => {
    if (!redirectStatus) return null
    return redirectStatus === 'connected'
      ? t('settings.fitConnected')
      : t(`settings.fitErrors.${redirectReason}`, { defaultValue: t('settings.fitErrors.unknown') })
  })

  useEffect(() => {
    api
      .get<{ connected: boolean }>('/fit?action=steps')
      .then((data) => setFitConnected(data.connected))
      .catch(() => setFitConnected(false))
  }, [])

  useEffect(() => {
    if (redirectStatus) window.history.replaceState(null, '', window.location.pathname)
  }, [redirectStatus])

  useEffect(() => {
    if (!isPushSupported()) return
    getCurrentSubscription()
      .then((sub) => setRemindersOn(sub !== null))
      .catch(() => setRemindersOn(false))
  }, [])

  function handleTestVoice() {
    speak(t('settings.testVoiceSample'), {
      lang: i18n.language as SupportedLanguage,
      gender: voiceGender,
    })
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/onboarding')
    } finally {
      setLoggingOut(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const data = await api.get('/me?export=1')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'fitforge-data-export.json'
      link.click()
      URL.revokeObjectURL(url)
      setExported(true)
      setTimeout(() => setExported(false), 1800)
    } finally {
      setExporting(false)
    }
  }

  function handleConnectFit() {
    window.location.href = '/api/fit?action=authorize'
  }

  async function handleDisconnectFit() {
    setFitBusy(true)
    try {
      await api.delete('/fit?action=disconnect')
      setFitConnected(false)
    } finally {
      setFitBusy(false)
    }
  }

  async function handleToggleReminders() {
    setRemindersBusy(true)
    setRemindersError(null)
    try {
      if (remindersOn) {
        await unsubscribeFromPush()
        setRemindersOn(false)
      } else {
        await subscribeToPush(i18n.language)
        setRemindersOn(true)
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown'
      setRemindersError(t(`settings.remindersErrors.${code}`, { defaultValue: t('settings.remindersErrors.unknown') }))
    } finally {
      setRemindersBusy(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      navigate('/onboarding')
    } finally {
      setDeleting(false)
    }
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
        <h2 className="font-bold mb-3">{t('settings.wearables')}</h2>
        {fitMessage && <p className="mb-3 text-sm text-ink-soft">{fitMessage}</p>}
        <PremiumGate requires="pro" descriptionKey="settings.fitProOnly">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
              <Activity size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t('settings.googleFit')}</p>
              <p className="text-xs text-ink-soft">
                {fitConnected ? t('settings.fitConnectedStatus') : t('settings.fitNotConnected')}
              </p>
            </div>
            {fitConnected ? (
              <button
                onClick={() => void handleDisconnectFit()}
                disabled={fitBusy}
                className="shrink-0 rounded-xl bg-surface-2 px-3.5 py-2 text-sm font-semibold text-ink-soft disabled:opacity-50"
              >
                {fitBusy ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-ink/30 border-t-ink animate-spin" />
                ) : (
                  t('settings.disconnect')
                )}
              </button>
            ) : (
              <button
                onClick={handleConnectFit}
                className="shrink-0 rounded-xl bg-brand-500 px-3.5 py-2 text-sm font-semibold text-[var(--ink-on-brand)]"
              >
                {t('settings.connect')}
              </button>
            )}
          </div>
        </PremiumGate>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold mb-3">{t('settings.reminders')}</h2>
        {remindersError && <p className="mb-3 text-sm text-red-400">{remindersError}</p>}
        <PremiumGate requires="premium" descriptionKey="settings.remindersPremiumOnly">
          {remindersOn === false && !isPushSupported() ? (
            <p className="text-sm text-ink-soft">{t('settings.remindersNotSupported')}</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{t('settings.dailyReminders')}</p>
                <p className="text-xs text-ink-soft">{t('settings.remindersDescription')}</p>
              </div>
              <button
                onClick={() => void handleToggleReminders()}
                disabled={remindersBusy || remindersOn === null}
                aria-label={t('settings.dailyReminders')}
                className={`relative shrink-0 h-7 w-12 rounded-full transition disabled:opacity-50 ${
                  remindersOn ? 'bg-brand-500' : 'bg-surface-2'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                    remindersOn ? 'start-[22px]' : 'start-1'
                  }`}
                />
              </button>
            </div>
          )}
        </PremiumGate>
      </Card>

      <Card className="mt-4">
        <h2 className="font-bold mb-3">{t('settings.account')}</h2>

        <PremiumGate requires="pro" descriptionKey="settings.exportProOnly">
          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {exporting ? (
              <span className="h-4 w-4 rounded-full border-2 border-ink/30 border-t-ink animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exported ? t('settings.exportDone') : t('settings.exportData')}
          </button>
        </PremiumGate>

        <button
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-400 disabled:opacity-50"
        >
          {loggingOut ? (
            <span className="h-4 w-4 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          {t('settings.logout')}
        </button>

        <div className="mt-4 border-t border-surface-2 pt-4">
          {confirmingDelete ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-soft">{t('settings.deleteAccountConfirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleDeleteAccount()}
                  disabled={deleting}
                  className="flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400 disabled:opacity-50"
                >
                  {deleting && <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />}
                  {t('settings.deleteAccountConfirmButton')}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-semibold text-ink-soft disabled:opacity-50"
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
