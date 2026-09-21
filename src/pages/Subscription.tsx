import { Check, Crown, Sparkles, Zap, LoaderCircle } from 'lucide-react'
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/Card'
import type { SubscriptionTier } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

const planOrder: SubscriptionTier[] = ['free', 'premium', 'pro']

const planIcon: Record<SubscriptionTier, typeof Sparkles> = {
  free: Zap,
  premium: Sparkles,
  pro: Crown,
}

export default function Subscription() {
  const { t } = useTranslation()
  const tier = useAuthStore((state) => state.user?.subscriptionTier ?? 'free')
  const setSubscriptionTier = useAuthStore((state) => state.setSubscriptionTier)

  const [activating, setActivating] = useState<SubscriptionTier | null>(null)
  const [error, setError] = useState(false)
  const busy = useRef(false)
  async function activate(plan: SubscriptionTier) {
    if (busy.current) return
    busy.current = true
    setActivating(plan); setError(false)
    try { await setSubscriptionTier(plan) }
    catch { setError(true) }
    finally { busy.current = false; setActivating(null) }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 pt-8 pb-10 md:pt-10">
      <h1 className="text-2xl font-extrabold">{t('subscription.title')}</h1>
      <p className="text-ink-soft mt-1">{t('subscription.subtitle')}</p>
      <p className="mt-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs text-ink-soft">
        {t('subscription.demoNotice')}
      </p>

      {error && <p role="alert" className="mt-3 text-sm text-red-500">{t('subscription.activationError')}</p>}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {planOrder.map((plan) => {
          const isCurrent = plan === tier
          const Icon = planIcon[plan]
          const features = t(`subscription.plans.${plan}.features`, { returnObjects: true }) as string[]
          const highlighted = plan === 'premium'

          return (
            <Card
              key={plan}
              className={`flex flex-col gap-4 ${
                highlighted ? 'border-brand-500 ring-1 ring-brand-500/40' : ''
              } ${isCurrent ? 'bg-surface-2/60' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-extrabold">{t(`subscription.plans.${plan}.name`)}</p>
                  <p className="text-sm text-ink-soft">
                    {t(`subscription.plans.${plan}.price`)}
                    {plan !== 'free' && t('subscription.month')}
                    <span className="block mt-1 text-xs font-bold text-brand-500">{t('subscription.freeTrial')}</span>
                  </p>
                </div>
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => void activate(plan)}
                disabled={isCurrent || activating !== null}
                aria-busy={activating === plan}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isCurrent
                    ? 'bg-surface-2 text-ink-soft cursor-default'
                    : 'bg-gradient-to-r from-brand-500 to-brand-600 text-[var(--ink-on-brand)] hover:brightness-110'
                }`}
              >
                {activating === plan && <LoaderCircle size={16} className="animate-spin" />}
                {activating === plan ? t('subscription.activating') : isCurrent ? t('subscription.active') : t('subscription.choose')}
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
