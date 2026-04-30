import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import type { UpcomingProject } from '@/lib/queries/dashboard';
import { LocalDateBadge, LocalTime } from './LocalDateBadge';

// Postgres status enums are snake_case (e.g. "in_progress"). Render them
// as title-cased English so the dashboard reads naturally.
function humanizeStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/projects?edit=${p.id}`}
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
          <LocalDateBadge iso={p.shoot_date} />
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
              {p.client_name ?? '—'} · <LocalTime iso={p.shoot_date} />
              {p.location ? ` · ${p.location}` : ''}
            </div>
            {p.status ? <Badge tone="neutral">{humanizeStatus(p.status)}</Badge> : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
