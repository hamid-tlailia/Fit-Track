import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh?: () => Promise<void> | void
  threshold?: number
  className?: string
  disabled?: boolean
}

// Height of the pull indicator (circular badge + label). The content is held
// at this offset while a refresh is in flight so the badge stays fully visible.
const INDICATOR_HEIGHT = 80

export function PullToRefresh({ children, onRefresh, threshold = 80, className = '', disabled = false }: PullToRefreshProps) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const containerRef = useRef<HTMLDivElement>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)

  pullRef.current = pull
  refreshingRef.current = refreshing

  const triggerRefresh = useCallback(async () => {
    if (refreshingRef.current) return
    setRefreshing(true)
    refreshingRef.current = true
    // Keep indicator fully visible during refresh
    setPull(INDICATOR_HEIGHT)
    pullRef.current = INDICATOR_HEIGHT

    try {
      if (onRefresh) {
        await onRefresh()
      } else {
        // Default behavior: reload the page (or reload data if onRefresh not provided)
        // Small delay for UX feedback
        await new Promise((r) => setTimeout(r, 400))
        window.location.reload()
        return
      }
    } catch (e) {
      console.error('Pull to refresh failed', e)
    } finally {
      // Reset after a short delay to show completion
      setTimeout(() => {
        setRefreshing(false)
        refreshingRef.current = false
        setPull(0)
        pullRef.current = 0
        startYRef.current = null
      }, 400)
    }
  }, [onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el || disabled) return

    let startY = 0
    let isPulling = false
    // If the gesture started inside a nested scrollable region (e.g. the chat
    // message list), that region scrolls first — the page only pulls when the
    // inner region is at its top too.
    let innerScrollable: HTMLElement | null = null

    const findInnerScrollable = (target: EventTarget | null): HTMLElement | null => {
      let node = target instanceof HTMLElement ? target : null
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight) {
          const overflowY = window.getComputedStyle(node).overflowY
          if (overflowY === 'auto' || overflowY === 'scroll') return node
        }
        node = node.parentElement
      }
      return null
    }

    const isAtTop = () => {
      if (innerScrollable && innerScrollable.scrollTop > 0) return false
      // Check both container scroll and window scroll for flexibility
      const containerAtTop = el.scrollTop <= 0
      const windowAtTop = typeof window !== 'undefined' ? window.scrollY <= 0 : true
      // If container is scrollable, rely on container; if not scrollable, rely on window
      const containerScrollable = el.scrollHeight > el.clientHeight
      if (containerScrollable) return containerAtTop
      return containerAtTop && windowAtTop
    }

    const cancelPull = () => {
      isPulling = false
      startYRef.current = null
      setPull(0)
      pullRef.current = 0
    }

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      innerScrollable = findInnerScrollable(e.target)
      if (isAtTop()) {
        startY = e.touches[0].clientY
        startYRef.current = startY
        isPulling = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling || refreshingRef.current || startYRef.current === null) return
      // The inner region won the gesture and started scrolling — cancel the pull.
      if (innerScrollable && innerScrollable.scrollTop > 0) {
        cancelPull()
        return
      }
      const currentY = e.touches[0].clientY
      const diff = currentY - startYRef.current

      if (diff > 0 && isAtTop()) {
        // Prevent native overscroll / browser pull-to-refresh when we are handling it
        if (diff > 10) {
          e.preventDefault()
        }
        // Resistance curve: pull slows down as it goes further
        const resistance = 0.5
        const maxPull = 140
        const calculated = Math.min(diff * resistance, maxPull)
        setPull(calculated)
        pullRef.current = calculated
      } else {
        // If user scrolls up or container scrolled, cancel pulling
        if (diff < 0) {
          cancelPull()
        }
      }
    }

    const onTouchEnd = () => {
      innerScrollable = null
      if (!isPulling) return
      isPulling = false
      const currentPull = pullRef.current
      if (currentPull > threshold) {
        void triggerRefresh()
      } else {
        setPull(0)
        pullRef.current = 0
        startYRef.current = null
      }
    }

    // Use passive: false for touchmove to allow preventDefault
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    // Also support mouse drag for desktop testing (optional)
    let mouseStartY: number | null = null
    let mousePulling = false

    const onMouseDown = (e: MouseEvent) => {
      if (refreshingRef.current) return
      if (el.scrollTop <= 0) {
        mouseStartY = e.clientY
        mousePulling = true
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!mousePulling || mouseStartY === null || refreshingRef.current) return
      const diff = e.clientY - mouseStartY
      if (diff > 0 && el.scrollTop <= 0) {
        const calculated = Math.min(diff * 0.5, 120)
        setPull(calculated)
        pullRef.current = calculated
      }
    }
    const onMouseUp = () => {
      if (!mousePulling) return
      mousePulling = false
      mouseStartY = null
      const currentPull = pullRef.current
      if (currentPull > threshold) {
        void triggerRefresh()
      } else {
        setPull(0)
        pullRef.current = 0
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [threshold, triggerRefresh, disabled])

  const progress = Math.min(pull / threshold, 1)
  const showRelease = pull > threshold

  // Text based on state and language
  let text: string
  if (refreshing) {
    text = isAr ? 'جارٍ التحديث...' : t('common.loading', { defaultValue: 'Refreshing...' })
  } else if (showRelease) {
    text = isAr ? 'اترك للتحديث' : 'Release to refresh'
  } else {
    text = isAr ? 'اسحب للتحديث' : 'Pull to refresh'
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col ${className}`}
      style={{ overscrollBehaviorY: 'contain' as const }}
    >
      {/* Pull indicator */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 flex justify-center"
        style={{
          top: 0,
          height: `${INDICATOR_HEIGHT}px`,
          transform: `translateY(${pull - INDICATOR_HEIGHT}px)`,
          opacity: pull > 5 || refreshing ? 1 : 0,
          transition: refreshing || pull === 0 ? 'transform 0.22s ease, opacity 0.22s ease' : 'none',
        }}
      >
        <div className="flex flex-col items-center justify-center gap-1.5 py-2">
          {/* Circular badge: a white disc ringed by a progress track that fills
              with the brand color as the user pulls, so the icon always sits
              on a clearly visible circular background. */}
          <div
            className="relative grid h-11 w-11 place-items-center rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
            style={{
              background: `conic-gradient(var(--brand-500) ${(refreshing ? 1 : progress) * 360}deg, var(--line) 0deg)`,
            }}
          >
            <div
              className={`absolute inset-[3px] grid place-items-center rounded-full transition-colors duration-150 ${
                showRelease || refreshing ? 'bg-brand-500' : 'bg-surface'
              }`}
            >
              <RefreshCw
                size={17}
                strokeWidth={2.4}
                className={`${refreshing ? 'animate-spin' : ''} ${showRelease || refreshing ? 'text-white' : 'text-brand-500'}`}
                style={{
                  transform: refreshing ? undefined : `rotate(${pull * 2.5}deg)`,
                  transition: refreshing || pull === 0 ? 'transform 0.2s ease' : 'none',
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-ink-soft tracking-wide">{text}</span>
            {!refreshing && (
              <span className="text-[10px] font-black text-brand-500">
                {Math.round(progress * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content with pull translation. flex-1 lets full-height pages (e.g. the
          coach chat) pin their own header/input while the page scrolls. */}
      <div
        className="flex-1"
        style={{
          transform: `translateY(${pull}px)`,
          transition: refreshing || pull === 0 ? 'transform 0.22s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
