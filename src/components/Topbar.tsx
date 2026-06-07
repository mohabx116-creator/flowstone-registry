import {
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { AuthUser } from '@/lib/auth-api';
import { clearStoredAuth, getStoredUser } from '@/lib/auth-storage';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'FS';

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('flowstone_demo_logout', 'true');
    }
    clearStoredAuth();
    setUser(null);
    navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <button
        className="text-muted-foreground hover:text-foreground lg:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="relative max-w-xl flex-1">
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3"
        />
        <input
          type="text"
          placeholder={t('topbar.search')}
          className="h-9 w-full rounded-md border border-transparent bg-muted/60 text-sm outline-none transition-colors focus:border-secondary focus:bg-background ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9"
        />
      </div>

      <div className="flex items-center gap-1 ltr:ml-auto rtl:mr-auto">
        <div className="mr-1 hidden items-center rounded-md border border-border p-0.5 sm:flex">
          <button
            onClick={() => setLocale('en')}
            className={`h-7 rounded-[4px] px-2.5 text-xs font-semibold transition-colors ${locale === 'en'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
              }`}
            aria-pressed={locale === 'en'}
          >
            EN
          </button>
          <button
            onClick={() => setLocale('ar')}
            className={`h-7 rounded-[4px] px-2.5 text-xs font-semibold transition-colors ${locale === 'ar'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
              }`}
            aria-pressed={locale === 'ar'}
          >
            ع
          </button>
        </div>

        <button
          onClick={toggle}
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t('topbar.notifications')}
        >
          <Bell size={18} />
          <span className="absolute top-2 size-1.5 rounded-full bg-destructive ltr:right-2 rtl:left-2" />
        </button>

        <button
          className="hidden size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          aria-label={t('topbar.help')}
        >
          <HelpCircle size={18} />
        </button>

        <button
          onClick={handleLogout}
          className="hidden size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>

        {import.meta.env.VITE_DEMO_AUTO_LOGIN === 'true' && (
          <span className="hidden rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary border border-secondary/20 sm:inline-block ltr:ml-2 rtl:mr-2">
            Demo Active
          </span>
        )}

        <div className="flex size-9 items-center justify-center rounded-full bg-secondary/20 text-xs font-bold uppercase text-foreground ring-1 ring-secondary/40 ltr:ml-2 rtl:mr-2">
          {initials}
        </div>
      </div>
    </header>
  );
}