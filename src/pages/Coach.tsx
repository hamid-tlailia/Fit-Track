import { Check, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PremiumGate } from '@/components/PremiumGate'
import { ApiError, api } from '@/lib/api'
import { markdownToHtml } from '@/lib/pdf'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

interface Conversation {
  id: string
  title: string
  updatedAt: string
}

function CoachChat() {
  const { t } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api
      .get<{ conversationId: string | null; messages: ChatMessage[] }>('/ai/coach')
      .then((data) => {
        setActiveId(data.conversationId)
        setMessages(data.messages)
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true))
    refreshConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  function refreshConversations() {
    api
      .get<{ conversations: Conversation[] }>('/ai/coach?action=conversations')
      .then((data) => setConversations(data.conversations ?? []))
      .catch(() => undefined)
  }

  async function openConversation(id: string) {
    setHistoryOpen(false)
    if (id === activeId) return
    setActiveId(id)
    setMessages([])
    try {
      const data = await api.get<{ conversationId: string | null; messages: ChatMessage[] }>(
        `/ai/coach?conversationId=${id}`,
      )
      setMessages(data.messages)
    } catch {
      setError(t('coach.errors.unknown'))
    }
  }

  async function handleNewChat() {
    setHistoryOpen(false)
    try {
      const data = await api.post<{ conversation: Conversation }>('/ai/coach?action=new')
      setConversations((prev) => [data.conversation, ...(prev ?? [])])
      setActiveId(data.conversation.id)
      setMessages([])
    } catch {
      setError(t('coach.errors.unknown'))
    }
  }

  function startRename(conversation: Conversation) {
    setRenamingId(conversation.id)
    setRenameValue(conversation.title)
  }

  async function commitRename(id: string) {
    const title = renameValue.trim()
    setRenamingId(null)
    if (!title) return
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, title } : c)) ?? null)
    try {
      await api.patch('/ai/coach?action=rename', { conversationId: id, title })
    } catch {
      refreshConversations()
    }
  }

  async function deleteConversation(conversation: Conversation) {
    if (!window.confirm(t('coach.deleteConfirm', { title: conversation.title }))) return
    try {
      await api.delete(`/ai/coach?conversationId=${conversation.id}`)
    } catch {
      setError(t('coach.errors.unknown'))
      return
    }
    const remaining = (conversations ?? []).filter((c) => c.id !== conversation.id)
    setConversations(remaining)
    if (conversation.id === activeId) {
      if (remaining[0]) {
        void openConversation(remaining[0].id)
      } else {
        setActiveId(null)
        setMessages([])
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    const wasNewConversation = !activeId
    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    try {
      const data = await api.post<{ conversationId: string; reply: ChatMessage }>('/ai/coach', {
        message: text,
        conversationId: activeId,
      })
      setActiveId(data.conversationId)
      setMessages((prev) => [...prev, data.reply])
      if (wasNewConversation) refreshConversations()
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'unknown'
      setError(t(`coach.errors.${code}`, { defaultValue: t('coach.errors.unknown') }))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative flex h-[calc(100dvh-3.75rem-5rem)] flex-col md:h-dvh">
      <div className="flex items-center justify-between border-b border-surface-2 px-5 py-4">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Sparkles size={20} className="text-brand-400" /> {t('coach.title')}
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">{t('coach.disclaimer')}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleNewChat()}
            aria-label={t('coach.newChat')}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-surface-2 hover:text-ink"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              refreshConversations()
              setHistoryOpen(true)
            }}
            aria-label={t('coach.history')}
            className="flex items-center gap-1.5 rounded-full border border-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-surface-2 hover:text-ink"
          >
            {t('coach.history')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loaded && messages.length === 0 && (
          <p className="text-center text-sm text-ink-soft mt-10">{t('coach.emptyState')}</p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <div
              key={index}
              dir="auto"
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm text-start leading-relaxed ${
                message.role === 'user'
                  ? 'self-end bg-gradient-to-r from-brand-500 to-brand-600 text-[var(--ink-on-brand)]'
                  : 'self-start bg-surface-2 text-ink'
              }`}
            >
              {message.role === 'assistant' ? (
                <div
                  className="chat-markdown"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
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
          dir="auto"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('coach.placeholder')}
          className="flex-1 rounded-xl border border-surface-2 bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-[var(--ink-on-brand)] disabled:opacity-50"
        >
          {t('coach.send')}
        </button>
      </form>

      {historyOpen && (
        <div className="absolute inset-0 z-50 flex">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setHistoryOpen(false)}
            className="flex-1 bg-black/50"
          />
          <div className="flex h-full w-72 max-w-[80%] flex-col border-s border-surface-2 bg-surface">
            <div className="flex items-center justify-between border-b border-surface-2 p-4">
              <h2 className="font-bold text-sm">{t('coach.history')}</h2>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label={t('common.close')}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleNewChat()}
              className="mx-4 mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-500/15 px-3 py-2.5 text-sm font-semibold text-brand-400"
            >
              <Plus size={15} /> {t('coach.newChat')}
            </button>
            <div className="flex-1 overflow-y-auto p-2">
              {conversations === null ? null : conversations.length === 0 ? (
                <p className="p-3 text-center text-xs text-ink-soft">{t('coach.noConversations')}</p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group flex items-center gap-1 rounded-xl px-2 py-1 ${
                      conversation.id === activeId ? 'bg-brand-500/10' : ''
                    }`}
                  >
                    {renamingId === conversation.id ? (
                      <>
                        <input
                          dir="auto"
                          autoFocus
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') void commitRename(conversation.id)
                            if (event.key === 'Escape') setRenamingId(null)
                          }}
                          className="flex-1 rounded-lg border border-brand-500/50 bg-surface-2 px-2 py-1.5 text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => void commitRename(conversation.id)}
                          aria-label={t('common.save')}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-brand-400 hover:bg-surface-2"
                        >
                          <Check size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void openConversation(conversation.id)}
                          className="flex-1 truncate rounded-lg px-2 py-2 text-start text-sm font-medium hover:bg-surface-2"
                        >
                          {conversation.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => startRename(conversation)}
                          aria-label={t('coach.renameChat')}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-soft opacity-0 transition group-hover:opacity-100 hover:bg-surface-2 hover:text-ink"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteConversation(conversation)}
                          aria-label={t('coach.deleteChat')}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-soft opacity-0 transition group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
