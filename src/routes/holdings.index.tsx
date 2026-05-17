import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  Wallet, 
  Search, 
  Filter, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  Layout
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { getHoldings, getMyHoldings, type Holding } from "@/lib/holdings-api";
import { getStoredUser } from "@/lib/auth-storage";
import { fmtCurrency } from "@/lib/mock-data";

export const Route = createFileRoute("/holdings/")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Portfolio Holdings — FlowStone" },
      {
        name: "description",
        content: "Manage and monitor your registered asset positions.",
      },
    ],
  }),
  component: HoldingsPage,
});

function HoldingsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      const isPrivileged = user?.role === 'ADMIN' || user?.role === 'COMPLIANCE_OFFICER';
      const data = await (isPrivileged ? getHoldings() : getMyHoldings());
      setHoldings(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch holdings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return holdings.filter((h) => {
      const assetName = h.asset?.name || "";
      const assetId = h.assetId || "";
      const searchStr = `${assetName} ${assetId} ${h.id}`.toLowerCase();
      return searchStr.includes(q.toLowerCase());
    });
  }, [holdings, q]);

  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
        const val = h.asset?.valuation || 0;
        return sum + (val * (h.ownershipPercentage / 100));
    }, 0);
  }, [holdings]);

  const mapStatus = (status: string): any => {
    switch (status) {
      case 'ACTIVE': return 'completed';
      case 'LOCKED': return 'pending';
      case 'RELEASED': return 'expired';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader title={t("holdings.title")} subtitle={t("holdings.subtitle")} />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin text-secondary" />
            <p className="text-sm text-muted-foreground">{t("holding.loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader title={t("holdings.title")} subtitle={t("holdings.subtitle")} />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertCircle size={32} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t("holding.errorTitle")}</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <button 
              onClick={fetchData}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition hover:opacity-90"
            >
              <RefreshCw size={14} />
              {t("common.retry")}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title={t("holdings.title")} subtitle={t("holdings.subtitle")} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={<Wallet size={16} />}
          label={t("holdings.summary.totalValue")}
          value={fmtCurrency(totalValue)}
        />
        <StatCard
          icon={<Layout size={16} />}
          label={t("holdings.summary.activeHoldings")}
          value={String(holdings.length)}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label={t("holdings.summary.pendingActions")}
          value="0"
          trend={{ value: t("dashboard.health.healthy"), positive: true }}
        />
      </section>

      <SectionCard className="overflow-hidden">
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute top-1/2 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("common.search")}
              className="h-9 w-full rounded-md border border-transparent bg-muted/60 text-sm outline-none focus:border-secondary focus:bg-background ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <button className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium">
              {t("common.filter")}
            </button>
          </div>
        </div>

        <div className="-mx-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="whitespace-nowrap border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-start font-semibold">{t("holding.registryId")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("holdings.asset")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("holdings.units")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("holdings.ownership")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("common.value")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("common.status")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("holdings.acquired")}</th>
                <th className="px-5 py-3 text-end font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border whitespace-nowrap">
              {filtered.map((h) => {
                const value = (h.asset?.valuation || 0) * (h.ownershipPercentage / 100);
                return (
                  <tr
                    key={h.id}
                    onClick={() => navigate({ to: "/holdings/$id", params: { id: h.id } })}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-foreground">{h.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-foreground">{h.asset?.name || t("common.unknown")}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{h.asset?.type || t("common.unknown")}</div>
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-muted-foreground">
                      {h.units.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums">
                      {h.ownershipPercentage}%
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-foreground font-medium">
                      {fmtCurrency(value)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={mapStatus(h.status)} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(h.acquiredAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-end">
                      <Link
                        to="/holdings/$id"
                        params={{ id: h.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold uppercase tracking-wider text-secondary hover:underline"
                      >
                        {t("common.viewDetails")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Wallet size={32} className="text-muted-foreground/30" />
                      <p className="text-muted-foreground">{t("common.noResults")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
