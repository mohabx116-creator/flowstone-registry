import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  Check,
  Download,
  FileText,
  HelpCircle,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionCard } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAuth } from "@/lib/auth-guard";
import { useI18n } from "@/lib/i18n";
import { fmtCurrency, transfers } from "@/lib/mock-data";

export const Route = createFileRoute("/transfers/$id")({
  beforeLoad: requireAuth,
  loader: ({ params }) => {
    const tx = transfers.find((t) => t.id === params.id);
    if (!tx) throw notFound();
    return tx;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.id ?? "Transfer"} — FlowStone` },
      {
        name: "description",
        content: "Transfer case detail and decision panel.",
      },
    ],
  }),
  component: TransferDetail,
  notFoundComponent: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useI18n();

    return (
      <AppShell>
        <p className="text-muted-foreground">{t("transfer.notFound")}</p>
      </AppShell>
    );
  },
});

const checks = (t: (k: string) => string) => [
  { label: t("transfer.check.idv"), done: true },
  { label: t("transfer.check.sanctions"), done: true },
  { label: t("transfer.check.sof"), done: true },
  { label: t("transfer.check.bo"), done: false },
  { label: t("transfer.check.tax"), done: false },
];

const audit = [
  {
    time: "10:24:11",
    actor: "System",
    text: "Transfer created via Registry API.",
  },
  {
    time: "10:25:02",
    actor: "M. Sterling",
    text: "Auto-routed to Compliance Desk B.",
  },
  {
    time: "11:02:48",
    actor: "K. Hassan",
    text: "KYC re-verification requested from buyer.",
  },
  {
    time: "13:18:00",
    actor: "Buyer",
    text: "Submitted updated beneficial ownership form.",
  },
  {
    time: "14:45:21",
    actor: "Compliance",
    text: "Awaiting cross-border tax certification.",
  },
];

function TransferDetail() {
  const { t, locale } = useI18n();
  const tx = Route.useLoaderData();

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
        subtitle={tx.asset}
        actions={<StatusBadge status={tx.status} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title={t("transfer.assetUnderReview")}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Field label={t("transfers.asset")} value={tx.asset} />
              <Field label={t("common.type")} value={tx.assetType} />
              <Field
                label={t("transfer.transferValue")}
                value={fmtCurrency(tx.value)}
                mono
              />
              <Field label={t("transfer.settlement")} value={tx.settlement} />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SectionCard title={t("transfer.sellerDetails")}>
              <PartyCard
                name={tx.seller}
                role="LEI 549300A1B2C3D4E5F6G7"
                jurisdiction="Delaware, USA"
              />
            </SectionCard>

            <SectionCard title={t("transfer.buyerDetails")}>
              <PartyCard
                name={tx.buyer}
                role="LEI 213800Z9Y8X7W6V5U4T3"
                jurisdiction="Singapore"
              />
            </SectionCard>
          </div>

          <SectionCard title={t("transfer.compliance")}>
            <ul className="space-y-3">
              {checks(t).map((c) => (
                <li key={c.label} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full ${
                      c.done
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.done ? (
                      <Check size={12} />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>

                  <span
                    className={
                      c.done ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("transfer.documents")}>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                "Asset Title Deed.pdf",
                "Purchase Agreement.pdf",
                "KYC Buyer Pack.zip",
                "Tax Residency Cert.pdf",
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
              {audit.map((entry, index) => (
                <li key={`${entry.time}-${entry.actor}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="mt-1.5 size-2 rounded-full bg-secondary" />
                    {index < audit.length - 1 && (
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
          <SectionCard title={t("transfer.decision")}>
            <div className="space-y-2.5">
              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-success text-sm font-semibold text-success-foreground transition hover:opacity-90">
                <Check size={16} />
                {t("common.approve")}
              </button>

              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold transition hover:bg-muted">
                <HelpCircle size={16} />
                {t("common.requestInfo")}
              </button>

              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive transition hover:bg-destructive/10">
                <X size={16} />
                {t("common.reject")}
              </button>

              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive text-sm font-semibold text-destructive-foreground transition hover:opacity-90">
                <Ban size={16} />
                {t("common.blockAsset")}
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {t("transfer.decision.text")}
            </p>
          </SectionCard>

          <SectionCard title={t("transfer.routing.title")}>
            <ul className="space-y-3 text-sm">
              <Field
                label={t("transfer.routing.desk")}
                value="Desk B · APAC"
                inline
              />
              <Field
                label={t("transfer.routing.custodian")}
                value="Helvetia Trust"
                inline
              />
              <Field
                label={t("common.created")}
                value={new Date(tx.createdAt).toLocaleString(locale)}
                inline
              />
            </ul>
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