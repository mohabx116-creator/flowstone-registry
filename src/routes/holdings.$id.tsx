import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowLeft, ShieldCheck, Vote, RefreshCw, AlertCircle, X, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard } from "@/components/Primitives";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { getHoldingById, type Holding } from "@/lib/holdings-api";
import { fmtCurrency } from "@/lib/mock-data";
import { createTransfer, type TransferPriority } from "@/lib/transfers-api";

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
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [h, setH] = useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transfer Modal State
  const [showModal, setShowModal] = useState(false);
  const [units, setUnits] = useState("");
  const [priority, setPriority] = useState<TransferPriority>("NORMAL");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!h) return;

    const unitVal = parseInt(units);
    if (isNaN(unitVal) || unitVal <= 0 || unitVal > h.units) {
      setSubmitError(`Please enter a valid amount (max ${h.units})`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const tx = await createTransfer({
        holdingId: h.id,
        units: unitVal,
        priority
      });
      setShowModal(false);
      // Navigate to the new transfer detail
      navigate({ to: "/transfers/$id", params: { id: tx.id } });
    } catch (err: any) {
      setSubmitError(err.message || "Failed to initiate transfer");
    } finally {
      setSubmitting(false);
    }
  };

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
          <button 
            onClick={() => {
                setShowModal(true);
                setUnits(String(h.units));
                setSubmitError(null);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition hover:opacity-90"
          >
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

      {/* Transfer Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h3 className="font-bold text-foreground">Initiate Ownership Transfer</h3>
                    <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleTransferRequest} className="p-6 space-y-5">
                    {submitError && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-2">
                            <AlertCircle size={14} />
                            {submitError}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Units to Transfer</label>
                        <input 
                            type="number"
                            value={units}
                            onChange={(e) => setUnits(e.target.value)}
                            max={h.units}
                            min={1}
                            required
                            className="h-10 w-full bg-muted/60 border border-transparent focus:border-secondary focus:bg-background rounded-md px-3 text-sm outline-none transition"
                        />
                        <p className="text-[10px] text-muted-foreground">Available: {h.units.toLocaleString()} units</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority Level</label>
                        <div className="grid grid-cols-3 gap-2">
                            {["NORMAL", "HIGH", "URGENT"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p as TransferPriority)}
                                    className={`h-9 text-[10px] font-bold uppercase rounded-md border transition ${
                                        priority === p 
                                            ? "bg-secondary text-secondary-foreground border-secondary" 
                                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-11 bg-secondary text-secondary-foreground rounded-md font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                        >
                            {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                            Confirm Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
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