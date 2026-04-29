import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import type { UpcomingProject } from '@/lib/queries/dashboard';

function formatDateBadge(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export function UpcomingProjectsStrip({ projects }: { projects: UpcomingProject[] }) {
  if (projects.length === 0) {
    return (
      <p
        style={{
          color: 'var(--color-text-tertiary)',
          fontSize: '0.875rem',
          margin: 0,
          padding: '1rem 0',
        }}
      >
        No projects scheduled in the next 7 days.
      </p>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        margin: '0 -0.25rem',
      }}
    >
      {projects.map((p) => {
        const date = formatDateBadge(p.shoot_date);
        return (
          <Link
            key={p.id}
            href={`/projects?focus=${p.id}`}
            style={{
              flex: '0 0 260px',
              textDecoration: 'none',
              color: 'inherit',
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              display: 'flex',
              gap: '0.875rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                flex: '0 0 auto',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.375rem 0.625rem',
                textAlign: 'center',
                minWidth: '3rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.625rem',
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '0.08em',
                }}
              >
                {date.month}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                  marginTop: '0.125rem',
                }}
              >
                {date.day}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.25rem',
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
                  marginBottom: '0.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.client_name ?? '—'} · {date.time}
                {p.location ? ` · ${p.location}` : ''}
              </div>
              {p.status ? <Badge tone="neutral">{p.status}</Badge> : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
