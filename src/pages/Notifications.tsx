import { Bell, BellOff, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BackButton } from '@/components/ui/BackButton'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'

interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export default function Notifications() {
  const { t, i18n } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[] | null>(null)

  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .get<{ notifications: Notification[] }>('/push?action=list')
      .then((data) => {
        if (cancelled) return
        setNotifications(data.notifications)
        if (data.notifications.some((n) => !n.read)) {
          void api.post('/push?action=mark-read').catch(() => undefined)
        }
      })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [attempt])

  const locale = i18n.language === 'ar' ? 'ar' : 'en-US'

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-10 md:pt-10">
      <BackButton />
      <h1 className="text-2xl font-extrabold flex items-center gap-2">
        <Bell size={22} className="text-brand-400" /> {t('notifications.title')}
      </h1>

      {error ? (
        <div role="alert" className="mt-8 text-center text-sm text-ink-soft">
          <p>{t('notifications.loadError')}</p>
          <button onClick={() => { setError(false); setNotifications(null); setAttempt((n) => n + 1) }} className="mt-3 rounded-full bg-brand-500 text-white px-5 py-2">{t('common.retry')}</button>
        </div>
      ) : notifications === null ? (
        <div role="status" className="mt-10 flex flex-col items-center gap-3 text-ink-soft">
          <LoaderCircle size={28} className="animate-spin text-brand-500" />
          <p className="text-sm">{t('notifications.loading')}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center text-ink-soft">
          <BellOff size={32} />
          <p className="text-sm max-w-xs">{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? undefined : 'border-brand-500/40'}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{notification.title}</p>
                {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </div>
              <p className="text-sm text-ink-soft mt-1">{notification.body}</p>
              <p className="text-[11px] text-ink-soft mt-2">
                {new Date(notification.createdAt).toLocaleString(locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
