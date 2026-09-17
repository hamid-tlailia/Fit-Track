import { Download, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PremiumGate } from '@/components/PremiumGate'
import { ApiError, api } from '@/lib/api'
import { printAsPdf } from '@/lib/pdf'

interface Plan {
  id: string
  type: 'nutrition' | 'training'
  language: string
  content: string
  createdAt: string
}

interface AiPlanCardProps {
  type: 'nutrition' | 'training'
}

export function AiPlanCard({ type }: AiPlanCardProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get<{ plan: Plan | null }>(`/ai/plans?type=${type}`)
      .then((data) => {
        if (!cancelled) setPlan(data.plan)
      })
      .catch(() => {
        if (!cancelled) setPlan(null)
      })
    return () => {
      cancelled = true
    }
  }, [type])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const data = await api.post<{ plan: Plan }>('/ai/plans', { type, language: lang })
      setPlan(data.plan)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'unknown'
      setError(t(`aiPlans.errors.${code}`, { defaultValue: t('aiPlans.errors.unknown') }))
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!plan) return
    printAsPdf(t(`aiPlans.${type}Title`), plan.content, plan.language === 'ar' ? 'ar' : 'en')
  }

  const titleKey = `aiPlans.${type}Title`
  const descriptionKey = `aiPlans.${type}Description`

  return (
    <PremiumGate requires="pro" titleKey={titleKey} descriptionKey="aiPlans.errors.requires_pro">
      <Card>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
            <Sparkles size={17} />
          </div>
          <div>
            <p className="font-bold">{t(titleKey)}</p>
            <p className="text-xs text-ink-soft">{t(descriptionKey)}</p>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {plan === undefined ? null : plan === null ? (
          <div className="mt-4">
            <p className="text-sm text-ink-soft">{t('aiPlans.empty')}</p>
            <Button className="mt-3" onClick={() => void handleGenerate()} loading={generating}>
              <Sparkles size={15} /> {t('aiPlans.generate')}
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-[11px] text-ink-soft mb-3">
              {t('aiPlans.generatedOn', { date: new Date(plan.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US') })}
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleDownload}>
                <Download size={15} /> {t('aiPlans.downloadPdf')}
              </Button>
              <Button variant="secondary" onClick={() => void handleGenerate()} loading={generating}>
                <RefreshCw size={15} />
              </Button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-ink-soft border-t border-surface-2 pt-3">{t('aiPlans.disclaimer')}</p>
      </Card>
    </PremiumGate>
  )
}
