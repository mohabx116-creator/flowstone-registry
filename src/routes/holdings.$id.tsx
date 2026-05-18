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

const transferPriorities = ["NORMAL", "HIGH", "URGENT"] as const;
type TransferStep = "details" | "confirm";

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
  const [recipientEmail, setRecipientEmail] = useState("");
  const [priority, setPriority] = useState<TransferPriority>("NORMAL");
  const [step, setStep] = useState<TransferStep>("details");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

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

    const validation = validateTransferRequest(
      units,
      h.units,
      priority,
      recipientEmail,
      t,
    );
    if (!validation.valid) {
      setSubmitError(validation.message);
      return;
    }

    if (h.status === "LOCKED" || h.status === "RELEASED") {
      setSubmitError(t("holding.transfer.error.inactive"));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const tx = await createTransfer({
        holdingId: h.id,
        units: validation.units,
        recipientEmail: validation.recipientEmail,
        priority
      });
      setShowModal(false);
      if (tx.id) {
        navigate({ to: "/transfers/$id", params: { id: tx.id } });
      } else {
        setShowModal(true);
        setStep("confirm");
        setSubmitSuccess(t("holding.transfer.redirectFallback"));
      }
    } catch (err: any) {
      setSubmitError(err.message || t("holding.transfer.error.default"));
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
  const parsedUnits = parseTransferUnits(units);
  const remainingUnits = parsedUnits !== null ? h.units - parsedUnits : null;
  const canSubmitHolding =
    h.units > 0 &&
    (h.status === "ACTIVE" || (h.status !== "LOCKED" && h.status !== "RELEASED"));
  const holdingWarning =
    h.status === "LOCKED" || h.status === "RELEASED"
      ? t("holding.transfer.error.inactive")
      : h.units <= 0
        ? t("holding.transfer.error.unavailable")
      : h.status !== "ACTIVE"
        ? t("holding.transfer.warning.unknownStatus")
        : null;

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
        subtitle={`${t("holding.title")} · ${h.asset?.type || t("common.unknown")}`}
        actions={
          <button 
            onClick={() => {
                setShowModal(true);
                setUnits(String(h.units));
                setRecipientEmail("");
                setPriority("NORMAL");
                setStep("details");
                setSubmitError(null);
                setSubmitSuccess(null);
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
              <Info label={t("holding.eligibility")} value={t("holding.eligible")} />
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
                    <div>
                      <h3 className="font-bold text-foreground">{t("holding.transfer.title")}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("holding.transfer.subtitle")}</p>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setShowModal(false);
                        setRecipientEmail("");
                      }}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
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

                    {submitSuccess && (
                        <div className="p-3 bg-success/10 border border-success/20 text-success text-xs rounded-md flex items-center gap-2">
                            <ShieldCheck size={14} />
                            {submitSuccess}
                        </div>
                    )}

                    {holdingWarning && (
                        <div className="p-3 bg-warning/10 border border-warning/20 text-warning-foreground text-xs rounded-md flex items-center gap-2">
                            <AlertCircle size={14} />
                            {holdingWarning}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
                        <SummaryItem label={t("holding.transfer.asset")} value={h.asset?.name || t("common.unknown")} />
                        <SummaryItem label={t("holding.transfer.holdingId")} value={h.id} mono />
                        <SummaryItem label={t("holding.transfer.availableUnits")} value={h.units.toLocaleString()} mono />
                        <SummaryItem
                          label={t("holding.transfer.remainingUnits")}
                          value={remainingUnits !== null && remainingUnits >= 0 ? remainingUnits.toLocaleString() : t("common.unavailable")}
                          mono
                        />
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className={step === "details" ? "text-foreground" : ""}>{t("holding.transfer.step.details")}</span>
                        <span>/</span>
                        <span className={step === "confirm" ? "text-foreground" : ""}>{t("holding.transfer.step.confirm")}</span>
                    </div>

                    {step === "details" ? (
                      <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("holding.transfer.unitsLabel")}</label>
                            <input 
                                type="text"
                                inputMode="numeric"
                                value={units}
                                onChange={(e) => {
                                  setUnits(e.target.value);
                                  setSubmitError(null);
                                  setSubmitSuccess(null);
                                }}
                                placeholder={t("holding.transfer.unitsPlaceholder")}
                                disabled={submitting || !canSubmitHolding}
                                className="h-10 w-full bg-muted/60 border border-transparent focus:border-secondary focus:bg-background rounded-md px-3 text-sm outline-none transition disabled:opacity-50"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              {t("common.available")}: {h.units.toLocaleString()} {t("common.units")}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("holding.transfer.recipientEmailLabel")}</label>
                            <input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => {
                                  setRecipientEmail(e.target.value);
                                  setSubmitError(null);
                                  setSubmitSuccess(null);
                                }}
                                placeholder={t("holding.transfer.recipientEmailPlaceholder")}
                                disabled={submitting || !canSubmitHolding}
                                className="h-10 w-full bg-muted/60 border border-transparent focus:border-secondary focus:bg-background rounded-md px-3 text-sm outline-none transition disabled:opacity-50"
                            />
                            <p className="text-[10px] leading-relaxed text-muted-foreground">
                              {t("holding.transfer.recipientEmailHelp")}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("holding.transfer.priorityLabel")}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {transferPriorities.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        disabled={submitting || !canSubmitHolding}
                                        onClick={() => {
                                          setPriority(p);
                                          setSubmitError(null);
                                        }}
                                        className={`min-h-9 text-[10px] font-bold uppercase rounded-md border px-2 py-2 transition disabled:opacity-50 ${
                                            priority === p 
                                                ? "bg-secondary text-secondary-foreground border-secondary" 
                                                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {t(`holding.transfer.priority.${p}`)}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] leading-relaxed text-muted-foreground">
                              {t(`holding.transfer.priorityHelp.${priority}`)}
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={submitting || !canSubmitHolding}
                            onClick={() => {
                              const validation = validateTransferRequest(
                                units,
                                h.units,
                                priority,
                                recipientEmail,
                                t,
                              );
                              if (!validation.valid) {
                                setSubmitError(validation.message);
                                return;
                              }
                              setSubmitError(null);
                              setStep("confirm");
                            }}
                            className="w-full h-11 bg-secondary text-secondary-foreground rounded-md font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                        >
                            {t("holding.transfer.continue")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{t("holding.transfer.reviewTitle")}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("holding.transfer.reviewBody")}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <SummaryItem label={t("holding.transfer.unitsLabel")} value={parsedUnits !== null ? parsedUnits.toLocaleString() : t("common.unavailable")} mono />
                            <SummaryItem label={t("holding.transfer.remainingUnits")} value={remainingUnits !== null && remainingUnits >= 0 ? remainingUnits.toLocaleString() : t("common.unavailable")} mono />
                            <SummaryItem label={t("holding.transfer.priorityLabel")} value={t(`holding.transfer.priority.${priority}`)} />
                            <SummaryItem label={t("holding.transfer.recipientConfirmLabel")} value={recipientEmail.trim() || t("common.unavailable")} />
                            <SummaryItem label={t("holding.transfer.holdingId")} value={h.id} mono />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                              type="button"
                              disabled={submitting}
                              onClick={() => setStep("details")}
                              className="h-11 rounded-md border border-border bg-card font-bold uppercase tracking-widest text-xs transition hover:bg-muted disabled:opacity-50"
                          >
                              {t("holding.transfer.back")}
                          </button>
                          <button
                              type="submit"
                              disabled={submitting}
                              className="h-11 bg-secondary text-secondary-foreground rounded-md font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                          >
                              {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                              {submitting ? t("holding.transfer.submitting") : t("holding.transfer.submit")}
                          </button>
                        </div>
                      </>
                    )}
                </form>
            </div>
        </div>
      )}
    </AppShell>
  );
}

function parseTransferUnits(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) return null;

  return parsed;
}

function validateTransferRequest(
  units: string,
  availableUnits: number,
  priority: TransferPriority,
  recipientEmail: string,
  t: (key: string) => string,
):
  | { valid: true; units: number; recipientEmail: string }
  | { valid: false; message: string } {
  const trimmed = units.trim();
  const trimmedRecipientEmail = recipientEmail.trim();

  if (!trimmed) {
    return { valid: false, message: t("holding.transfer.error.required") };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, message: t("holding.transfer.error.wholeNumber") };
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    return { valid: false, message: t("holding.transfer.error.wholeNumber") };
  }

  if (parsed <= 0) {
    return { valid: false, message: t("holding.transfer.error.positive") };
  }

  if (parsed > availableUnits) {
    return { valid: false, message: t("holding.transfer.error.exceedsAvailable") };
  }

  if (!transferPriorities.includes(priority)) {
    return { valid: false, message: t("holding.transfer.error.priority") };
  }

  if (!trimmedRecipientEmail) {
    return {
      valid: false,
      message: t("holding.transfer.error.recipientEmailRequired"),
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipientEmail)) {
    return {
      valid: false,
      message: t("holding.transfer.error.recipientEmailInvalid"),
    };
  }

  return {
    valid: true,
    units: parsed,
    recipientEmail: trimmedRecipientEmail,
  };
}

function SummaryItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-xs font-semibold text-foreground ${
          mono ? "font-mono tabular-nums" : ""
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
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
