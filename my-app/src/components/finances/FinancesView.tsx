'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { TransactionForm, type TransactionFormMode } from './TransactionForm';
import type { ChartPoint } from './FinancesChart';
import type { Database } from '@/lib/supabase/types';

// Lazy-load the ECharts bundle only when the finances page renders.
const FinancesChart = dynamic(() => import('./FinancesChart'), {
  ssr: false,
  loading: () => <Skeleton height={240} />,
});

type Transaction = Database['public']['Tables']['finances']['Row'];
type ProjectLite = { id: string; title: string };

type Period = 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'all';

const PERIOD_FILTERS: { key: Period; label: string }[] = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'this-quarter', label: 'This quarter' },
  { key: 'this-year', label: 'This year' },
  { key: 'all', label: 'All time' },
];

const primaryButton: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const secondaryButton: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.75rem',
    background: active ? 'var(--color-bg-tertiary)' : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    border: '1px solid',
    borderColor: active ? 'var(--color-border-secondary)' : 'transparent',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function periodRange(period: Period): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (period) {
    case 'this-month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { from, to };
    }
    case 'last-month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from, to };
    }
    case 'this-quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      const to = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
      return { from, to };
    }
    case 'this-year': {
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    }
    case 'all':
      return { from: null, to: null };
  }
}

function dateInRange(dateStr: string, from: Date | null, to: Date | null): boolean {
  if (!from && !to) return true;
  const d = new Date(dateStr);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function FinancesView({
  transactions,
  projects,
}: {
  transactions: Transaction[];
  projects: ProjectLite[];
}) {
  const [period, setPeriod] = useState<Period>('this-month');
  const [mode, setMode] = useState<TransactionFormMode | null>(null);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.title])),
    [projects]
  );

  const filtered = useMemo(() => {
    const { from, to } = periodRange(period);
    return transactions
      .filter((t) => dateInRange(t.date, from, to))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, period]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      const amt = Number(t.amount);
      if (t.type === 'income') income += amt;
      else if (t.type === 'expense') expense += amt;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const monthlyChart = useMemo<ChartPoint[]>(() => {
    // 6-month rolling chart regardless of selected period filter
    const now = new Date();
    const buckets = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { income: 0, expense: 0 });
    }
    for (const t of transactions) {
      const key = t.date.slice(0, 7);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const amt = Number(t.amount);
      if (t.type === 'income') bucket.income += amt;
      else if (t.type === 'expense') bucket.expense += amt;
    }
    return Array.from(buckets.entries()).map(([month, vals]) => ({ month, ...vals }));
  }, [transactions]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div data-tour="finances-period" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {PERIOD_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setPeriod(f.key)}
              style={chipStyle(period === f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div data-tour="finances-add" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setMode({ kind: 'create', defaultType: 'expense' })}
            style={secondaryButton}
          >
            + Expense
          </button>
          <button
            type="button"
            onClick={() => setMode({ kind: 'create', defaultType: 'income' })}
            style={primaryButton}
          >
            + Income
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <SummaryStat label="Income" value={formatCurrency(totals.income)} tone="success" />
        <SummaryStat label="Expenses" value={formatCurrency(totals.expense)} tone="danger" />
        <SummaryStat
          label="Net profit"
          value={formatCurrency(totals.net)}
          tone={totals.net >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Chart */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardHeader>
          <CardTitle>Income vs expenses · last 6 months</CardTitle>
        </CardHeader>
        <FinancesChart data={monthlyChart} />
      </Card>

      {/* Transactions table */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>
            Transactions ({filtered.length}) ·{' '}
            <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>
              {PERIOD_FILTERS.find((f) => f.key === period)?.label}
            </span>
          </CardTitle>
        </CardHeader>
        {filtered.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              color: 'var(--color-text-tertiary)',
              fontSize: '0.875rem',
              margin: 0,
            }}
          >
            No transactions in this period.
          </p>
        ) : (
          <>
          <table className="app-desktop-only" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Category</Th>
                <Th>Project</Th>
                <Th>Description</Th>
                <Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setMode({ kind: 'edit', transaction: t })}
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--color-bg-tertiary)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <Td>{formatDate(t.date)}</Td>
                  <Td>
                    <Badge tone={t.type === 'income' ? 'success' : 'danger'}>{t.type}</Badge>
                  </Td>
                  <Td>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {t.category ? t.category.replace(/_/g, ' ') : '—'}
                    </span>
                  </Td>
                  <Td>{t.project_id ? projectMap.get(t.project_id) ?? '—' : '—'}</Td>
                  <Td>
                    <span
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {t.description ?? '—'}
                    </span>
                  </Td>
                  <Td align="right">
                    <span
                      style={{
                        color:
                          t.type === 'income'
                            ? 'var(--color-success)'
                            : 'var(--color-danger)',
                        fontWeight: 500,
                      }}
                    >
                      {t.type === 'income' ? '+' : '−'}
                      {formatCurrency(Number(t.amount))}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card list */}
          <ul
            className="app-mobile-only"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: '0.5rem',
            }}
          >
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'edit', transaction: t })}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 0.875rem',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <Badge tone={t.type === 'income' ? 'success' : 'danger'}>{t.type}</Badge>
                    <span
                      style={{
                        color:
                          t.type === 'income'
                            ? 'var(--color-success)'
                            : 'var(--color-danger)',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                      }}
                    >
                      {t.type === 'income' ? '+' : '−'}
                      {formatCurrency(Number(t.amount))}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {formatDate(t.date)}
                    {t.category ? ` · ${t.category.replace(/_/g, ' ')}` : ''}
                    {t.project_id ? ` · ${projectMap.get(t.project_id) ?? '—'}` : ''}
                  </div>
                  {t.description ? (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                        marginTop: '0.25rem',
                      }}
                    >
                      {t.description}
                    </div>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          </>
        )}
      </Card>

      <TransactionForm mode={mode} onClose={() => setMode(null)} projects={projects} />
    </>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'danger' | 'neutral';
}) {
  const color =
    tone === 'success'
      ? 'var(--color-success)'
      : tone === 'danger'
        ? 'var(--color-danger)'
        : 'var(--color-text-primary)';
  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
      }}
    >
      <div
        style={{
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-tertiary)',
          marginBottom: '0.375rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 500,
          color,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.625rem 0.875rem',
        fontWeight: 500,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      style={{
        textAlign: align,
        padding: '0.625rem 0.875rem',
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </td>
  );
}
