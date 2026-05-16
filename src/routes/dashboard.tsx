import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  Coins,
  Download,
  PlusCircle,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageHeader, SectionCard, StatCard } from '@/components/Primitives';
import { StatusBadge } from '@/components/StatusBadge';
import { Asset, AssetType, getAssets } from '@/lib/assets-api';
import { requireAuth } from '@/lib/auth-guard';
import { useI18n } from '@/lib/i18n';
import {
  complianceAlerts,
  fmtCurrency,
  tokenized,
  transfers,
} from '@/lib/mock-data';

const typeMap: Record<AssetType, { key: string; color: string }> = {
  REAL_ESTATE: {
    key: 'dashboard.category.realEstate',
    color: 'var(--color-secondary)',
  },
  EQUITY: {
    key: 'dashboard.category.privateEquity',
    color: 'var(--color-navy)',
  },
  FIXED_INCOME: {
    key: 'dashboard.category.debt',
    color: 'var(--color-muted-foreground)',
  },
  COMMODITY: { key: 'Commodities', color: '#f59e0b' },
  OTHER: { key: 'Other', color: '#6b7280' },
};
const NETWORK_ERROR_MESSAGE =
  'The backend is still starting or temporarily unreachable. Please retry in a moment.';

function formatStatValue(value: number, currency = 'USD') {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: 'Dashboard — FlowStone Registry' },
      {
        name: 'description',
        content:
          'Institutional RWA dashboard — KPIs, transfers, compliance and tokenized assets.',
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slowLoadingTimer = window.setTimeout(() => {
      setSlowLoading(true);
    }, 8000);

    getAssets()
      .then(setAssets)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('401') || msg.includes('Unauthorized')) {
          setError('Your session has expired. Please sign in again.');
        } else if (
          msg.includes('Failed to fetch') ||
          msg.includes('temporarily unreachable') ||
          msg.includes('NetworkError')
        ) {
          setError(NETWORK_ERROR_MESSAGE);
        } else {
          setError('Unable to load assets right now.');
        }
      })
      .finally(() => {
        window.clearTimeout(slowLoadingTimer);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(slowLoadingTimer);
    };
  }, []);

  const recent = transfers.slice(0, 5);

  const totalValuation = assets.reduce((acc, a) => acc + a.valuation, 0);
  const tokenizedValuation = assets
    .filter((a) => a.tokenizationStatus === 'TOKENIZED')
    .reduce((acc, a) => acc + a.valuation, 0);

  const allocation = assets.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + a.valuation;
      return acc;
    },
    {} as Record<string, number>,
  );

  const chartData = Object.entries(allocation).map(([type, value]) => ({
    type: type as AssetType,
    value,
    color: typeMap[type as AssetType]?.color || 'var(--color-muted)',
    labelKey: typeMap[type as AssetType]?.key || type,
  }));

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          <p className="font-display text-lg font-medium text-muted-foreground">
            Initializing Asset Stream...
          </p>
          {slowLoading && (
            <p className="max-w-md text-center text-sm text-muted-foreground">
              The backend may be waking up. You can keep waiting, or retry if
              this takes too long.
            </p>
          )}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Connectivity Issue
            </h2>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md bg-secondary px-6 py-2 text-sm font-semibold text-secondary-foreground transition hover:opacity-90"
          >
            Retry Connection
          </button>
        </div>
      </AppShell>
    );
  }

  if (assets.length === 0) {
    return (
      <AppShell>
        <PageHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
        />
        <div className="mt-12 flex h-[40vh] flex-col items-center justify-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted/30 text-muted-foreground/40">
            <Boxes size={48} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              No Registered Assets
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              The institutional registry is currently empty. Start by registering
              your first real-world asset to manage holdings and transfers.
            </p>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-md bg-secondary px-8 text-sm font-semibold uppercase tracking-wider text-secondary-foreground shadow-lg shadow-secondary/20 transition hover:opacity-90">
            <PlusCircle size={18} /> {t('common.registerAsset')}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3.5 text-xs font-semibold uppercase tracking-wider text-foreground transition hover:bg-muted">
              <Download size={14} /> {t('common.export')}
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition hover:opacity-90">
              <PlusCircle size={14} /> {t('common.registerAsset')}
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Wallet size={16} />}
          label={t('kpi.totalAssets')}
          value={formatStatValue(totalValuation)}
          trend={{ value: '+0.0%', positive: true }}
        />
        <StatCard
          icon={<Boxes size={16} />}
          label={t('kpi.registeredAssets')}
          value={assets.length.toString()}
          hint={t('dashboard.hintEntities')}
        />
        <StatCard
          icon={<ArrowLeftRight size={16} />}
          label={t('kpi.pendingTransfers')}
          value="8"
          trend={{ value: 'High', positive: false }}
        />
        <StatCard
          icon={<ShieldAlert size={16} />}
          label={t('kpi.complianceCases')}
          value="3"
          hint={t('dashboard.hintHighSeverity')}
        />
        <StatCard
          icon={<Coins size={16} />}
          label={t('kpi.tokenizedAssets')}
          value={formatStatValue(tokenizedValuation)}
          trend={{
            value:
              totalValuation > 0
                ? `${((tokenizedValuation / totalValuation) * 100).toFixed(1)}%`
                : '0%',
            positive: true,
          }}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title={t('dashboard.allocation')}>
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <DonutChart t={t} data={chartData} />
              <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                {chartData.map((s) => (
                  <div
                    key={s.labelKey}
                    className="rounded-md border-secondary bg-muted/40 p-3 ltr:border-l-4 rtl:border-r-4"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(s.labelKey)}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-foreground">
                      {((s.value / totalValuation) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatStatValue(s.value)}
                    </p>
                    <div
                      className="mt-2 h-1 rounded-full opacity-80"
                      style={{ backgroundColor: s.color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t('dashboard.recentTransfers')}
            action={
              <Link
                to="/transfers"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-secondary hover:underline"
              >
                {t('common.viewAll')} <ArrowUpRight size={12} />
              </Link>
            }
            className="overflow-hidden"
          >
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2 text-start font-semibold">
                      {t('transfers.asset')}
                    </th>
                    <th className="px-5 py-2 text-start font-semibold">
                      {t('common.type')}
                    </th>
                    <th className="px-5 py-2 text-start font-semibold">
                      {t('common.value')}
                    </th>
                    <th className="px-5 py-2 text-start font-semibold">
                      {t('common.status')}
                    </th>
                    <th className="px-5 py-2 text-end font-semibold">
                      {t('common.time')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((tx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {tx.asset}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {tx.assetType}
                      </td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">
                        {fmtCurrency(tx.value)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-5 py-3 text-end text-xs text-muted-foreground">
                        {timeAgo(tx.createdAt, t)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <SectionCard title={t('dashboard.complianceAlerts')}>
            <ul className="space-y-3">
              {complianceAlerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-md border border-border p-3"
                >
                  <div
                    className={`mt-1 size-2 rounded-full ${
                      a.severity === 'high'
                        ? 'bg-destructive'
                        : a.severity === 'medium'
                          ? 'bg-warning'
                          : 'bg-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.entity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t('dashboard.registryHealth')}>
            <ul className="space-y-3 text-sm">
              {[
                {
                  label: t('dashboard.health.ledger'),
                  val: t('dashboard.health.healthy'),
                  c: 'text-success',
                },
                {
                  label: t('dashboard.health.kyc'),
                  val: t('dashboard.health.operational'),
                  c: 'text-success',
                },
                {
                  label: t('dashboard.health.settlement'),
                  val: t('dashboard.health.degraded'),
                  c: 'text-warning-foreground/80',
                },
                {
                  label: t('dashboard.health.audit'),
                  val: t('dashboard.health.healthy'),
                  c: 'text-success',
                },
              ].map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className={`font-semibold ${s.c}`}>{s.val}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title={t('dashboard.tokenizedPreview')}
            action={
              <Link
                to="/market"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-secondary hover:underline"
              >
                {t('common.viewAll')} <ArrowUpRight size={12} />
              </Link>
            }
          >
            <ul className="space-y-3">
              {tokenized.slice(0, 3).map((tk) => (
                <li
                  key={tk.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {tk.symbol}
                    </p>
                    <p className="font-medium text-foreground">{tk.name}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-mono tabular-nums text-foreground">
                      ${tk.price.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        tk.change >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {tk.change >= 0 ? '+' : ''}
                      {tk.change.toFixed(2)}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function DonutChart({
  t,
  data,
}: {
  t: (k: string) => string;
  data: { labelKey: string; value: number; color: string }[];
}) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="relative size-44">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="transparent"
          stroke="var(--color-border)"
          strokeWidth="3"
        />
        {data.map((item, idx) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${percentage} ${100 - percentage}`;
          const strokeDashoffset = -cumulativePercentage;
          cumulativePercentage += percentage;

          return (
            <circle
              key={idx}
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke={item.color}
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-in-out"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center px-2">
          {t('dashboard.chart.total')}
        </span>
        <span className="font-display text-xl font-bold text-foreground">
          {formatStatValue(total)}
        </span>
      </div>
    </div>
  );
}

function timeAgo(iso: string, t: (k: string) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);

  if (m < 60) {
    return `${m}${t('dashboard.time.m')}`;
  }

  const h = Math.floor(m / 60);

  if (h < 24) {
    return `${h}${t('dashboard.time.h')}`;
  }

  return `${Math.floor(h / 24)}${t('dashboard.time.d')}`;
}
