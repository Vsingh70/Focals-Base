import Link from 'next/link';
import { StatusBadge, PaymentBadge } from '@/components/ui/Badge';
import type { RecentProject } from '@/lib/queries/dashboard';

function formatCurrency(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentProjectsList({ projects }: { projects: RecentProject[] }) {
  if (projects.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
        No projects yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={`/projects/${p.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.75rem 0.875rem',
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '0.125rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.client_name ?? '—'} · {formatDate(p.shoot_date)} · {formatCurrency(p.package_price)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', flex: '0 0 auto' }}>
              <StatusBadge status={p.status} />
              {p.payment_status ? <PaymentBadge status={p.payment_status} /> : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
