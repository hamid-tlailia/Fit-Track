import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export function BackButton({ className = 'mb-3' }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/')}
      aria-label={t('common.back')}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink shadow-sm transition hover:border-brand-500 hover:text-brand-500 active:scale-95 ${className}`}
    >
      <ArrowLeft size={19} className="rtl:rotate-180" />
    </button>
  )
}
