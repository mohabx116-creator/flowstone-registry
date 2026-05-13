import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeftRight,
  Clock,
  DollarSign,
  Filter,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/Primitives";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency, transfers, type TransferStatus } from "@/lib/mock-data";

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
  const [priority, setPriority] = useState<"all" | "high" | "medium" | "low">(
    "all",
  );

  const filtered = useMemo(() => {
    return transfers.filter((tx) => {
      if (status !== "all" && tx.status !== status) {
        return false;
      }

      if (priority !== "all" && tx.priority !== priority) {
        return false;
      }

      if (
        q &&
        !`${tx.id} ${tx.asset} ${tx.seller} ${tx.buyer}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [q, status, priority]);

  const open = transfers.filter((transfer) => transfer.status === "pending").length;

  const aggValue = transfers.reduce(
    (total, transfer) => total + transfer.value,
    0,
  );

  const flagged = transfers.filter(
    (transfer) =>
      transfer.status === "blocked" || transfer.priority === "high",
  ).length;

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
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-9 rounded-md border border-border bg-card px-2.5 text-sm"
            >
              {statuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption === "all"
                    ? t("common.all")
                    : t(`status.${statusOption}`)}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="h-9 rounded-md border border-border bg-card px-2.5 text-sm"
            >
              {(["all", "high", "medium", "low"] as const).map(
                (priorityOption) => (
                  <option key={priorityOption} value={priorityOption}>
                    {priorityOption === "all"
                      ? t("common.all")
                      : t(`common.${priorityOption}`)}
                  </option>
                ),
              )}
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
                  {t("transfers.seller")}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {t("transfers.buyer")}
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
                <th className="px-5 py-3 text-end font-semibold" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border whitespace-nowrap">
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-muted/40"
                >
                  <td className="px-5 py-3 font-mono text-xs text-foreground">
                    {tx.id}
                  </td>

                  <td className="px-5 py-3 font-medium text-foreground">
                    {tx.asset}
                  </td>

                  <td className="px-5 py-3 text-muted-foreground">
                    {tx.seller}
                  </td>

                  <td className="px-5 py-3 text-muted-foreground">
                    {tx.buyer}
                  </td>

                  <td className="px-5 py-3 font-mono tabular-nums">
                    {fmtCurrency(tx.value)}
                  </td>

                  <td className="px-5 py-3">
                    <StatusBadge status={tx.status} />
                  </td>

                  <td className="px-5 py-3">
                    <PriorityBadge priority={tx.priority} />
                  </td>

                  <td className="px-5 py-3 text-xs text-muted-foreground">
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
                  <td
                    colSpan={9}
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