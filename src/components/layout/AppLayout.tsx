import {
  Dumbbell,
  Home,
  LineChart,
  MessageCircle,
  Salad,
  Settings,
  Sparkles,
  User,
  Crown,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

interface NavItem {
  to: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
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
      {/* Desktop sidebar — luxurious: cream with subtle texture, gold accents */}
      <aside className="hidden md:flex md:w-[286px] md:shrink-0 md:flex-col md:border-e md:border-[var(--line)] md:bg-surface md:p-4 md:gap-1 relative overflow-hidden">
        {/* subtle top glow */}
        <div className="pointer-events-none absolute -top-24 -end-24 h-48 w-48 rounded-full bg-gradient-to-br from-brand-500/10 to-transparent blur-2xl" />
        <div className="flex items-center gap-3 px-2 py-5 relative">
          <div className="h-10 w-10 rounded-[14px] bg-gradient-to-br from-[#FF6B2D] to-[#FF8C42] grid place-items-center text-white shadow-[0_4px_16px_rgba(255,107,45,0.28)] border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
            <Dumbbell size={18} strokeWidth={2.5} className="relative" />
          </div>
          <div>
            <span className="text-[19px] font-black tracking-[-0.02em] flex items-center gap-1">
              {t('app.name')}
              <Crown size={12} className="text-amber-500" />
            </span>
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-ink-faint -mt-0.5 block">ÉLÉGANCE • FITNESS</span>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--line)] to-transparent mx-2 my-2" />
        <nav className="flex flex-col gap-1.5">
          {mainNavItems.map((item) => (
            <SideNavLink key={item.labelKey} item={item} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--line)] to-transparent mx-2 my-3" />
          {secondaryNavItems.map((item) => (
            <SideNavLink key={item.labelKey} item={item} secondary />
          ))}
        </div>
        {/* Luxe Pro card */}
        <div className="mt-4 rounded-[20px] bg-gradient-to-br from-[#1A1816] via-[#2A2420] to-[#FF6B2D] p-[1px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          <div className="rounded-[19px] bg-gradient-to-br from-[#1A1816] to-[#2A211C] p-4 relative text-white">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-brand-500 grid place-items-center"><Crown size={12} className="text-white" /></span>
              <p className="text-sm font-black">FitForge Pro</p>
              <span className="ms-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-white/15 border border-white/20">ÉLITE</span>
            </div>
            <p className="text-xs opacity-80 mt-2 leading-relaxed font-medium">{t('subscription.subtitle')}</p>
            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[68%] bg-gradient-to-r from-amber-400 to-brand-500 rounded-full" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header — luxurious: white with subtle gold bottom border, premium typography */}
      <header className="md:hidden shrink-0 flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-[var(--line)] px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-[11px] bg-gradient-to-br from-[#FF6B2D] to-[#FF8C42] grid place-items-center text-white shadow-[0_4px_12px_rgba(255,107,45,0.28)] border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
            <Dumbbell size={15} strokeWidth={2.5} className="relative" />
          </div>
          <div>
            <span className="font-black tracking-[-0.02em] text-[15px] flex items-center gap-1">{t('app.name')} <Crown size={10} className="text-amber-500" /></span>
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-faint block -mt-0.5">ÉLÉGANCE</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <NavLink
            to="/coach"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-full border transition-all ${isActive ? 'bg-[#FF6B2D] text-white border-[#FF6B2D] shadow-[0_4px_12px_rgba(255,107,45,0.28)]' : 'bg-white border-[var(--line)] text-ink-soft hover:border-amber-500/20'}`
            }
            aria-label={t('nav.coach')}
          >
            <MessageCircle size={16} strokeWidth={2} />
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-full border transition-all ${isActive ? 'bg-[#FF6B2D] text-white border-[#FF6B2D] shadow-[0_4px_12px_rgba(255,107,45,0.28)]' : 'bg-white border-[var(--line)] text-ink-soft hover:border-amber-500/20'}`
            }
            aria-label={t('nav.settings')}
          >
            <Settings size={16} strokeWidth={2} />
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-full border transition-all overflow-hidden ${isActive ? 'border-[#FF6B2D] ring-2 ring-amber-500/20' : 'border-[var(--line)] hover:border-amber-500/20'} bg-white text-ink-soft`
            }
            aria-label={t('nav.profile')}
          >
            <User size={16} strokeWidth={2} />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bg relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent h-32 hidden md:block" />
        <Outlet />
      </main>

      {/* Mobile bottom nav — luxurious floating pill with active orange capsule */}
      <nav className="md:hidden shrink-0 bg-white border-t border-[var(--line)] shadow-[0_-8px_32px_rgba(0,0,0,0.06)] relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {mainNavItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={labelKey}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[11px] font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF6B2D] text-white shadow-[0_4px_16px_rgba(255,107,45,0.28)]'
                    : 'text-ink-soft hover:text-ink'
                }`
              }
            >
              <Icon size={18} strokeWidth={2.2} />
              <span className="tracking-wide">{t(`nav.${labelKey}`)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function SideNavLink({ item, secondary }: { item: NavItem; secondary?: boolean }) {
  const { t } = useTranslation()
  const { to, icon: Icon, labelKey, end } = item
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all ${
          isActive
            ? 'bg-[#FF6B2D] text-white shadow-[0_4px_12px_rgba(255,107,45,0.22)]'
            : secondary
              ? 'text-ink-faint hover:bg-[#FFF0DD] hover:text-ink border border-transparent hover:border-amber-500/10'
              : 'text-ink-soft hover:bg-[#FFF0DD] hover:text-ink border border-transparent hover:border-amber-500/10'
        }`
      }
    >
      <Icon size={18} strokeWidth={2.2} className="transition-transform group-hover:scale-105" />
      <span className="tracking-tight">{t(`nav.${labelKey}`)}</span>
    </NavLink>
  )
}
