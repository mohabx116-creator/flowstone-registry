import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ShieldCheck,
  CandlestickChart,
  Settings,
  Database,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
  { to: "/transfers", icon: ArrowLeftRight, key: "nav.transfers" },
  { to: "/holdings/HLD-001", icon: Wallet, key: "nav.holdings" },
  { to: "/market", icon: CandlestickChart, key: "nav.market" },
  { to: "/dashboard", icon: ShieldCheck, key: "nav.compliance" },
  { to: "/dashboard", icon: Database, key: "nav.registry" },
  { to: "/dashboard", icon: Settings, key: "nav.settings" },
] as const;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        dir-aware="true"
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-e border-sidebar-border flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              {t("brand.name")}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/70 mt-1">
              {t("brand.tagline")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground/70 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {items.map(({ to, icon: Icon, key }) => {
            const active =
              pathname === to ||
              (to !== "/dashboard" && pathname.startsWith(to.split("/").slice(0, 2).join("/")));
            return (
              <Link
                key={key + to}
                to={to}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors relative",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 ltr:left-0 rtl:right-0 w-[3px] rounded-full bg-secondary" />
                )}
                <Icon size={18} className="shrink-0" />
                <span>{t(key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-sidebar-border flex items-center gap-3">
          <div className="size-9 rounded-full bg-secondary/30 ring-1 ring-secondary/50 flex items-center justify-center text-white text-sm font-semibold">
            MS
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">Marcus Sterling</p>
            <p className="text-sidebar-foreground/70 text-xs truncate">{t("user.role")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
