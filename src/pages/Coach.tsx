import {
  Check,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
  Send,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PremiumGate } from '@/components/PremiumGate'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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

interface QuickAction {
  label: string
  prompt: string
}

function useQuickActions(): QuickAction[] {
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  if (isAr) {
    return [
      { label: 'ابدأ خطة تمرين', prompt: 'أنشئ لي خطة تمرين أسبوعية' },
      { label: 'سجّل السعرات', prompt: 'ساعدني في تسجيل السعرات لليوم' },
      { label: 'اسأل سؤالاً', prompt: 'لدي سؤال عن التغذية والتمارين' },
      { label: 'السجل', prompt: 'اعرض سجل المحادثات السابقة' },
    ]
  }
  return [
    { label: 'Start Workout Plan', prompt: 'Create a workout plan for me' },
    { label: 'Log Calories', prompt: 'Help me log my calories for today' },
    { label: 'Ask Question', prompt: 'I have a question about fitness and nutrition' },
    { label: 'History', prompt: 'Show my conversation history' },
  ]
}

function CoachChat() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const quickActions = useQuickActions()
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

  useEffect(() => {
    api.get<{ conversationId: string | null; messages: ChatMessage[] }>('/ai/coach')
      .then((data) => { setActiveId(data.conversationId); setMessages(data.messages) })
      .catch(() => undefined).finally(() => setLoaded(true))
    refreshConversations()
  }, [])

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  function refreshConversations() {
    api.get<{ conversations: Conversation[] }>('/ai/coach?action=conversations')
      .then((data) => setConversations(data.conversations ?? [])).catch(() => undefined)
  }

  async function openConversation(id: string) {
    setHistoryOpen(false)
    if (id === activeId) return
    setActiveId(id); setMessages([])
    try {
      const data = await api.get<{ conversationId: string | null; messages: ChatMessage[] }>(`/ai/coach?conversationId=${id}`)
      setMessages(data.messages)
    } catch { setError(t('coach.errors.unknown')) }
  }

  async function handleNewChat() {
    setHistoryOpen(false)
    try {
      const data = await api.post<{ conversation: Conversation }>('/ai/coach?action=new')
      setConversations((prev) => [data.conversation, ...(prev ?? [])]); setActiveId(data.conversation.id); setMessages([])
    } catch { setError(t('coach.errors.unknown')) }
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
    const trimmed = text.trim(); if (!trimmed || sending) return
    const wasNew = !activeId
    setError(null); setInput(''); setMessages((prev) => [...prev, { role: 'user', content: trimmed }]); setSending(true)
    try {
      const data = await api.post<{ conversationId: string; reply: ChatMessage }>('/ai/coach', { message: trimmed, conversationId: activeId })
      setActiveId(data.conversationId); setMessages((prev) => [...prev, data.reply]); if (wasNew) refreshConversations()
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'unknown'
      setError(t(`coach.errors.${code}`, { defaultValue: t('coach.errors.unknown') }))
    } finally { setSending(false) }
  }

  async function handleSubmit(e: FormEvent) { e.preventDefault(); await sendMessage(input) }
  async function handleQuick(prompt: string) { await sendMessage(prompt) }

  const lastIsAssistant = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
  const showQuick = lastIsAssistant && !sending && loaded

  return (
    <div className="relative flex h-full flex-col bg-bg">
      {/* Header like screenshot */}
      <div className="shrink-0 border-b border-[var(--line)] bg-white">
        <div className="max-w-[560px] mx-auto w-full flex items-center justify-between px-4 py-3.5">
          <h1 className="text-[18px] font-black tracking-tight">{t('coach.title')}</h1>
          <div className="flex items-center gap-1.5">
            <button onClick={() => void handleNewChat()} aria-label={t('coach.newChat')} className="h-8 w-8 grid place-items-center rounded-full bg-white border border-[var(--line)] text-ink-soft hover:bg-surface-2">
              <Plus size={14} />
            </button>
            <button onClick={() => { refreshConversations(); setHistoryOpen(true) }} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-ink-soft">
              {t('coach.history')}
            </button>
          </div>
        </div>
      </div>

      {/* Top orange pill like screenshot: رفاق إجراءات (upper) */}
      <div className="max-w-[560px] mx-auto w-full px-4 pt-3 flex justify-end">
        <span className="inline-flex items-center rounded-full bg-[#FF6B2D] text-white text-xs font-bold px-3.5 py-1.5 shadow-sm">
          {isAr ? 'رفاق إجراءات' : 'Quick Action'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[560px] mx-auto w-full px-4 py-4 flex flex-col gap-3">
          {loaded && messages.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-white border border-[var(--line)] grid place-items-center mb-3">
                <Sparkles size={22} className="text-brand-500" />
              </div>
              <p className="text-sm font-bold">{t('coach.emptyState')}</p>
              <p className="text-xs text-ink-soft mt-1">{t('coach.disclaimer')}</p>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === 'user'
            const isLast = index === messages.length - 1
            return (
              <div key={index} dir="auto" className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* avatar + bubble like screenshot for assistant */}
                {!isUser && (
                  <div className="flex gap-2 items-start max-w-[92%]">
                    <div className="h-7 w-7 rounded-full bg-surface-2 border border-[var(--line)] grid place-items-center shrink-0 mt-1">
                      <Sparkles size={12} className="text-ink-soft" />
                    </div>
                    <div className="flex-1 rounded-2xl bg-white border border-[var(--line)] px-3.5 py-3 text-[13px] leading-6 shadow-sm">
                      <div className="chat-markdown" dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }} />
                      <p className="text-[11px] text-ink-faint mt-2">19 mars 2025, 11:45 AM</p>
                    </div>
                  </div>
                )}
                {isUser && (
                  <div className="max-w-[82%] rounded-2xl bg-[#FF6B2D] text-white px-4 py-3 text-[13px] leading-6 rounded-br-md shadow-sm">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}

                {isLast && !isUser && showQuick && (
                  <div className="w-full mt-3">
                    <div className="flex justify-end mb-2">
                      <span className="inline-flex items-center rounded-full bg-[#FF6B2D] text-white text-xs font-bold px-3 py-1.5">
                        {isAr ? 'رفاق Quick Action' : 'Quick Action'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((qa) => (
                        <button
                          key={qa.label}
                          onClick={() => void handleQuick(qa.prompt)}
                          className="rounded-full bg-white border border-[var(--line)] px-3.5 py-2 text-xs font-bold text-ink hover:border-brand-500 hover:text-brand-500 transition"
                        >
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {sending && (
            <div className="flex gap-2 items-start">
              <div className="h-7 w-7 rounded-full bg-surface-2 border border-[var(--line)] grid place-items-center shrink-0">
                <Sparkles size={12} className="text-ink-soft" />
              </div>
              <div className="rounded-2xl bg-white border border-[var(--line)] px-4 py-3 text-xs font-bold text-ink-soft shadow-sm flex gap-1 items-center">
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

      <div className="shrink-0 border-t border-[var(--line)] bg-white">
        <form onSubmit={handleSubmit} className="max-w-[560px] mx-auto w-full px-4 py-3 flex gap-2">
          <input
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('coach.placeholder')}
            className="flex-1 rounded-full border border-[var(--line)] bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-brand-500 placeholder:text-ink-faint"
          />
          <button type="submit" disabled={sending || !input.trim()} className="h-10 w-10 grid place-items-center rounded-full bg-[#FF6B2D] text-white disabled:opacity-40 shrink-0">
            <Send size={16} className="rtl:rotate-180 ms-0.5" />
          </button>
        </form>
      </div>

      {historyOpen && (
        <div className={`absolute inset-0 z-50 flex ${isAr ? 'flex-row-reverse' : ''}`}>
          <button type="button" aria-label={t('common.close')} onClick={() => setHistoryOpen(false)} className="flex-1 bg-black/40 backdrop-blur-sm" />
          <div className={`w-[320px] max-w-[82%] bg-white flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.12)] ${isAr ? 'border-e border-[var(--line)] animate-[slide-in-left_0.25s_ease]' : 'border-s border-[var(--line)] animate-[slide-in-right_0.25s_ease]'}`}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
              <h2 className="font-black text-sm">{t('coach.history')}</h2>
              <button onClick={() => setHistoryOpen(false)} className="h-8 w-8 grid place-items-center rounded-full border border-[var(--line)]"><X size={14} /></button>
            </div>
            <button onClick={() => void handleNewChat()} className="m-4 rounded-full bg-brand-500 text-white py-2.5 text-sm font-bold flex items-center justify-center gap-2">
              <Plus size={14} /> {t('coach.newChat')}
            </button>
            <div className="flex-1 overflow-auto p-2">
              {conversations?.length === 0 ? <p className="text-xs text-ink-soft text-center py-6">{t('coach.noConversations')}</p> : conversations?.map((c) => (
                <div key={c.id} className={`flex items-center gap-1 rounded-xl px-2 py-1 ${c.id === activeId ? 'bg-[#FFF0DD]' : ''}`}>
                  {renamingId === c.id ? (
                    <>
                      <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void commitRename(c.id); if (e.key === 'Escape') setRenamingId(null) }} className="flex-1 rounded-full border border-brand-500 px-3 py-1.5 text-sm" />
                      <button onClick={() => void commitRename(c.id)} className="h-7 w-7 grid place-items-center rounded-full bg-brand-500 text-white"><Check size={12} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => void openConversation(c.id)} className="flex-1 text-start truncate px-2 py-2 text-sm font-semibold">{c.title}</button>
                      <button onClick={() => startRename(c)} className="h-7 w-7 grid place-items-center rounded-full hover:bg-surface-2"><Pencil size={12} /></button>
                      <button onClick={() => setPendingDelete(c)} className="h-7 w-7 grid place-items-center rounded-full hover:bg-red-50 text-ink-soft hover:text-red-500"><Trash2 size={12} /></button>
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
  return <PremiumGate requires="premium"><CoachChat /></PremiumGate>
}
