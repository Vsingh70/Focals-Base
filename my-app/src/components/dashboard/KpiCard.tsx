import Link from 'next/link';
import { Card } from '@/components/ui/Card';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDelta(curr: number, prev: number): { label: string; positive: boolean } | null {
  if (prev === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  if (!Number.isFinite(pct)) return null;
  return {
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`,
    positive: pct >= 0,
  };
}

type KpiCardProps = {
  label: string;
  value: string | number;
  prevValue?: number;
  currentNumericValue?: number;
  format?: 'currency' | 'number';
  href?: string;
};

export function KpiCard({
  label,
  value,
  prevValue,
  currentNumericValue,
  format = 'number',
  href,
}: KpiCardProps) {
  const displayValue =
    typeof value === 'number'
      ? format === 'currency'
        ? formatCurrency(value)
        : value.toLocaleString()
      : value;

  const delta =
    typeof currentNumericValue === 'number' && typeof prevValue === 'number'
      ? formatDelta(currentNumericValue, prevValue)
      : null;

  const inner = (
    <Card padding="md" style={{ cursor: href ? 'pointer' : undefined, height: '100%' }}>
      <div
        style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.75rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.875rem',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {displayValue}
      </div>
      {delta ? (
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8125rem',
            color: delta.positive ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          {delta.label} vs last month
        </div>
      ) : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
