import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  Boxes,
  ArrowLeftRight,
  ShieldAlert,
  Coins,
  Download,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/lib/i18n";
import {
  complianceAlerts,
  fmtCurrency,
  tokenized,
  transfers,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AssetFlow Registry" },
      {
        name: "description",
        content: "Institutional RWA dashboard — KPIs, transfers, compliance and tokenized assets.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const recent = transfers.slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <>
            <button className="inline-flex items-center gap-2 h-9 rounded-md border border-border px-3.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition">
              <Download size={14} /> {t("common.export")}
            </button>
            <button className="inline-flex items-center gap-2 h-9 rounded-md bg-secondary px-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground hover:opacity-90 transition">
              <PlusCircle size={14} /> {t("common.registerAsset")}
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Wallet size={16} />}
          label={t("kpi.totalAssets")}
          value="$1.2B"
          trend={{ value: "+4.2%", positive: true }}
        />
        <StatCard
          icon={<Boxes size={16} />}
          label={t("kpi.activeHoldings")}
          value="42"
          hint="across 14 entities"
        />
        <StatCard
          icon={<ArrowLeftRight size={16} />}
          label={t("kpi.pendingTransfers")}
          value="8"
          trend={{ value: "High", positive: false }}
        />
        <StatCard
          icon={<ShieldAlert size={16} />}
          label={t("kpi.complianceCases")}
          value="3"
          hint="2 high severity"
        />
        <StatCard
          icon={<Coins size={16} />}
          label={t("kpi.tokenizedAssets")}
          value="$450M"
          trend={{ value: "37.5%", positive: true }}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <SectionCard title={t("dashboard.allocation")}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <DonutChart />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {[
                  { label: "Real Estate", pct: "45%", val: "$540M", c: "bg-secondary" },
                  { label: "Private Equity", pct: "35%", val: "$420M", c: "bg-navy" },
                  { label: "Debt", pct: "20%", val: "$240M", c: "bg-muted-foreground" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-md bg-muted/40 p-3 ltr:border-l-4 rtl:border-r-4 border-secondary"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {s.label}
                    </p>
                    <p className="font-display font-semibold text-lg text-foreground mt-1">
                      {s.pct}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.val}</p>
                    <div className={`mt-2 h-1 rounded-full ${s.c} opacity-80`} />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t("dashboard.recentTransfers")}
            action={
              <Link
                to="/transfers"
                className="text-xs font-semibold uppercase tracking-wider text-secondary hover:underline inline-flex items-center gap-1"
              >
                {t("common.viewAll")} <ArrowUpRight size={12} />
              </Link>
            }
            className="overflow-hidden"
          >
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-start font-semibold px-5 py-2">{t("transfers.asset")}</th>
                    <th className="text-start font-semibold px-5 py-2">{t("common.type")}</th>
                    <th className="text-start font-semibold px-5 py-2">{t("common.value")}</th>
                    <th className="text-start font-semibold px-5 py-2">{t("common.status")}</th>
                    <th className="text-end font-semibold px-5 py-2">{t("common.time")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{tx.asset}</td>
                      <td className="px-5 py-3 text-muted-foreground">{tx.assetType}</td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">
                        {fmtCurrency(tx.value)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-5 py-3 text-end text-muted-foreground text-xs">
                        {timeAgo(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <SectionCard title={t("dashboard.complianceAlerts")}>
            <ul className="space-y-3">
              {complianceAlerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-md border border-border p-3"
                >
                  <div
                    className={`mt-1 size-2 rounded-full ${
                      a.severity === "high"
                        ? "bg-destructive"
                        : a.severity === "medium"
                          ? "bg-warning"
                          : "bg-muted-foreground"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.entity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("dashboard.registryHealth")}>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Ledger Sync", val: "Healthy", c: "text-success" },
                { label: "KYC Provider", val: "Operational", c: "text-success" },
                { label: "Settlement Net", val: "Degraded", c: "text-warning-foreground/80" },
                { label: "Audit Stream", val: "Healthy", c: "text-success" },
              ].map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0"
                >
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className={`font-semibold ${s.c}`}>{s.val}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title={t("dashboard.tokenizedPreview")}
            action={
              <Link
                to="/market"
                className="text-xs font-semibold uppercase tracking-wider text-secondary hover:underline inline-flex items-center gap-1"
              >
                {t("common.viewAll")} <ArrowUpRight size={12} />
              </Link>
            }
          >
            <ul className="space-y-3">
              {tokenized.slice(0, 3).map((tk) => (
                <li
                  key={tk.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{tk.symbol}</p>
                    <p className="text-foreground font-medium">{tk.name}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-mono tabular-nums text-foreground">
                      ${tk.price.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        tk.change >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {tk.change >= 0 ? "+" : ""}
                      {tk.change.toFixed(2)}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function DonutChart() {
  return (
    <div className="relative size-44">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--color-border)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--color-secondary)" strokeWidth="3" strokeDasharray="45 55" strokeDashoffset="0" />
        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--color-navy)" strokeWidth="3" strokeDasharray="35 65" strokeDashoffset="-45" />
        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--color-muted-foreground)" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="-80" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          TOTAL
        </span>
        <span className="font-display text-xl font-bold text-foreground">$1.2B</span>
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
