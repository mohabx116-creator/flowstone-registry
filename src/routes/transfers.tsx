import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/Primitives";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency, transfers, type TransferStatus } from "@/lib/mock-data";
import { ArrowLeftRight, AlertTriangle, Clock, DollarSign } from "lucide-react";

export const Route = createFileRoute("/transfers")({
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

const statuses: ("all" | TransferStatus)[] = [
  "all",
  "pending",
  "approved",
  "completed",
  "rejected",
  "blocked",
  "expired",
];

function TransfersPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [priority, setPriority] = useState<"all" | "high" | "medium" | "low">("all");

  const filtered = useMemo(() => {
    return transfers.filter((tx) => {
      if (status !== "all" && tx.status !== status) return false;
      if (priority !== "all" && tx.priority !== priority) return false;
      if (
        q &&
        !`${tx.id} ${tx.asset} ${tx.seller} ${tx.buyer}`.toLowerCase().includes(q.toLowerCase())
      )
        return false;
      return true;
    });
  }, [q, status, priority]);

  const open = transfers.filter((t) => t.status === "pending").length;
  const aggValue = transfers.reduce((a, t) => a + t.value, 0);
  const flagged = transfers.filter((t) => t.status === "blocked" || t.priority === "high").length;

  return (
    <AppShell>
      <PageHeader title={t("transfers.title")} subtitle={t("transfers.subtitle")} />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ArrowLeftRight size={16} />}
          label={t("transfers.summary.open")}
          value={String(open)}
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
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-muted-foreground"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("common.search")}
              className="w-full h-9 rounded-md bg-muted/60 border border-transparent focus:border-secondary focus:bg-background outline-none text-sm ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-9 rounded-md border border-border bg-card text-sm px-2.5"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? t("common.all") : t(`status.${s}`)}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="h-9 rounded-md border border-border bg-card text-sm px-2.5"
            >
              {(["all", "high", "medium", "low"] as const).map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? t("common.all") : t(`common.${p}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border whitespace-nowrap">
                <th className="text-start font-semibold px-5 py-3">{t("transfers.id")}</th>
                <th className="text-start font-semibold px-5 py-3">{t("transfers.asset")}</th>
                <th className="text-start font-semibold px-5 py-3">{t("transfers.seller")}</th>
                <th className="text-start font-semibold px-5 py-3">{t("transfers.buyer")}</th>
                <th className="text-start font-semibold px-5 py-3">{t("common.value")}</th>
                <th className="text-start font-semibold px-5 py-3">{t("common.status")}</th>
                <th className="text-start font-semibold px-5 py-3">{t("common.priority")}</th>
                <th className="text-start font-semibold px-5 py-3">{t("common.created")}</th>
                <th className="text-end font-semibold px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border whitespace-nowrap">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{tx.id}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{tx.asset}</td>
                  <td className="px-5 py-3 text-muted-foreground">{tx.seller}</td>
                  <td className="px-5 py-3 text-muted-foreground">{tx.buyer}</td>
                  <td className="px-5 py-3 font-mono tabular-nums">{fmtCurrency(tx.value)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-5 py-3">
                    <PriorityBadge priority={tx.priority} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Link
                      to="/transfers/$id"
                      params={{ id: tx.id }}
                      className="text-xs font-semibold uppercase tracking-wider text-secondary hover:underline"
                    >
                      {t("common.viewDetails")}
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-muted-foreground py-10">
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
