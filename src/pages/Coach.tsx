import {
  Check,
  Dumbbell,
  Flame,
  HeartPulse,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
  Send,
  LoaderCircle,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BackButton } from '@/components/ui/BackButton'
import { PremiumGate } from '@/components/PremiumGate'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError, api } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
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

// Quick-reply chips shown after the coach's latest message — tapping one sends
// its label as the next user message.
const quickActions = [
  { icon: UtensilsCrossed, key: 'mealPlan' },
  { icon: Dumbbell, key: 'adjustWorkout' },
  { icon: HeartPulse, key: 'recovery' },
  { icon: Flame, key: 'motivation' },
] as const

function CoachChat() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
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
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const refreshConversations = useCallback(() => {
    api.get<{ conversations: Conversation[] }>('/ai/coach?action=conversations')
      .then((data) => setConversations(data.conversations ?? []))
      .catch(() => setError(t('coach.errors.load_failed')))
  }, [t])

  useEffect(() => {
    let cancelled = false
    api.get<{ conversationId: string | null; messages: ChatMessage[] }>('/ai/coach')
      .then((data) => { if (!cancelled) { setActiveId(data.conversationId); setMessages(data.messages) } })
      .catch(() => { if (!cancelled) setError(t('coach.errors.load_failed')) })
      .finally(() => { if (!cancelled) setLoaded(true) })
    refreshConversations()
    return () => { cancelled = true }
  }, [t, refreshConversations])

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setHistoryOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [])

  async function openConversation(id: string) {
    if (sending || !loaded) return
    setHistoryOpen(false)
    if (id === activeId) return
    setLoaded(false); setError(null)
    setActiveId(id); setMessages([])
    try {
      const data = await api.get<{ conversationId: string | null; messages: ChatMessage[] }>(`/ai/coach?conversationId=${id}`)
      setMessages(data.messages)
    } catch { setError(t('coach.errors.unknown')) } finally { setLoaded(true) }
  }

  async function handleNewChat() {
    if (sending || !loaded) return
    setLoaded(false); setError(null)
    setHistoryOpen(false)
    try {
      const data = await api.post<{ conversation: Conversation }>('/ai/coach?action=new')
      setConversations((prev) => [data.conversation, ...(prev ?? [])]); setActiveId(data.conversation.id); setMessages([])
    } catch { setError(t('coach.errors.unknown')) } finally { setLoaded(true) }
  }

  function startRename(conversation: Conversation) { setRenamingId(conversation.id); setRenameValue(conversation.title) }
  async function commitRename(id: string) {
    const title = renameValue.trim(); setRenamingId(null); if (!title) return
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, title } : c)) ?? null)
    try { await api.patch('/ai/coach?action=rename', { conversationId: id, title }) } catch { refreshConversations() }
  }
  async function deleteConversation(conversation: Conversation) {
    setPendingDelete(null)
    try { await api.delete(`/ai/coach?conversationId=${conversation.id}`) } catch { setError(t('coach.errors.unknown')); return }
    const remaining = (conversations ?? []).filter((c) => c.id !== conversation.id)
    setConversations(remaining)
    if (conversation.id === activeId) {
      if (remaining[0]) void openConversation(remaining[0].id)
      else { setActiveId(null); setMessages([]) }
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim(); if (!trimmed || sending || !loaded) return
    setError(null); setInput(''); setMessages((prev) => [...prev, { role: 'user', content: trimmed, createdAt: new Date().toISOString() }]); setSending(true)
    try {
      const data = await api.post<{ conversationId: string; reply: ChatMessage }>('/ai/coach', { message: trimmed, conversationId: activeId, language: i18n.language })
      setActiveId(data.conversationId); setMessages((prev) => [...prev, data.reply]); refreshConversations()
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1)); setInput(trimmed)
      refreshConversations()
      const code = err instanceof ApiError ? err.code : 'unknown'
      setError(t(`coach.errors.${code}`, { defaultValue: t('coach.errors.unknown') }))
    } finally { setSending(false) }
  }

  async function handleSubmit(e: FormEvent) { e.preventDefault(); await sendMessage(input) }

  const lastMessage = messages[messages.length - 1]

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-bg">
      {/* Header like screenshot */}
      <div className="shrink-0 border-b border-[var(--line)] bg-surface">
        <div className="max-w-[560px] mx-auto w-full flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2"><BackButton className="" /><h1 className="text-[18px] font-black tracking-tight">{t('coach.title')}</h1></div>
          <div className="flex items-center gap-1.5">
            <button disabled={sending || !loaded} onClick={() => void handleNewChat()} aria-label={t('coach.newChat')} className="h-8 w-8 grid place-items-center rounded-full bg-surface border border-[var(--line)] text-ink-soft hover:bg-surface-2">
              <Plus size={14} />
            </button>
            <button onClick={() => { refreshConversations(); setHistoryOpen(true) }} className="rounded-full border border-[var(--line)] bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft">
              {t('coach.history')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className={`max-w-[560px] mx-auto w-full px-4 py-4 flex flex-col gap-3 ${messages.length === 0 ? 'min-h-full justify-center' : ''}`}>
          {!loaded && <div role="status" className="flex justify-center gap-2 text-ink-soft"><LoaderCircle className="animate-spin" size={18} />{t('common.loading')}</div>}
          {loaded && messages.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-surface border border-[var(--line)] grid place-items-center mb-3">
                <Sparkles size={22} className="text-brand-500" />
              </div>
              <p className="text-sm font-bold">{t('coach.emptyState')}</p>
              <p className="text-xs text-ink-soft mt-1">{t('coach.disclaimer')}</p>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === 'user'
            return (
              <div key={index} dir="auto" className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* avatar + bubble like screenshot for assistant */}
                {!isUser && (
                  <div className="flex gap-2 items-start max-w-[92%]">
                    <div className="h-7 w-7 rounded-full bg-surface-2 border border-[var(--line)] grid place-items-center shrink-0 mt-1">
                      <Sparkles size={12} className="text-ink-soft" />
                    </div>
                    <div className="flex-1 rounded-2xl bg-surface border border-[var(--line)] px-3.5 py-3 text-[13px] leading-6 shadow-sm">
                      <div className="chat-markdown" dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }} />
                      {message.createdAt && <p className="text-[11px] text-ink-faint mt-2">{new Date(message.createdAt).toLocaleString(isAr ? 'ar' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
                    </div>
                  </div>
                )}
                {isUser && (
                  <div className="max-w-[82%] rounded-2xl bg-brand-500 text-white px-4 py-3 text-[13px] leading-6 rounded-br-md shadow-sm">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}

              </div>
            )
          })}

          {/* Quick actions — simple interactive chips after the coach's latest reply */}
          {loaded && !sending && lastMessage?.role === 'assistant' && (
            <div role="group" aria-label={t('coach.quickActionsTitle')} className="flex flex-wrap gap-2 ps-9">
              {quickActions.map(({ icon: Icon, key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => void sendMessage(t(`coach.quickActions.${key}`))}
                  className="flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-600 transition-all hover:border-brand-500 hover:bg-brand-500 hover:text-white active:scale-95"
                >
                  <Icon size={13} strokeWidth={2.2} />
                  {t(`coach.quickActions.${key}`)}
                </button>
              ))}
            </div>
          )}

          {sending && (
            <div className="flex gap-2 items-start">
              <div className="h-7 w-7 rounded-full bg-surface-2 border border-[var(--line)] grid place-items-center shrink-0">
                <Sparkles size={12} className="text-ink-soft" />
              </div>
              <div className="rounded-2xl bg-surface border border-[var(--line)] px-4 py-3 text-xs font-bold text-ink-soft shadow-sm flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.3s]" />
                {t('coach.thinking')}
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {error && <p className="max-w-[560px] mx-auto w-full px-4 pb-2 text-xs font-bold text-red-500">{error}</p>}

      <div className="shrink-0 border-t border-[var(--line)] bg-surface">
        <form onSubmit={handleSubmit} className="max-w-[560px] mx-auto w-full px-4 py-3 flex gap-2">
          <input
            maxLength={8000}
            dir={isAr ? 'rtl' : 'ltr'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('coach.placeholder')}
            className={`flex-1 rounded-full border border-[var(--line)] bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-brand-500 placeholder:text-ink-faint ${isAr ? 'text-right placeholder:text-right' : 'text-left placeholder:text-left'}`}
          />
          <button type="submit" aria-label={t('coach.send')} disabled={sending || !loaded || !input.trim()} className="h-10 w-10 grid place-items-center rounded-full bg-brand-500 text-white disabled:opacity-40 shrink-0">
            <Send size={16} className="rtl:rotate-180 ms-0.5" />
          </button>
        </form>
      </div>

      {historyOpen && (
        <div role="dialog" aria-modal="true" aria-label={t('coach.history')} className="absolute inset-0 z-50">
          <button type="button" aria-label={t('common.close')} onClick={() => setHistoryOpen(false)} className="absolute inset-0 w-full bg-black/40 backdrop-blur-sm" />
          <div
            className={`absolute inset-y-0 ${isAr ? 'right-0 border-l animate-[slide-in-right_0.25s_ease]' : 'left-0 border-r animate-[slide-in-left_0.25s_ease]'} w-[320px] max-w-[82%] bg-surface flex flex-col shadow-2xl border-[var(--line)]`}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
              <h2 className="font-black text-sm">{t('coach.history')}</h2>
              <button onClick={() => setHistoryOpen(false)} className="h-8 w-8 grid place-items-center rounded-full border border-[var(--line)]"><X size={14} /></button>
            </div>
            <button disabled={sending || !loaded} onClick={() => void handleNewChat()} className="m-4 rounded-full bg-brand-500 text-white py-2.5 text-sm font-bold flex items-center justify-center gap-2">
              <Plus size={14} /> {t('coach.newChat')}
            </button>
            <div className="flex-1 overflow-auto p-2">
              {conversations === null ? <p role="status" className="p-4 text-sm">{t('common.loading')}</p> : conversations.length === 0 ? <p className="text-xs text-ink-soft text-center py-6">{t('coach.noConversations')}</p> : conversations?.map((c) => (
                <div key={c.id} className={`flex items-center gap-1 rounded-xl px-2 py-1 ${c.id === activeId ? 'bg-surface-2' : ''}`}>
                  {renamingId === c.id ? (
                    <>
                      <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void commitRename(c.id); if (e.key === 'Escape') setRenamingId(null) }} className="flex-1 rounded-full border border-brand-500 px-3 py-1.5 text-sm" />
                      <button onClick={() => void commitRename(c.id)} className="h-7 w-7 grid place-items-center rounded-full bg-brand-500 text-white"><Check size={12} /></button>
                    </>
                  ) : (
                    <>
                      <button disabled={sending || !loaded} onClick={() => void openConversation(c.id)} className="flex-1 text-start truncate px-2 py-2 text-sm font-semibold">{c.title === 'New chat' ? t('coach.newChat') : c.title}</button>
                      <button aria-label={t('coach.renameChat')} onClick={() => startRename(c)} className="h-7 w-7 grid place-items-center rounded-full hover:bg-surface-2"><Pencil size={12} /></button>
                      <button disabled={sending || !loaded} aria-label={t('coach.deleteChat')} onClick={() => setPendingDelete(c)} className="h-7 w-7 grid place-items-center rounded-full hover:bg-red-50 text-ink-soft hover:text-red-500"><Trash2 size={12} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingDelete && <ConfirmDialog title={t('coach.deleteChat')} message={t('coach.deleteConfirm', { title: pendingDelete.title })} confirmLabel={t('coach.deleteChat')} cancelLabel={t('common.cancel')} danger onConfirm={() => void deleteConversation(pendingDelete)} onCancel={() => setPendingDelete(null)} />}
    </div>
  )
}

export default function Coach() {
  const tier = useAuthStore((state) => state.user?.subscriptionTier ?? 'free')
  return (
    <div className="h-full min-h-0 flex flex-col">
      {tier === 'free' && <div className="max-w-[560px] mx-auto px-4 pt-4 shrink-0"><BackButton /></div>}
      <div className="flex-1 min-h-0 flex flex-col">
        <PremiumGate requires="premium"><CoachChat /></PremiumGate>
      </div>
    </div>
  )
}
