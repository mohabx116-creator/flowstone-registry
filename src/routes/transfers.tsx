import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeftRight,
  Clock,
  DollarSign,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/Primitives";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency } from "@/lib/mock-data";
import { getTransfers, type Transfer, type TransferStatus, type TransferPriority } from "@/lib/transfers-api";

export const Route = createFileRoute("/transfers")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Registry Transfer Hub — FlowStone" },
      {
        name: "description",
        content: "Review, route and settle institutional ownership transfers.",
      },
    ],
  }),
  component: TransfersPage,
});

const statuses = [
  "all",
  "PENDING_REVIEW",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
  "BLOCKED",
  "EXPIRED",
] as const;

const priorities = ["all", "URGENT", "HIGH", "NORMAL"] as const;

function TransfersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [priority, setPriority] = useState<(typeof priorities)[number]>("all");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransfers();
      setTransfers(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return transfers.filter((tx) => {
      if (status !== "all" && tx.status !== status) {
        return false;
      }

      if (priority !== "all" && tx.priority !== priority) {
        return false;
      }

      const assetName = tx.holding?.asset?.name || "";
      const searchStr = `${tx.id} ${assetName}`.toLowerCase();
      if (q && !searchStr.includes(q.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [transfers, q, status, priority]);

  const mapStatus = (s: TransferStatus): any => {
    switch (s) {
      case "PENDING_REVIEW": return "pending";
      case "APPROVED": return "approved";
      case "REJECTED": return "rejected";
      case "BLOCKED": return "blocked";
      case "EXPIRED": return "expired";
      case "COMPLETED": return "completed";
      default: return "pending";
    }
  };

  const mapPriority = (p: TransferPriority): any => {
    switch (p) {
      case "NORMAL": return "low";
      case "HIGH": return "medium";
      case "URGENT": return "high";
      default: return "low";
    }
  };

  const openCount = transfers.filter((transfer) => transfer.status === "PENDING_REVIEW").length;

  const aggValue = transfers.reduce(
    (total, tx) => total + ((tx.holding?.asset?.valuation || 0) * (tx.units / (tx.holding?.units || 1))),
    0,
  );

  const flagged = transfers.filter(
    (tx) =>
      tx.status === "BLOCKED" || tx.priority === "URGENT",
  ).length;

  if (loading) {
    return (
      <AppShell>
        <PageHeader title={t("transfers.title")} subtitle={t("transfers.subtitle")} />
        <div className="flex min-h-[400px] items-center justify-center text-secondary">
          <RefreshCw size={32} className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader title={t("transfers.title")} subtitle={t("transfers.subtitle")} />
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Error Loading Transfers</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button 
            onClick={fetchData}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition hover:opacity-90"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={t("transfers.title")}
        subtitle={t("transfers.subtitle")}
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<ArrowLeftRight size={16} />}
          label={t("transfers.summary.open")}
          value={String(openCount)}
        />

        <StatCard
          icon={<DollarSign size={16} />}
          label={t("transfers.summary.value")}
          value={fmtCurrency(aggValue)}
        />

        <StatCard
          icon={<Clock size={16} />}
          label={t("transfers.summary.avgTime")}
          value="18h 42m"
        />

        <StatCard
          icon={<AlertTriangle size={16} />}
          label={t("transfers.summary.flagged")}
          value={String(flagged)}
          trend={{ value: "Review", positive: false }}
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

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-9 rounded-md border border-border bg-card px-2.5 text-sm"
            >
              {statuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption === "all"
                    ? t("common.all")
                    : t(`status.${mapStatus(statusOption as any)}`)}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="h-9 rounded-md border border-border bg-card px-2.5 text-sm"
            >
              {priorities.map((priorityOption) => (
                <option key={priorityOption} value={priorityOption}>
                  {priorityOption === "all"
                    ? t("common.all")
                    : t(`common.${mapPriority(priorityOption as any)}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="-mx-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="whitespace-nowrap border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-start font-semibold">
                  {t("transfers.id")}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {t("transfers.asset")}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {t("holdings.units")}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {t("common.value")}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {t("common.status")}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {t("common.priority")}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {t("common.created")}
                </th>
                <th className="sticky right-0 bg-card px-5 py-3 text-end font-semibold shadow-[-12px_0_12px_-8px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border whitespace-nowrap">
              {filtered.map((tx) => {
                const txValue = (tx.holding?.asset?.valuation || 0) * (tx.units / (tx.holding?.units || 1));
                return (
                  <tr
                    key={tx.id}
                    onClick={() => navigate({ to: "/transfers/$id", params: { id: tx.id } })}
                    className="group cursor-pointer transition-colors hover:bg-muted/60"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-foreground">
                      {tx.id}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{tx.holding?.asset?.name || "N/A"}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{tx.holding?.asset?.type || "N/A"}</div>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground font-mono tabular-nums">
                      {tx.units.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 font-mono tabular-nums text-foreground">
                      {fmtCurrency(txValue)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={mapStatus(tx.status)} />
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={mapPriority(tx.priority)} />
                    </td>

                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(tx.requestedAt).toLocaleDateString()}
                    </td>

                    <td className="sticky right-0 bg-card px-5 py-4 text-end shadow-[-12px_0_12px_-8px_rgba(0,0,0,0.1)] group-hover:bg-muted/60 transition-colors">
                      <Link
                        to="/transfers/$id"
                        params={{ id: tx.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center rounded-md bg-secondary/10 px-3 text-[11px] font-bold uppercase tracking-wider text-secondary transition hover:bg-secondary hover:text-white"
                      >
                        {t("common.viewDetails")}
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {t("common.noResults")}
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