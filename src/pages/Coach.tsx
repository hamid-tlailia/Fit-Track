import { Sparkles } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PremiumGate } from '@/components/PremiumGate'
import { ApiError, api } from '@/lib/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

function CoachChat() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api
      .get<{ messages: ChatMessage[] }>('/ai/coach')
      .then((data) => setMessages(data.messages))
      .catch(() => undefined)
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    try {
      const data = await api.post<{ reply: ChatMessage }>('/ai/coach', { message: text })
      setMessages((prev) => [...prev, data.reply])
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'unknown'
      setError(t(`coach.errors.${code}`, { defaultValue: t('coach.errors.unknown') }))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-3.75rem-5rem)] flex-col md:h-dvh">
      <div className="border-b border-surface-2 px-5 py-4">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Sparkles size={20} className="text-brand-400" /> {t('coach.title')}
        </h1>
        <p className="text-xs text-ink-soft mt-0.5">{t('coach.disclaimer')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loaded && messages.length === 0 && (
          <p className="text-center text-sm text-ink-soft mt-10">{t('coach.emptyState')}</p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                message.role === 'user'
                  ? 'self-end bg-gradient-to-r from-brand-500 to-brand-600 text-white'
                  : 'self-start bg-surface-2 text-ink'
              }`}
            >
              {message.content}
            </div>
          ))}
          {sending && (
            <div className="self-start rounded-2xl bg-surface-2 px-4 py-2.5 text-sm text-ink-soft">
              {t('coach.thinking')}
            </div>
          )}
        </div>
        <div ref={scrollRef} />
      </div>

      {error && <p className="px-5 pb-2 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-surface-2 p-4">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('coach.placeholder')}
          className="flex-1 rounded-xl border border-surface-2 bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t('coach.send')}
        </button>
      </form>
    </div>
  )
}

export default function Coach() {
  return (
    <PremiumGate requires="premium">
      <CoachChat />
    </PremiumGate>
  )
}
