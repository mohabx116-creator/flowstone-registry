import { Bell, HelpCircle, Menu, Moon, Search, Sun, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("flowstone_user");
      if (rawUser) {
        setUser(JSON.parse(rawUser));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "MS";

  const handleLogout = () => {
    localStorage.removeItem("flowstone_token");
    localStorage.removeItem("flowstone_user");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 md:px-6 bg-card/95 backdrop-blur border-b border-border">
      <button
        className="lg:hidden text-muted-foreground hover:text-foreground"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-xl">
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-muted-foreground"
        />
        <input
          type="text"
          placeholder={t("topbar.search")}
          className="w-full h-9 rounded-md bg-muted/60 border border-transparent focus:border-secondary focus:bg-background outline-none text-sm ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 transition-colors"
        />
      </div>

      <div className="flex items-center gap-1 ltr:ml-auto rtl:mr-auto">
        <div className="hidden sm:flex items-center rounded-md border border-border p-0.5 mr-1">
          <button
            onClick={() => setLocale("en")}
            className={`px-2.5 h-7 text-xs font-semibold rounded-[4px] transition-colors ${
              locale === "en"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("ar")}
            className={`px-2.5 h-7 text-xs font-semibold rounded-[4px] transition-colors ${
              locale === "ar"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={locale === "ar"}
          >
            ع
          </button>
        </div>

        <button
          onClick={toggle}
          className="size-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="size-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          aria-label={t("topbar.notifications")}
        >
          <Bell size={18} />
          <span className="absolute top-2 ltr:right-2 rtl:left-2 size-1.5 rounded-full bg-destructive" />
        </button>
        <button
          className="size-9 hidden sm:inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t("topbar.help")}
        >
          <HelpCircle size={18} />
        </button>

        <button
          onClick={handleLogout}
          className="size-9 hidden sm:inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>

        <div className="ltr:ml-2 rtl:mr-2 size-9 rounded-full bg-secondary/20 ring-1 ring-secondary/40 flex items-center justify-center text-foreground text-xs font-bold uppercase">
          {initials}
        </div>
      </div>
    </header>
  );
}
