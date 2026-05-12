import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Variant = "pending" | "approved" | "rejected" | "blocked" | "expired" | "completed";

const styles: Record<Variant, string> = {
  pending: "bg-warning/15 text-warning-foreground/80 ring-warning/30",
  approved: "bg-info/15 text-info ring-info/30",
  rejected: "bg-destructive/15 text-destructive ring-destructive/30",
  blocked: "bg-destructive/20 text-destructive ring-destructive/40",
  expired: "bg-muted text-muted-foreground ring-border",
  completed: "bg-success/15 text-success ring-success/30",
};

const labelKey: Record<Variant, string> = {
  pending: "status.pending",
  approved: "status.approved",
  rejected: "status.rejected",
  blocked: "status.blocked",
  expired: "status.expired",
  completed: "status.completed",
};

export function StatusBadge({ status }: { status: Variant }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset whitespace-nowrap",
        styles[status],
      )}
    >
      {t(labelKey[status])}
    </span>
  );
}

const priorityStyles = {
  high: "bg-destructive/10 text-destructive ring-destructive/30",
  medium: "bg-warning/15 text-warning-foreground/80 ring-warning/30",
  low: "bg-muted text-muted-foreground ring-border",
} as const;

export function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset whitespace-nowrap",
        priorityStyles[priority],
      )}
    >
      {t(`common.${priority}`)}
    </span>
  );
}
