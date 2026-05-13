import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownUp,
  CircleDot,
  Coins,
  Layers,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/Primitives";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency, tokenized } from "@/lib/mock-data";

export const Route = createFileRoute("/market")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Tokenized Market — FlowStone" },
      {
        name: "description",
        content:
          "On-chain settlement layer for registered institutional assets.",
      },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"registry" | "tokenized">("tokenized");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("100");
  const active = tokenized[0];

  return (
    <AppShell>
      <PageHeader
        title={t("market.title")}
        subtitle={t("market.subtitle")}
        actions={
          <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
            {(["registry", "tokenized"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-[4px] px-3.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  mode === m
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CircleDot size={12} />
                {m === "registry"
                  ? t("market.modeRegistry")
                  : t("market.modeTokenized")}
              </button>
            ))}
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Coins size={16} />}
          label={t("kpi.tokenizedAssets")}
          value="$450M"
          trend={{ value: "+1.2%", positive: true }}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label={t("market.stat.vol")}
          value="$28.4M"
        />
        <StatCard
          icon={<Layers size={16} />}
          label={t("market.stat.pairs")}
          value="14"
        />
        <StatCard
          icon={<ArrowDownUp size={16} />}
          label={t("market.stat.settled")}
          value="312"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tokenized.map((tk) => (
          <article
            key={tk.id}
            className="rounded-md border border-border bg-card p-4 transition-colors hover:border-secondary/60"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {tk.symbol}
                </p>
                <h3 className="mt-0.5 font-display font-semibold text-foreground">
                  {tk.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tk.type}
                </p>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
                  tk.settlement === "Live"
                    ? "bg-success/15 text-success ring-success/30"
                    : tk.settlement === "Settling"
                      ? "bg-warning/15 text-warning-foreground/80 ring-warning/30"
                      : "bg-muted text-muted-foreground ring-border"
                }`}
              >
                {tk.settlement}
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("market.tokenPrice")}
                </p>
                <p className="font-display text-xl font-bold tabular-nums text-foreground">
                  ${tk.price.toFixed(2)}
                </p>
              </div>

              <span
                className={`text-xs font-semibold ${
                  tk.change >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {tk.change >= 0 ? "+" : ""}
                {tk.change.toFixed(2)}%
              </span>
            </div>

            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{t("market.supply")}</span>
              <span className="font-mono">{tk.supply}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <SectionCard title={t("market.trade")} className="lg:col-span-4">
          <div className="mb-4 inline-flex w-full items-center rounded-md border border-border bg-muted/30 p-0.5">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`h-8 flex-1 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-colors ${
                  side === s
                    ? s === "buy"
                      ? "bg-success text-success-foreground"
                      : "bg-destructive text-destructive-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t(`market.${s}`)}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("market.asset")}
              </label>

              <div className="mt-1 flex h-10 items-center justify-between rounded-md border border-border bg-card px-3">
                <span className="font-mono text-xs">{active.symbol}</span>
                <span className="text-xs text-muted-foreground">
                  {active.name}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("market.amount")}
              </label>

              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 font-mono"
              />
            </div>

            <div className="flex justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{t("market.total")}</span>
              <span className="font-mono text-foreground">
                {fmtCurrency((Number(amount) || 0) * active.price)}
              </span>
            </div>

            <button
              className={`h-10 w-full rounded-md text-sm font-semibold uppercase tracking-wider transition ${
                side === "buy"
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              } hover:opacity-90`}
            >
              {t("market.placeOrder")}
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title={t("market.orders")}
          className="overflow-hidden lg:col-span-8"
        >
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="whitespace-nowrap border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2 text-start font-semibold">
                    {t("market.table.time")}
                  </th>
                  <th className="px-5 py-2 text-start font-semibold">
                    {t("market.table.side")}
                  </th>
                  <th className="px-5 py-2 text-start font-semibold">
                    {t("market.table.symbol")}
                  </th>
                  <th className="px-5 py-2 text-start font-semibold">
                    {t("market.table.price")}
                  </th>
                  <th className="px-5 py-2 text-start font-semibold">
                    {t("market.table.size")}
                  </th>
                  <th className="px-5 py-2 text-end font-semibold">
                    {t("market.table.status")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border whitespace-nowrap">
                {[
                  {
                    t: "14:42:11",
                    s: "buy",
                    sy: "LCP.UK",
                    p: 1024.4,
                    sz: 250,
                    st: t("market.status.settled"),
                  },
                  {
                    t: "14:39:02",
                    s: "sell",
                    sy: "TGF.V",
                    p: 512.18,
                    sz: 40,
                    st: t("market.status.processing"),
                  },
                  {
                    t: "14:31:48",
                    s: "buy",
                    sy: "GIB.A",
                    p: 98.62,
                    sz: 1200,
                    st: t("market.status.settled"),
                  },
                  {
                    t: "14:18:00",
                    s: "sell",
                    sy: "GLH.EU",
                    p: 318.5,
                    sz: 500,
                    st: t("market.status.pending"),
                  },
                ].map((o, index) => (
                  <tr key={`${o.t}-${index}`} className="hover:bg-muted/40">
                    <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">
                      {o.t}
                    </td>
                    <td
                      className={`px-5 py-2.5 text-xs font-semibold uppercase ${
                        o.s === "buy" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {o.s}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs">{o.sy}</td>
                    <td className="px-5 py-2.5 font-mono tabular-nums">
                      ${o.p.toFixed(2)}
                    </td>
                    <td className="px-5 py-2.5 font-mono tabular-nums">
                      {o.sz.toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 text-end text-xs text-muted-foreground">
                      {o.st}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t("market.portfolio")}>
        <div className="grid grid-cols-2 gap-5 text-sm md:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("market.portfolio.value")}
            </p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums">
              $48.2M
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("market.portfolio.pl")}
            </p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums text-success">
              +$1.18M
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("market.portfolio.holdings")}
            </p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums">
              7
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("market.portfolio.wallets")}
            </p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums">
              3
            </p>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}