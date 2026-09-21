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
    // Keep indicator visible at 60px during refresh
    setPull(60)
    pullRef.current = 60

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

    const isAtTop = () => {
      // Check both container scroll and window scroll for flexibility
      const containerAtTop = el.scrollTop <= 0
      const windowAtTop = typeof window !== 'undefined' ? window.scrollY <= 0 : true
      // If container is scrollable, rely on container; if not scrollable, rely on window
      const containerScrollable = el.scrollHeight > el.clientHeight
      if (containerScrollable) return containerAtTop
      return containerAtTop && windowAtTop
    }

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      if (isAtTop()) {
        startY = e.touches[0].clientY
        startYRef.current = startY
        isPulling = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling || refreshingRef.current || startYRef.current === null) return
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
          isPulling = false
          startYRef.current = null
          setPull(0)
          pullRef.current = 0
        }
      }
    }

    const onTouchEnd = () => {
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
      className={`relative ${className}`}
      style={{ overscrollBehaviorY: 'contain' as const }}
    >
      {/* Pull indicator */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 flex justify-center"
        style={{
          top: 0,
          height: '60px',
          transform: `translateY(${pull - 60}px)`,
          opacity: pull > 5 || refreshing ? 1 : 0,
          transition: refreshing || pull === 0 ? 'transform 0.22s ease, opacity 0.22s ease' : 'none',
        }}
      >
        <div className="flex flex-col items-center justify-center gap-1 py-2">
          <div
            className="h-8 w-8 rounded-full bg-surface border border-[var(--line)] shadow-sm grid place-items-center"
            style={{
              transform: `rotate(${pull * 2.5}deg)`,
              transition: refreshing ? 'none' : 'transform 0.1s linear',
            }}
          >
            <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''} text-brand-500`} />
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

      {/* Content with pull translation */}
      <div
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
