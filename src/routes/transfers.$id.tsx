import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  Check,
  Download,
  FileText,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency } from "@/lib/mock-data";
import { getStoredUser } from "@/lib/auth-storage";
import { 
  getTransferById, 
  approveTransfer, 
  rejectTransfer, 
  blockTransfer, 
  completeTransfer, 
  type Transfer,
  type TransferStatus
} from "@/lib/transfers-api";

export const Route = createFileRoute("/transfers/$id")({
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

  const handleAction = async (action: (id: string) => Promise<any>) => {
    if (!tx || actionPending) return;
    setActionPending(true);
    try {
      const updated = await action(tx.id);
      setTx(updated);
    } catch (err: any) {
      alert(err.message || "Action failed");
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

      <PageHeader
        title={`${t("transfer.title")} · ${tx.id}`}
        subtitle={asset?.name || "Asset"}
        actions={<StatusBadge status={mapStatus(tx.status)} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title={t("transfer.assetUnderReview")}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SectionCard title={t("transfer.sellerDetails")}>
              <PartyCard
                name="Custodian / Seller"
                role={`Holding ID: ${tx.holdingId}`}
                jurisdiction={asset?.location || "Global"}
              />
            </SectionCard>

            <SectionCard title={t("transfer.buyerDetails")}>
              <PartyCard
                name="Incoming Participant"
                role="Pending KYC"
                jurisdiction="Global"
              />
            </SectionCard>
          </div>

          <SectionCard title={t("transfer.compliance")}>
            <ul className="space-y-3">
              {(tx.complianceChecks && tx.complianceChecks.length > 0 ? tx.complianceChecks : [
                { id: '1', checkType: 'Identity verification (eIDV)', status: 'PASSED' },
                { id: '2', checkType: 'Sanctions & watchlist screening', status: 'PASSED' },
                { id: '3', checkType: 'Source-of-funds attestation', status: 'PENDING' },
              ]).map((c: any) => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full ${
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
                    className={
                      c.status === 'PASSED' ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {c.checkType}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("transfer.documents")}>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                "Ownership Certificate.pdf",
                "Compliance Attestation.pdf",
              ].map((fileName) => (
                <li
                  key={fileName}
                  className="flex items-center gap-3 rounded-md border border-border p-3"
                >
                  <FileText size={16} className="text-secondary" />
                  <span className="flex-1 truncate text-sm">{fileName}</span>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Download ${fileName}`}
                  >
                    <Download size={14} />
                  </button>
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
                  <div className="flex flex-col items-center">
                    <span className="mt-1.5 size-2 rounded-full bg-secondary" />
                    {index < arr.length - 1 && (
                      <span className="w-px flex-1 bg-border" />
                    )}
                  </div>

                  <div className="pb-1">
                    <p className="font-mono text-xs text-muted-foreground">
                      {entry.time} · {entry.actor}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">
                      {entry.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          {canDecide && tx.status !== "COMPLETED" && tx.status !== "REJECTED" && tx.status !== "BLOCKED" && (
            <SectionCard title={t("transfer.decision")}>
              <div className="space-y-2.5">
                {tx.status === "PENDING_REVIEW" && (
                  <>
                    <button 
                      disabled={actionPending}
                      onClick={() => handleAction(approveTransfer)}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-success text-sm font-semibold text-success-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                      {actionPending ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                      {t("common.approve")}
                    </button>

                    <button 
                      disabled={actionPending}
                      onClick={() => handleAction(rejectTransfer)}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {actionPending ? <RefreshCw size={16} className="animate-spin" /> : <X size={16} />}
                      {t("common.reject")}
                    </button>

                    <button 
                      disabled={actionPending}
                      onClick={() => handleAction(blockTransfer)}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                      {actionPending ? <RefreshCw size={16} className="animate-spin" /> : <Ban size={16} />}
                      {t("common.blockAsset")}
                    </button>
                  </>
                )}

                {tx.status === "APPROVED" && (
                  <button 
                    disabled={actionPending}
                    onClick={() => handleAction(completeTransfer)}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-info text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                  >
                    {actionPending ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    Complete Transfer
                  </button>
                )}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {t("transfer.decision.text")}
              </p>
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
            <div className="flex items-center gap-3">
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium uppercase tracking-wider">{tx.holding?.status || "UNKNOWN"}</span>
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
      <li className="flex justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={
            mono ? "font-mono tabular-nums text-foreground" : "text-foreground"
          }
        >
          {value}
        </span>
      </li>
    );
  }

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
    <div className="flex items-start gap-3">
      <div className="flex size-10 items-center justify-center rounded-md bg-secondary/10 font-bold text-secondary">
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {role}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{jurisdiction}</p>
      </div>
    </div>
  );
}