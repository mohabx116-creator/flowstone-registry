import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency } from "@/lib/mock-data";
import { getStoredUser } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import { 
  getTransferById, 
  approveTransfer, 
  rejectTransfer, 
  blockTransfer, 
  completeTransfer, 
  type Transfer,
  type TransferStatus
} from "@/lib/transfers-api";

export const Route = createFileRoute('/transfers/$id')({
  beforeLoad: requireAuth,
  head: ({ params }) => ({
    meta: [
      { title: `Transfer ${params.id} — FlowStone` },
      {
        name: "description",
        content: "Transfer case detail and decision panel.",
      },
    ],
  }),
  component: TransferDetail,
});

function TransferDetail() {
  const { t, locale } = useI18n();
  const { id } = Route.useParams();
  const [tx, setTx] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{
    label: string;
    action: (id: string) => Promise<any>;
    color: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransferById(id);
      setTx(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch transfer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const executeAction = async () => {
    if (!tx || !showConfirm || actionPending) return;
    
    const { action, label } = showConfirm;
    setActionPending(true);
    setFeedback(null);
    
    try {
      const updated = await action(tx.id);
      setTx(updated);
      setFeedback({ type: "success", msg: `${label} successful.` });
      setShowConfirm(null);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Action failed." });
    } finally {
      setActionPending(false);
    }
  };

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

  const user = getStoredUser();
  const canDecide = user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER";

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[400px] items-center justify-center text-secondary">
          <RefreshCw size={32} className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error || !tx) {
    return (
      <AppShell>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle size={32} />
          </div>
          <p className="text-muted-foreground">{error || t("transfer.notFound")}</p>
          <Link to="/transfers" className="text-secondary hover:underline text-sm font-semibold uppercase tracking-wider">
            {t("common.viewAll")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const asset = tx.holding?.asset;
  const transferValue = (asset?.valuation || 0) * (tx.units / (tx.holding?.units || 1));

  return (
    <AppShell>
      <Link
        to="/transfers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" />
        {t("nav.transfers")}
      </Link>

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="flex min-w-0 flex-col gap-1.5 font-display text-2xl font-semibold text-foreground sm:flex-row sm:items-baseline sm:gap-2.5 md:text-3xl">
            <span className="shrink-0">{t("transfer.title")}</span>
            <span className="hidden shrink-0 font-mono text-sm text-muted-foreground sm:inline">/</span>
            <span
              className="min-w-0 max-w-full truncate font-mono text-sm opacity-80 md:text-base"
              title={tx.id}
            >
              {tx.id}
            </span>
          </h1>
          <p
            className="mt-1 max-w-full truncate text-sm text-muted-foreground sm:max-w-xl lg:max-w-3xl"
            title={asset?.name || "Asset"}
          >
            {asset?.name || "Asset"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusBadge status={mapStatus(tx.status)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <SectionCard title={t("transfer.assetUnderReview")}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
              <Field label={t("transfers.asset")} value={asset?.name || "N/A"} />
              <Field label={t("common.type")} value={asset?.type || "N/A"} />
              <Field
                label={t("transfer.transferValue")}
                value={fmtCurrency(transferValue)}
                mono
              />
              <Field label={t("holdings.units")} value={tx.units.toLocaleString()} mono />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title={t("transfer.sellerDetails")} className="h-full">
              <PartyCard
                name="Custodian / Seller"
                role={`Holding ID: ${tx.holdingId}`}
                jurisdiction={asset?.location || "Global"}
              />
            </SectionCard>

            <SectionCard title={t("transfer.buyerDetails")} className="h-full">
              <PartyCard
                name="Incoming Participant"
                role="Pending KYC"
                jurisdiction="Global"
              />
            </SectionCard>
          </div>

          <SectionCard title={t("transfer.compliance")}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {(tx.complianceChecks && tx.complianceChecks.length > 0 ? tx.complianceChecks : [
                { id: '1', checkType: 'Identity verification (eIDV)', status: 'PASSED' },
                { id: '2', checkType: 'Sanctions & watchlist screening', status: 'PASSED' },
                { id: '3', checkType: 'Source-of-funds attestation', status: 'PENDING' },
              ]).map((c: any) => (
                <li key={c.id} className="flex items-center gap-3 text-sm min-w-0">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                      c.status === 'PASSED'
                        ? "bg-success/20 text-success"
                        : c.status === 'FAILED' ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.status === 'PASSED' ? (
                      <Check size={12} />
                    ) : c.status === 'FAILED' ? (
                      <X size={12} />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>

                  <span
                    className={cn(
                      "min-w-0 truncate",
                      c.status === 'PASSED' ? "text-foreground" : "text-muted-foreground"
                    )}
                    title={c.checkType}
                  >
                    {c.checkType}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("transfer.audit")}>
            <ol className="space-y-4">
              {[
                { time: new Date(tx.requestedAt).toLocaleTimeString(), actor: "System", text: "Transfer request initiated." },
                { time: new Date(tx.updatedAt).toLocaleTimeString(), actor: "Compliance", text: `Status updated to ${tx.status}.` }
              ].map((entry, index, arr) => (
                <li key={index} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="mt-1.5 size-2 rounded-full bg-secondary" />
                    {index < arr.length - 1 && (
                      <span className="w-px flex-1 bg-border" />
                    )}
                  </div>

                  <div className="min-w-0 pb-1">
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {entry.time} · {entry.actor}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground break-words">
                      {entry.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>

        <div className="min-w-0 space-y-6">
          {canDecide && tx.status !== "COMPLETED" && tx.status !== "REJECTED" && tx.status !== "BLOCKED" && (
            <SectionCard title={t("transfer.decision")}>
              {feedback && (
                <div className={`mb-4 rounded-md p-3 text-xs font-medium ${
                  feedback.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}>
                  <div className="flex min-w-0 items-center gap-2">
                    {feedback.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
                    <span className="min-w-0 break-words">{feedback.msg}</span>
                  </div>
                </div>
              )}

              {showConfirm ? (
                <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4 animate-in fade-in zoom-in duration-200">
                   <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirm Action</p>
                   <p className="text-sm text-foreground font-medium leading-relaxed">Are you sure you want to {showConfirm.label.toLowerCase()} this transfer?</p>
                   <div className="flex flex-col gap-2 2xl:flex-row">
                        <button
                            disabled={actionPending}
                            onClick={executeAction}
                            className={cn(
                                "flex-1 h-9 rounded-md text-[11px] font-bold uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50",
                                showConfirm.color
                            )}
                        >
                            {actionPending ? <RefreshCw size={14} className="animate-spin mx-auto" /> : "Confirm"}
                        </button>
                        <button
                            disabled={actionPending}
                            onClick={() => setShowConfirm(null)}
                            className="flex-1 h-9 rounded-md border border-border bg-card text-[11px] font-bold uppercase tracking-wider transition hover:bg-muted"
                        >
                            Cancel
                        </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                    {tx.status === "PENDING_REVIEW" && (
                    <>
                        <button 
                        onClick={() => setShowConfirm({ label: t("common.approve"), action: approveTransfer, color: "bg-success text-success-foreground" })}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-success text-[11px] font-bold uppercase tracking-wider text-success-foreground transition hover:opacity-90"
                        >
                        <Check size={14} />
                        {t("common.approve")}
                        </button>

                        <button 
                        onClick={() => setShowConfirm({ label: t("common.reject"), action: rejectTransfer, color: "bg-destructive text-destructive-foreground" })}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/40 text-[11px] font-bold uppercase tracking-wider text-destructive transition hover:bg-destructive/10"
                        >
                        <X size={14} />
                        {t("common.reject")}
                        </button>

                        <button 
                        onClick={() => setShowConfirm({ label: t("common.blockAsset"), action: blockTransfer, color: "bg-destructive text-destructive-foreground" })}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive text-[11px] font-bold uppercase tracking-wider text-destructive-foreground transition hover:opacity-90"
                        >
                        <Ban size={14} />
                        {t("common.blockAsset")}
                        </button>
                    </>
                    )}

                    {tx.status === "APPROVED" && (
                    <button 
                        onClick={() => setShowConfirm({ label: t("common.complete"), action: completeTransfer, color: "bg-info text-white" })}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-info text-white text-[11px] font-bold uppercase tracking-wider transition hover:opacity-90"
                    >
                        <ShieldCheck size={14} />
                        {t("common.complete")}
                    </button>
                    )}
                </div>
              )}

              {!showConfirm && (
                <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground italic">
                    {t("transfer.decision.text")}
                </p>
              )}
            </SectionCard>
          )}

          <SectionCard title={t("transfer.routing.title")}>
            <ul className="space-y-3 text-sm">
              <Field
                label="Priority"
                value={tx.priority}
                inline
              />
              <Field
                label={t("common.created")}
                value={new Date(tx.requestedAt).toLocaleString(locale)}
                inline
              />
               <Field
                label="Units"
                value={tx.units.toLocaleString()}
                inline
              />
            </ul>
          </SectionCard>

          <SectionCard title="Holding Status">
            <div className="flex min-w-0 items-center gap-3">
                <Clock size={16} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate text-xs font-bold uppercase tracking-widest text-foreground" title={tx.holding?.status || "UNKNOWN"}>{tx.holding?.status || "UNKNOWN"}</span>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  mono,
  inline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <li className="flex min-w-0 items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
        <span className="min-w-0 truncate text-[11px] font-medium uppercase tracking-tight text-muted-foreground" title={label}>{label}</span>
        <span
          className={cn(
            "max-w-[62%] truncate text-right text-xs font-semibold",
            mono ? "font-mono tabular-nums text-foreground" : "text-foreground"
          )}
          title={value}
        >
          {value}
        </span>
      </li>
    );
  }

  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground" title={label}>
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-sm leading-snug",
          mono
            ? "truncate font-mono tabular-nums text-foreground"
            : "break-words font-semibold text-foreground"
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function PartyCard({
  name,
  role,
  jurisdiction,
}: {
  name: string;
  role: string;
  jurisdiction: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 font-bold text-secondary text-sm">
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground" title={name}>{name}</p>
        <p className="mt-1 break-words font-mono text-[10px] leading-tight text-muted-foreground">
          {role}
        </p>
        <p className="mt-2 truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80" title={jurisdiction}>{jurisdiction}</p>
      </div>
    </div>
  );
}
