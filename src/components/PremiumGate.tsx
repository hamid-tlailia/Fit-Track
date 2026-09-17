import { Lock, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { isPremium, isPro, useAuthStore } from '@/store/useAuthStore'

interface PremiumGateProps {
  children: ReactNode
  requires?: 'premium' | 'pro'
  titleKey?: string
  descriptionKey?: string
}

export function PremiumGate({
  children,
  requires = 'premium',
  titleKey = 'common.premiumOnly',
  descriptionKey,
}: PremiumGateProps) {
  const { t } = useTranslation()
  const tier = useAuthStore((state) => state.user?.subscriptionTier ?? 'free')
  const unlocked = requires === 'pro' ? isPro(tier) : isPremium(tier)

  if (unlocked) return <>{children}</>

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-surface to-surface-2 min-h-[230px]">
      {/* The blurred backdrop stays in normal flow so it still sizes this
          card correctly for tall gated content (e.g. the full-page Coach
          chat) — an absolutely-positioned backdrop can't do that, since it's
          taken out of flow entirely. The min-height above is what actually
          keeps the overlay from being squeezed when the backdrop is short
          (e.g. a one-line Settings toggle row). */}
      <div aria-hidden className="pointer-events-none select-none opacity-30 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-500/20 text-brand-400">
          <Lock size={20} />
        </div>
        <p className="font-bold">{t(titleKey)}</p>
        {descriptionKey && <p className="text-sm text-ink-soft max-w-xs">{t(descriptionKey)}</p>}
        <Link
          to="/subscription"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-[var(--ink-on-brand)]"
        >
          <Sparkles size={16} />
          {t('common.unlock')}
        </Link>
      </div>
    </div>
  )
}
