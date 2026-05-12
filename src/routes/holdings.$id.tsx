import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Vote, Activity } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard } from "@/components/Primitives";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency, holdings } from "@/lib/mock-data";

export const Route = createFileRoute("/holdings/$id")({
  loader: ({ params }) => {
    const h = holdings.find((x) => x.id === params.id);
    if (!h) throw notFound();
    return h;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Holding"} — FlowStone` },
      { name: "description", content: "Holding detail with registry, compliance and governance." },
    ],
  }),
  component: HoldingDetail,
  notFoundComponent: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useI18n();
    return (
      <AppShell>
        <p className="text-muted-foreground">{t("holding.notFound")}</p>
      </AppShell>
    );
  },
});

function HoldingDetail() {
  const { t } = useI18n();
  const h = Route.useLoaderData();

  return (
    <AppShell>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" /> {t("nav.dashboard")}
      </Link>

      <PageHeader
        title={h.name}
        subtitle={`${t("holding.title")} · ${h.type}`}
        actions={
          <button className="inline-flex items-center gap-2 h-9 rounded-md bg-secondary px-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground hover:opacity-90 transition">
            {t("common.requestTransfer")}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <SectionCard title={t("holding.assetInfo")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <Info label={t("holding.registryId")} value={h.registryId} mono />
              <Info label={t("holding.units")} value={h.units.toLocaleString()} mono />
              <Info label={t("common.value")} value={fmtCurrency(h.value)} mono />
              <Info label={t("holding.registryStatus")} value={h.registryStatus} />
              <Info label={t("holding.complianceStatus")} value={h.complianceStatus} />
              <Info label={t("holding.eligibility")} value={h.eligibility} />
            </div>
          </SectionCard>

          <SectionCard title={t("holding.recent")}>
            <ul className="divide-y divide-border">
              {[
                { d: "2025-05-09", t: "Quarterly distribution credited", v: "+$184,200" },
                { d: "2025-05-04", t: "Compliance review passed", v: "" },
                { d: "2025-04-22", t: "Transfer TX-2049-B12 settled", v: "" },
                { d: "2025-04-12", t: "Annual valuation updated", v: "+2.3%" },
              ].map((e, i) => (
                <li key={i} className="flex items-center gap-4 py-3 text-sm">
                  <Activity size={14} className="text-secondary" />
                  <span className="text-muted-foreground text-xs font-mono w-24">{e.d}</span>
                  <span className="flex-1 text-foreground">{e.t}</span>
                  <span className="font-mono tabular-nums text-success text-xs">{e.v}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <SectionCard title={t("holding.audit")}>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-success mt-0.5" />
                <div>
                  <p className="text-foreground font-medium">{t("holding.audit.kycTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("holding.audit.kycSub")}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-success mt-0.5" />
                <div>
                  <p className="text-foreground font-medium">{t("holding.audit.sanctionsTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("holding.audit.sanctionsSub")}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-warning-foreground/80 mt-0.5" />
                <div>
                  <p className="text-foreground font-medium">{t("holding.audit.taxTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("holding.audit.taxSub")}</p>
                </div>
              </li>
            </ul>
          </SectionCard>

          <SectionCard title={t("holding.governance")}>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Vote size={14} className="text-secondary" />
                <span className="flex-1">{t("holding.gov.voting")}</span>
                <span className="font-mono">12,500</span>
              </li>
              <li className="flex items-center gap-3">
                <Vote size={14} className="text-secondary" />
                <span className="flex-1">{t("holding.gov.classA")}</span>
                <span className="font-mono">100%</span>
              </li>
              <li className="flex items-center gap-3">
                <Vote size={14} className="text-secondary" />
                <span className="flex-1">{t("holding.gov.preemption")}</span>
                <span className="font-mono">{t("holding.gov.yes")}</span>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </p>
      <p
        className={`mt-1 ${mono ? "font-mono tabular-nums text-foreground" : "text-foreground font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}
