import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, ShieldCheck, Vote, RefreshCw, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard } from "@/components/Primitives";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { getHoldingById, type Holding } from "@/lib/holdings-api";
import { fmtCurrency } from "@/lib/mock-data";

export const Route = createFileRoute("/holdings/$id")({
  beforeLoad: requireAuth,
  head: ({ params }) => ({
    meta: [
      { title: `Holding ${params.id} — FlowStone` },
      {
        name: "description",
        content: "Holding detail with registry, compliance and governance.",
      },
    ],
  }),
  component: HoldingDetail,
});

function HoldingDetail() {
  const { t } = useI18n();
  const { id } = Route.useParams();
  const [h, setH] = useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHoldingById(id);
      setH(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch holding details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[400px] items-center justify-center text-secondary">
          <RefreshCw size={32} className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error || !h) {
    return (
      <AppShell>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle size={32} />
          </div>
          <p className="text-muted-foreground">{error || t("holding.notFound")}</p>
          <Link to="/holdings" className="text-secondary hover:underline text-sm font-semibold uppercase tracking-wider">
            {t("common.viewAll")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const value = (h.asset?.valuation || 0) * (h.ownershipPercentage / 100);

  return (
    <AppShell>
      <Link
        to="/holdings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" />
        {t("nav.holdings")}
      </Link>

      <PageHeader
        title={h.asset?.name || "Holding"}
        subtitle={`${t("holding.title")} · ${h.asset?.type || "Asset"}`}
        actions={
          <button className="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition hover:opacity-90">
            {t("common.requestTransfer")}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title={t("holding.assetInfo")}>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              <Info label={t("holding.registryId")} value={h.id} mono />
              <Info
                label={t("holding.units")}
                value={h.units.toLocaleString()}
                mono
              />
              <Info label={t("common.value")} value={fmtCurrency(value)} mono />
              <Info
                label={t("holding.registryStatus")}
                value={h.status}
              />
              <Info
                label={t("holding.complianceStatus")}
                value={h.asset?.complianceStatus || "CLEAR"}
              />
              <Info label={t("holding.eligibility")} value="Eligible" />
            </div>
          </SectionCard>

          <SectionCard title={t("holding.recent")}>
            <ul className="divide-y divide-border">
              {[
                {
                  d: new Date(h.acquiredAt).toLocaleDateString(),
                  t: "Ownership stake registered",
                  v: "VERIFIED",
                },
                {
                    d: new Date(h.updatedAt).toLocaleDateString(),
                    t: "Registry record updated",
                    v: "SUCCESS",
                }
              ].map((e, index) => (
                <li
                  key={`${e.d}-${index}`}
                  className="flex items-center gap-4 py-3 text-sm"
                >
                  <Activity size={14} className="text-secondary" />
                  <span className="w-24 font-mono text-xs text-muted-foreground">
                    {e.d}
                  </span>
                  <span className="flex-1 text-foreground">{e.t}</span>
                  <span className="font-mono text-xs tabular-nums text-success">
                    {e.v}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <SectionCard title={t("holding.audit")}>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-0.5 text-success" />
                <div>
                  <p className="font-medium text-foreground">
                    {t("holding.audit.kycTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("holding.audit.kycSub")}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-0.5 text-success" />
                <div>
                  <p className="font-medium text-foreground">
                    {t("holding.audit.sanctionsTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("holding.audit.sanctionsSub")}
                  </p>
                </div>
              </li>
            </ul>
          </SectionCard>

          <SectionCard title={t("holding.governance")}>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Vote size={14} className="text-secondary" />
                <span className="flex-1">{t("holding.gov.voting")}</span>
                <span className="font-mono">ACTIVE</span>
              </li>
              <li className="flex items-center gap-3">
                <Vote size={14} className="text-secondary" />
                <span className="flex-1">{t("holding.gov.classA")}</span>
                <span className="font-mono">YES</span>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 ${
          mono
            ? "font-mono tabular-nums text-foreground"
            : "font-medium text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}