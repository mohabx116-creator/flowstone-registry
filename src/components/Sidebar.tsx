import { Link, useRouterState } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  CandlestickChart,
  Database,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AuthUser } from '@/lib/auth-api';
import { getStoredUser } from '@/lib/auth-storage';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const items: Array<{
  to: string;
  params?: Record<string, string>;
  icon: React.ElementType;
  key: string;
}> = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/transfers', icon: ArrowLeftRight, key: 'nav.transfers' },
  {
    to: '/holdings',
    icon: Wallet,
    key: 'nav.holdings',
  },
  { to: '/market', icon: CandlestickChart, key: 'nav.market' },
  { to: '/dashboard', icon: ShieldCheck, key: 'nav.compliance' },
  { to: '/dashboard', icon: Database, key: 'nav.registry' },
  { to: '/dashboard', icon: Settings, key: 'nav.settings' },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'FS';

  const displayName = user?.email
    ? user.email.split('@')[0]
    : 'FlowStone User';

  const displayRole = user?.role ?? 'GUEST';

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200',
          open
            ? 'translate-x-0'
            : 'ltr:-translate-x-full rtl:translate-x-full',
          'lg:!translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-5 pb-6 pt-5">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              {t('brand.name')}
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/70">
              {t('brand.tagline')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-sidebar-foreground/70 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
          {items.map(({ to, params, icon: Icon, key }) => {
            const active =
              pathname === to ||
              (to !== '/dashboard' &&
                pathname.startsWith(to.split('/').slice(0, 2).join('/')));

            return (
              <Link
                key={`${key}-${to}`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={to as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params={params as any}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-secondary" />
                )}
                <Icon size={18} className="shrink-0" />
                <span>{t(key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-secondary/30 text-sm font-semibold uppercase text-white ring-1 ring-secondary/50">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {displayRole}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}