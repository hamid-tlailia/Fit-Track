import {
  Dumbbell,
  Home,
  LineChart,
  MessageCircle,
  Salad,
  Settings,
  Sparkles,
  User,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

interface NavItem {
  to: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  labelKey: string
  end?: boolean
}

const mainNavItems: NavItem[] = [
  { to: '/', icon: Home, labelKey: 'dashboard', end: true },
  { to: '/workouts', icon: Dumbbell, labelKey: 'workouts' },
  { to: '/nutrition', icon: Salad, labelKey: 'nutrition' },
  { to: '/progress', icon: LineChart, labelKey: 'progress' },
  { to: '/subscription', icon: Sparkles, labelKey: 'subscription' },
]

const secondaryNavItems: NavItem[] = [
  { to: '/coach', icon: MessageCircle, labelKey: 'coach' },
  { to: '/settings', icon: Settings, labelKey: 'settings' },
  { to: '/profile', icon: User, labelKey: 'profile' },
]

export function AppLayout() {
  const { t } = useTranslation()
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.add('app-shell-locked')
    const shell = shellRef.current
    const vv = window.visualViewport
    if (!shell || !vv) return () => document.body.classList.remove('app-shell-locked')
    const sync = () => {
      shell.style.height = `${vv.height}px`
      shell.style.transform = `translateY(${vv.offsetTop}px)`
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      document.body.classList.remove('app-shell-locked')
    }
  }, [])

  return (
    <div ref={shellRef} className="fixed inset-0 h-dvh overflow-hidden bg-bg text-ink flex flex-col md:flex-row">
      {/* Desktop sidebar — warm white */}
      <aside className="hidden md:flex md:w-[270px] md:shrink-0 md:flex-col md:border-e md:border-[var(--line)] md:bg-surface md:p-4 md:gap-1">
        <div className="flex items-center gap-2.5 px-2 py-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-[#FF8C42] grid place-items-center text-white shadow-sm">
            <Dumbbell size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[18px] font-extrabold tracking-tight">{t('app.name')}</span>
        </div>
        <div className="h-px bg-[var(--line)] mx-2 my-1" />
        {mainNavItems.map((item) => (
          <SideNavLink key={item.labelKey} item={item} />
        ))}
        <div className="mt-auto flex flex-col gap-1">
          <div className="h-px bg-[var(--line)] mx-2 my-2" />
          {secondaryNavItems.map((item) => (
            <SideNavLink key={item.labelKey} item={item} />
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-gradient-to-br from-brand-500 to-[#FF8C42] p-4 text-white">
          <p className="text-sm font-extrabold">FitForge Pro</p>
          <p className="text-xs opacity-90 mt-1 leading-relaxed">{t('subscription.subtitle')}</p>
        </div>
      </aside>

      {/* Mobile header — like screenshot: white, light border */}
      <header className="md:hidden shrink-0 flex items-center justify-between bg-surface border-b border-[var(--line)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-[#FF8C42] grid place-items-center text-white">
            <Dumbbell size={14} strokeWidth={2.5} />
          </div>
          <span className="font-extrabold tracking-tight text-[15px]">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/coach"
            className={({ isActive }) =>
              `grid h-8 w-8 place-items-center rounded-full transition-colors ${isActive ? 'bg-brand-500 text-white' : 'text-ink-soft hover:bg-surface-2'}`
            }
            aria-label={t('nav.coach')}
          >
            <MessageCircle size={16} />
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `grid h-8 w-8 place-items-center rounded-full transition-colors ${isActive ? 'bg-brand-500 text-white' : 'text-ink-soft hover:bg-surface-2'}`
            }
            aria-label={t('nav.settings')}
          >
            <Settings size={16} />
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `grid h-8 w-8 place-items-center rounded-full transition-colors ${isActive ? 'bg-brand-500 text-white' : 'text-ink-soft hover:bg-surface-2'}`
            }
            aria-label={t('nav.profile')}
          >
            <User size={16} />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bg">
        <Outlet />
      </main>

      {/* Mobile bottom nav — like screenshot: white, shadow, 5 equal */}
      <nav className="md:hidden shrink-0 border-t border-[var(--line)] bg-surface">
        <div className="grid grid-cols-5">
          {mainNavItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={labelKey}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-brand-500' : 'text-ink-soft'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span>{t(`nav.${labelKey}`)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function SideNavLink({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const { to, icon: Icon, labelKey, end } = item
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-colors ${
          isActive ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
        }`
      }
    >
      <Icon size={18} strokeWidth={2.2} />
      <span>{t(`nav.${labelKey}`)}</span>
    </NavLink>
  )
}
