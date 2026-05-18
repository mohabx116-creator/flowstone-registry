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
import { updateComplianceCheck } from "@/lib/compliance-api";
import {
  getTransferById,
  approveTransfer,
  rejectTransfer,
  blockTransfer,
  completeTransfer,
  type Transfer,
  type ComplianceCheckStatus,
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

type DecisionAction = {
  label: string;
  action: (id: string) => Promise<Transfer>;
  color: string;
};

type RegistryOutcome = {
  summaryKey: string;
  nextKey: string | null;
};

type AuditEntry = {
  id: string;
  time: string;
  source: string;
  text: string;
};

type ComplianceDraft = {
  status: ComplianceCheckStatus;
  notes: string;
};

type ComplianceUpdateState = {
  pending: boolean;
  type?: "success" | "error";
  message?: string;
};

const COMPLIANCE_STATUS_OPTIONS: ComplianceCheckStatus[] = [
  "PENDING",
  "PASSED",
  "FAILED",
  "REQUIRES_REVIEW",
];

function TransferDetail() {
  const { t, locale } = useI18n();
  const { id } = Route.useParams();

  const [tx, setTx] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState<DecisionAction | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [complianceDrafts, setComplianceDrafts] = useState<
    Record<string, ComplianceDraft>
  >({});
  const [complianceUpdates, setComplianceUpdates] = useState<
    Record<string, ComplianceUpdateState>
  >({});

  const syncComplianceDrafts = (data: Transfer) => {
    const drafts: Record<string, ComplianceDraft> = {};

    for (const check of data.complianceChecks ?? []) {
      drafts[check.id] = {
        status: check.status,
        notes: check.notes ?? "",
      };
    }

    setComplianceDrafts(drafts);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const data = await getTransferById(id);
      setTx(data);
      syncComplianceDrafts(data);
    } catch (err) {
      console.error("Fetch error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to fetch transfer details";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [id]);

  const executeAction = async () => {
    if (!tx || !showConfirm || actionPending) return;

    const { action, label } = showConfirm;
    setActionPending(true);
    setFeedback(null);

    try {
      const updated = await action(tx.id);
      setTx(updated);
      setFeedback({
        type: "success",
        msg: `${label}: ${t("transfer.actionSuccess")}`,
      });
      setShowConfirm(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("transfer.actionFailed");

      setFeedback({
        type: "error",
        msg: message,
      });
    } finally {
      setActionPending(false);
    }
  };

  const refreshTransferData = async () => {
    const data = await getTransferById(id);
    setTx(data);
    syncComplianceDrafts(data);
  };

  const updateComplianceDraft = (
    checkId: string,
    patch: Partial<ComplianceDraft>,
  ) => {
    setComplianceDrafts((current) => ({
      ...current,
      [checkId]: {
        status: current[checkId]?.status ?? "PENDING",
        notes: current[checkId]?.notes ?? "",
        ...patch,
      },
    }));

    setComplianceUpdates((current) => ({
      ...current,
      [checkId]: { pending: false },
    }));
  };

  const saveComplianceCheck = async (checkId: string) => {
    const draft = complianceDrafts[checkId];

    if (!draft) return;

    setComplianceUpdates((current) => ({
      ...current,
      [checkId]: { pending: true },
    }));

    try {
      await updateComplianceCheck(checkId, {
        status: draft.status,
        notes: draft.notes,
      });

      await refreshTransferData();

      setComplianceUpdates((current) => ({
        ...current,
        [checkId]: {
          pending: false,
          type: "success",
          message: t("transfer.compliance.updateSaved"),
        },
      }));
    } catch (err) {
      const rawMessage =
        err instanceof Error
          ? err.message
          : t("transfer.compliance.updateFailed");
      const message = isUnauthorizedMessage(rawMessage)
        ? t("transfer.compliance.updateUnauthorized")
        : rawMessage || t("transfer.compliance.updateFailed");

      setComplianceUpdates((current) => ({
        ...current,
        [checkId]: {
          pending: false,
          type: "error",
          message,
        },
      }));
    }
  };

  const user = getStoredUser();
  const canDecide =
    user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER";

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

          <p className="text-muted-foreground">
            {error || t("transfer.notFound")}
          </p>

          <Link
            to="/transfers"
            className="text-sm font-semibold uppercase tracking-wider text-secondary hover:underline"
          >
            {t("common.viewAll")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const asset = tx.holding?.asset;
  const registryOutcome = getRegistryOutcome(tx.status);
  const transferValue =
    (asset?.valuation || 0) * (tx.units / (tx.holding?.units || 1));
  const auditEntries = getDerivedAuditEntries(tx, t, locale);
  const allComplianceChecksPassed = areAllComplianceChecksPassed(tx);
  const recipientName = getTransferUserDisplayName(tx.recipient);
  const recipientRole = tx.recipient
    ? `${tx.recipient.email} / ${tx.recipient.role}`
    : t("transfer.recipientUnavailable");
  const sourceOwnerName = getTransferUserDisplayName(tx.holding?.user);
  const sourceOwnerRole = tx.holding?.user
    ? `${tx.holding.user.email} / ${tx.holding.user.role}`
    : `${t("transfer.field.holdingId")}: ${tx.holdingId}`;

  const canShowDecisionPanel =
    canDecide && (tx.status === "PENDING_REVIEW" || tx.status === "APPROVED");

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
            <span className="hidden shrink-0 font-mono text-sm text-muted-foreground sm:inline">
              /
            </span>
            <span
              className="min-w-0 max-w-full truncate font-mono text-sm opacity-80 md:text-base"
              title={tx.id}
            >
              {tx.id}
            </span>
          </h1>

          <p
            className="mt-1 max-w-full truncate text-sm text-muted-foreground sm:max-w-xl lg:max-w-3xl"
            title={asset?.name || t("common.unknown")}
          >
            {asset?.name || t("common.unknown")}
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
              <Field
                label={t("transfers.asset")}
                value={asset?.name || t("common.unknown")}
              />
              <Field
                label={t("common.type")}
                value={asset?.type || t("common.unknown")}
              />
              <Field
                label={t("transfer.transferValue")}
                value={fmtCurrency(transferValue)}
                mono
              />
              <Field
                label={t("holdings.units")}
                value={tx.units.toLocaleString(locale)}
                mono
              />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title={t("transfer.sellerDetails")} className="h-full">
              <PartyCard
                name={sourceOwnerName || tx.holding?.userId || t("common.unknown")}
                role={sourceOwnerRole}
                jurisdiction={asset?.location || t("common.unknown")}
              />
            </SectionCard>

            <SectionCard title={t("transfer.buyerDetails")} className="h-full">
              <PartyCard
                name={recipientName || t("transfer.recipientUnavailable")}
                role={recipientRole}
                jurisdiction={asset?.location || t("common.unknown")}
              />
            </SectionCard>
          </div>

          <SectionCard title={t("transfer.compliance")}>
            {tx.complianceChecks && tx.complianceChecks.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 xl:grid-cols-1 2xl:grid-cols-2">
                {tx.complianceChecks.map((check) => {
                  const draft = complianceDrafts[check.id] ?? {
                    status: check.status,
                    notes: check.notes ?? "",
                  };
                  const updateState = complianceUpdates[check.id];
                  const isUpdating = Boolean(updateState?.pending);

                  return (
                    <li
                      key={check.id}
                      className="min-w-0 rounded-md border border-border bg-muted/20 p-3"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold text-foreground"
                            title={check.checkType || t("common.unknown")}
                          >
                            {check.checkType || t("common.unknown")}
                          </p>

                          {check.notes && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                {t("transfer.compliance.notes")}:
                              </span>{" "}
                              {check.notes}
                            </p>
                          )}
                        </div>

                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
                            getComplianceStatusClass(check.status),
                          )}
                        >
                          {getComplianceStatusLabel(check.status, t)}
                        </span>
                      </div>

                      {canDecide && (
                        <div className="mt-3 grid grid-cols-1 gap-3 rounded-md border border-border bg-card/70 p-3">
                          <label className="min-w-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {t("transfer.compliance.updateStatus")}
                            <select
                              disabled={isUpdating}
                              value={draft.status}
                              onChange={(event) =>
                                updateComplianceDraft(check.id, {
                                  status: event.target
                                    .value as ComplianceCheckStatus,
                                })
                              }
                              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none transition focus:border-secondary disabled:opacity-60"
                            >
                              {COMPLIANCE_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {getComplianceStatusLabel(status, t)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="min-w-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {t("transfer.compliance.updateNotes")}
                            <textarea
                              disabled={isUpdating}
                              value={draft.notes}
                              onChange={(event) =>
                                updateComplianceDraft(check.id, {
                                  notes: event.target.value,
                                })
                              }
                              rows={2}
                              className="mt-1 w-full resize-none rounded-md border border-border bg-background px-2 py-2 text-xs font-medium normal-case leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground focus:border-secondary disabled:opacity-60"
                            />
                          </label>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              disabled={isUpdating}
                              onClick={() => void saveComplianceCheck(check.id)}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-secondary px-3 text-[11px] font-bold uppercase tracking-wider text-secondary-foreground transition hover:opacity-90 disabled:opacity-60"
                            >
                              {isUpdating ? (
                                <>
                                  <RefreshCw size={13} className="animate-spin" />
                                  {t("transfer.compliance.updateSaving")}
                                </>
                              ) : (
                                t("transfer.compliance.updateAction")
                              )}
                            </button>

                            {updateState?.message && (
                              <p
                                className={cn(
                                  "min-w-0 break-words text-xs font-medium",
                                  updateState.type === "success"
                                    ? "text-success"
                                    : "text-destructive",
                                )}
                              >
                                {updateState.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                        <MetaLine
                          label={t("transfer.compliance.createdAt")}
                          value={formatDateTime(check.createdAt, locale, t)}
                        />
                        <MetaLine
                          label={t("transfer.compliance.updatedAt")}
                          value={formatDateTime(check.updatedAt, locale, t)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title={t("transfer.compliance.emptyTitle")}
                body={t("transfer.compliance.emptyBody")}
              />
            )}
          </SectionCard>

          <SectionCard title={t("transfer.audit")}>
            <div className="mb-4 rounded-md border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              {t("transfer.audit.derivedNotice")}
            </div>

            {auditEntries.length > 0 ? (
              <ol className="space-y-4">
                {auditEntries.map((entry, index, arr) => (
                  <li key={entry.id} className="flex gap-4">
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="mt-1.5 size-2 rounded-full bg-secondary" />
                    {index < arr.length - 1 && (
                      <span className="w-px flex-1 bg-border" />
                    )}
                  </div>

                  <div className="min-w-0 pb-1">
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {entry.time} / {entry.source}
                    </p>
                    <p className="mt-0.5 break-words text-sm text-foreground">
                      {entry.text}
                    </p>
                  </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                title={t("transfer.audit.emptyTitle")}
                body={t("transfer.audit.emptyBody")}
              />
            )}
          </SectionCard>
        </div>

        <div className="min-w-0 space-y-6">
          {feedback && (
            <div
              className={cn(
                "rounded-md border p-3 text-xs font-medium",
                feedback.type === "success"
                  ? "border-success/20 bg-success/10 text-success"
                  : "border-destructive/20 bg-destructive/10 text-destructive",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                {feedback.type === "success" ? (
                  <Check size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )}
                <span className="min-w-0 break-words">{feedback.msg}</span>
              </div>
            </div>
          )}

          {canShowDecisionPanel && (
            <SectionCard title={t("transfer.decision")}>
              {showConfirm ? (
                <div className="animate-in fade-in zoom-in space-y-4 rounded-md border border-border bg-muted/30 p-4 duration-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("transfer.confirm.title")}
                  </p>

                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {t("transfer.confirm.body")}
                  </p>

                  <div className="flex flex-col gap-2 2xl:flex-row">
                    <button
                      disabled={actionPending}
                      onClick={executeAction}
                      className={cn(
                        "h-9 flex-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50",
                        showConfirm.color,
                      )}
                    >
                      {actionPending ? (
                        <RefreshCw size={14} className="mx-auto animate-spin" />
                      ) : (
                        t("common.confirm")
                      )}
                    </button>

                    <button
                      disabled={actionPending}
                      onClick={() => setShowConfirm(null)}
                      className="h-9 flex-1 rounded-md border border-border bg-card text-[11px] font-bold uppercase tracking-wider transition hover:bg-muted"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tx.status === "PENDING_REVIEW" && (
                    <>
                      <button
                        onClick={() =>
                          setShowConfirm({
                            label: t("common.approve"),
                            action: approveTransfer,
                            color: "bg-success text-success-foreground",
                          })
                        }
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-success text-[11px] font-bold uppercase tracking-wider text-success-foreground transition hover:opacity-90"
                      >
                        <Check size={14} />
                        {t("common.approve")}
                      </button>

                      <button
                        onClick={() =>
                          setShowConfirm({
                            label: t("common.reject"),
                            action: rejectTransfer,
                            color:
                              "bg-destructive text-destructive-foreground",
                          })
                        }
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/40 text-[11px] font-bold uppercase tracking-wider text-destructive transition hover:bg-destructive/10"
                      >
                        <X size={14} />
                        {t("common.reject")}
                      </button>

                      <button
                        onClick={() =>
                          setShowConfirm({
                            label: t("common.blockAsset"),
                            action: blockTransfer,
                            color:
                              "bg-destructive text-destructive-foreground",
                          })
                        }
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive text-[11px] font-bold uppercase tracking-wider text-destructive-foreground transition hover:opacity-90"
                      >
                        <Ban size={14} />
                        {t("common.blockAsset")}
                      </button>
                    </>
                  )}

                  {tx.status === "APPROVED" && (
                    <>
                      <div
                        className={cn(
                          "rounded-md border p-3 text-xs leading-relaxed",
                          allComplianceChecksPassed
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-warning/30 bg-warning/10 text-warning-foreground",
                        )}
                      >
                        <p className="font-bold uppercase tracking-wider">
                          {allComplianceChecksPassed
                            ? t("transfer.settlement.ready")
                            : t("transfer.settlement.notReady")}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {allComplianceChecksPassed
                            ? t("transfer.settlement.readyBody")
                            : t("transfer.settlement.notReadyBody")}
                        </p>
                      </div>

                      <button
                        disabled={!allComplianceChecksPassed}
                        onClick={() =>
                          setShowConfirm({
                            label: t("common.complete"),
                            action: completeTransfer,
                            color: "bg-info text-white",
                          })
                        }
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-info text-[11px] font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShieldCheck size={14} />
                        {t("common.complete")}
                      </button>
                    </>
                  )}
                </div>
              )}

              {!showConfirm && (
                <p className="mt-4 text-[10px] italic leading-relaxed text-muted-foreground">
                  {t("transfer.decision.text")}
                </p>
              )}
            </SectionCard>
          )}

          <SectionCard title={t("transfer.registryOutcome.title")}>
            <div className="space-y-4">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[11px] font-medium uppercase tracking-tight text-muted-foreground">
                  {t("transfer.registryOutcome.status")}
                </span>
                <StatusBadge status={mapStatus(tx.status)} />
              </div>

              <p className="text-sm leading-relaxed text-foreground">
                {t(registryOutcome.summaryKey)}
              </p>

              {registryOutcome.nextKey && (
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("transfer.registryOutcome.nextAction")}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                    {t(registryOutcome.nextKey)}
                  </p>
                </div>
              )}

              {tx.status === "COMPLETED" && (
                <>
                  <ul className="space-y-3 text-sm">
                    <Field
                      label={t("holdings.units")}
                      value={tx.units.toLocaleString(locale)}
                      mono
                      inline
                    />
                    <Field
                      label={t("transfer.registryOutcome.holdingId")}
                      value={tx.holdingId}
                      mono
                      inline
                    />
                    {asset?.name && (
                      <Field
                        label={t("transfers.asset")}
                        value={asset.name}
                        inline
                      />
                    )}
                    {tx.completedAt && (
                      <Field
                        label={t("transfer.registryOutcome.completedAt")}
                        value={formatDateTime(tx.completedAt, locale, t)}
                        inline
                      />
                    )}
                  </ul>

                  <p className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                    {t("transfer.registryOutcome.ledgerNote")}
                  </p>
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title={t("transfer.routing.title")}>
            <ul className="space-y-3 text-sm">
              <Field
                label={t("common.priority")}
                value={tx.priority}
                inline
              />
              <Field
                label={t("common.created")}
                value={formatDateTime(tx.requestedAt, locale, t)}
                inline
              />
              <Field
                label={t("holdings.units")}
                value={tx.units.toLocaleString(locale)}
                inline
              />
            </ul>
          </SectionCard>

          <SectionCard title={t("transfer.holdingStatus")}>
            <div className="flex min-w-0 items-center gap-3">
              <Clock size={16} className="shrink-0 text-muted-foreground" />
              <span
                className="min-w-0 truncate text-xs font-bold uppercase tracking-widest text-foreground"
                title={tx.holding?.status || t("common.unknown")}
              >
                {tx.holding?.status || t("common.unknown")}
              </span>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function mapStatus(status: string | null | undefined): any {
  switch (status) {
    case "PENDING_REVIEW":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "BLOCKED":
      return "blocked";
    case "EXPIRED":
      return "expired";
    case "COMPLETED":
      return "completed";
    default:
      return "pending";
  }
}

function getRegistryOutcome(status: string | null | undefined): RegistryOutcome {
  switch (status) {
    case "PENDING_REVIEW":
      return {
        summaryKey: "transfer.registryOutcome.summary.pending",
        nextKey: "transfer.registryOutcome.next.pending",
      };
    case "APPROVED":
      return {
        summaryKey: "transfer.registryOutcome.summary.approved",
        nextKey: "transfer.registryOutcome.next.approved",
      };
    case "COMPLETED":
      return {
        summaryKey: "transfer.registryOutcome.summary.completed",
        nextKey: "transfer.registryOutcome.next.completed",
      };
    case "REJECTED":
      return {
        summaryKey: "transfer.registryOutcome.summary.rejected",
        nextKey: null,
      };
    case "BLOCKED":
      return {
        summaryKey: "transfer.registryOutcome.summary.blocked",
        nextKey: null,
      };
    case "EXPIRED":
      return {
        summaryKey: "transfer.registryOutcome.summary.expired",
        nextKey: null,
      };
    default:
      return {
        summaryKey: "transfer.registryOutcome.summary.unknown",
        nextKey: null,
      };
  }
}

function getComplianceStatusLabel(
  status: ComplianceCheckStatus | string | null | undefined,
  t: (key: string) => string,
) {
  switch (status) {
    case "PASSED":
      return t("transfer.compliance.status.passed");
    case "FAILED":
      return t("transfer.compliance.status.failed");
    case "PENDING":
      return t("transfer.compliance.status.pending");
    case "REQUIRES_REVIEW":
      return t("transfer.compliance.status.requiresReview");
    default:
      return t("common.unknown");
  }
}

function getComplianceStatusClass(
  status: ComplianceCheckStatus | string | null | undefined,
) {
  switch (status) {
    case "PASSED":
      return "bg-success/15 text-success ring-success/30";
    case "FAILED":
      return "bg-destructive/15 text-destructive ring-destructive/30";
    case "PENDING":
      return "bg-muted text-muted-foreground ring-border";
    case "REQUIRES_REVIEW":
      return "bg-warning/15 text-warning-foreground/80 ring-warning/30";
    default:
      return "bg-muted text-muted-foreground ring-border";
  }
}

function getDerivedAuditEntries(
  tx: Transfer,
  t: (key: string) => string,
  locale: string,
): AuditEntry[] {
  const entries: AuditEntry[] = [];

  if (isValidDateValue(tx.requestedAt)) {
    entries.push({
      id: "requested",
      time: formatDateTime(tx.requestedAt, locale, t),
      source: t("transfer.audit.registryApi"),
      text: t("transfer.audit.requested"),
    });
  }

  if (
    isValidDateValue(tx.updatedAt) &&
    !isSameInstant(tx.updatedAt, tx.requestedAt)
  ) {
    entries.push({
      id: "updated",
      time: formatDateTime(tx.updatedAt, locale, t),
      source: t("transfer.audit.systemRecord"),
      text: `${t("transfer.audit.latestStatus")} ${tx.status || t("common.unknown")}.`,
    });
  }

  if (isValidDateValue(tx.completedAt)) {
    entries.push({
      id: "completed",
      time: formatDateTime(tx.completedAt, locale, t),
      source: t("transfer.audit.registryApi"),
      text: t("transfer.audit.completed"),
    });
  }

  return entries;
}

function formatDateTime(
  value: string | null | undefined,
  locale: string,
  t: (key: string) => string,
) {
  if (!isValidDateValue(value)) {
    return t("common.unavailable");
  }

  return new Date(value).toLocaleString(locale);
}

function isValidDateValue(value: string | null | undefined): value is string {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

function isSameInstant(
  a: string | null | undefined,
  b: string | null | undefined,
) {
  if (!isValidDateValue(a) || !isValidDateValue(b)) {
    return false;
  }

  return new Date(a).getTime() === new Date(b).getTime();
}

function isUnauthorizedMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("401") ||
    normalized.includes("403") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden")
  );
}

function getTransferUserDisplayName(
  user:
    | Transfer["recipient"]
    | NonNullable<Transfer["holding"]>["user"]
    | undefined,
) {
  if (!user) {
    return "";
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

function areAllComplianceChecksPassed(tx: Transfer) {
  const checks = tx.complianceChecks ?? [];
  return checks.length > 0 && checks.every((check) => check.status === "PASSED");
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="min-w-0 truncate font-medium" title={label}>
        {label}
      </span>
      <span className="max-w-[58%] truncate font-mono text-foreground" title={value}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
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
        <span
          className="min-w-0 truncate text-[11px] font-medium uppercase tracking-tight text-muted-foreground"
          title={label}
        >
          {label}
        </span>

        <span
          className={cn(
            "max-w-[62%] truncate text-right text-xs font-semibold",
            mono ? "font-mono tabular-nums text-foreground" : "text-foreground",
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
      <p
        className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        title={label}
      >
        {label}
      </p>

      <p
        className={cn(
          "mt-1.5 text-sm leading-snug",
          mono
            ? "truncate font-mono tabular-nums text-foreground"
            : "break-words font-semibold text-foreground",
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
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-sm font-bold text-secondary">
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground" title={name}>
          {name}
        </p>
        <p className="mt-1 break-words font-mono text-[10px] leading-tight text-muted-foreground">
          {role}
        </p>
        <p
          className="mt-2 truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80"
          title={jurisdiction}
        >
          {jurisdiction}
        </p>
      </div>
    </div>
  );
}
