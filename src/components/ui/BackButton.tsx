import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export function BackButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label={t('common.back')}
      className="-ms-2 mb-2 grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-surface-2 hover:text-ink"
    >
      <ArrowLeft size={19} className="rtl:rotate-180" />
    </button>
  )
}
