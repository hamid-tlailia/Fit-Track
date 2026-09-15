import {
  Dumbbell,
  Home,
  LineChart,
  Salad,
  Settings,
  Sparkles,
  User,
} from 'lucide-react'
import type { ComponentType } from 'react'
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
  { to: '/settings', icon: Settings, labelKey: 'settings' },
  { to: '/profile', icon: User, labelKey: 'profile' },
]

export function AppLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-e md:border-surface-2 md:bg-surface md:p-4 md:gap-1">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center text-white">
            <Dumbbell size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-extrabold tracking-tight">{t('app.name')}</span>
        </div>
        {mainNavItems.map((item) => (
          <SideNavLink key={item.labelKey} item={item} />
        ))}
        <div className="mt-auto flex flex-col gap-1">
          {secondaryNavItems.map((item) => (
            <SideNavLink key={item.labelKey} item={item} />
          ))}
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between border-b border-surface-2 bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent grid place-items-center text-white">
            <Dumbbell size={14} strokeWidth={2.5} />
          </div>
          <span className="font-extrabold tracking-tight">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-full transition-colors ${
                isActive ? 'bg-brand-500/15 text-brand-400' : 'text-ink-soft hover:bg-surface-2'
              }`
            }
            aria-label={t('nav.settings')}
          >
            <Settings size={18} />
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-full transition-colors ${
                isActive ? 'bg-brand-500/15 text-brand-400' : 'text-ink-soft hover:bg-surface-2'
              }`
            }
            aria-label={t('nav.profile')}
          >
            <User size={18} />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-surface-2 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="grid grid-cols-5">
          {mainNavItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={labelKey}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand-400' : 'text-ink-soft'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.25} />
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
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive ? 'bg-brand-500/15 text-brand-400' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
        }`
      }
    >
      <Icon size={19} strokeWidth={2.25} />
      <span>{t(`nav.${labelKey}`)}</span>
    </NavLink>
  )
}
