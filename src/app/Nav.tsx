import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

const TABS = [
  { to: '/', label: 'Fixtures', icon: '📅' },
  { to: '/standings', label: 'Standings', icon: '📊' },
  { to: '/bracket', label: 'Bracket', icon: '🏆' },
  { to: '/favorites', label: 'Favorites', icon: '⭐' },
] as const;

export function Nav() {
  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏟️</span>
          <span className="font-bold tracking-tight">World Cup 2026</span>
        </div>
        <nav className="hidden gap-1 sm:flex">
          {TABS.map((tab) => (
            <TabLink key={tab.to} {...tab} />
          ))}
        </nav>
        <ThemeToggle />
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'tab-active font-semibold' : 'text-slate-500'
              }`
            }
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand/10 tab-active'
            : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800'
        }`
      }
    >
      {label}
    </NavLink>
  );
}
