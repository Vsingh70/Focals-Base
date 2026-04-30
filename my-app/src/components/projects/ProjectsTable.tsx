'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StatusBadge, PaymentBadge } from '@/components/ui/Badge';
import { ProjectForm, type ProjectFormMode } from './ProjectForm';
import { ProjectsUploadDialog } from './ProjectsUploadDialog';
import type { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ClientLite = { id: string; full_name: string };

type StatusFilter =
  | 'all'
  | 'inquiry'
  | 'booked'
  | 'in_progress'
  | 'editing'
  | 'delivered'
  | 'completed'
  | 'cancelled';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'inquiry', label: 'Inquiry' },
  { key: 'booked', label: 'Booked' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'editing', label: 'Editing' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

type SortKey = 'title' | 'shoot_date' | 'package_price' | 'status';

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
  fontWeight: 500,
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
  // shoot_date is wall-clock — render in UTC so the number the user typed
  // is what they see, regardless of viewer locale.
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function ProjectsTable({
  projects,
  clients,
  hasAiKey = false,
}: {
  projects: Project[];
  clients: ClientLite[];
  hasAiKey?: boolean;
}) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('shoot_date');
  const [sortDesc, setSortDesc] = useState(true);
  const [mode, setMode] = useState<ProjectFormMode | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const searchParams = useSearchParams();

  // Auto-open the edit form when the page is reached via `?edit=<projectId>`
  // (used by the dashboard's UpcomingProjectsStrip and other deep links).
  // Only fires when the id matches one of the loaded projects, so a stale or
  // foreign id silently no-ops instead of opening a blank form.
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const match = projects.find((p) => p.id === editId);
    if (match) setMode({ kind: 'edit', project: match });
  }, [searchParams, projects]);

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.full_name])),
    [clients]
  );

  // Distinct, non-empty categories and locations from the user's existing
  // projects, sorted alphabetically — feed the <datalist> autosuggest fields
  // in the project form.
  const { categorySuggestions, locationSuggestions } = useMemo(() => {
    const cats = new Set<string>();
    const locs = new Set<string>();
    for (const p of projects) {
      const c = (p.category ?? '').trim();
      if (c) cats.add(c);
      const l = (p.location ?? '').trim();
      if (l) locs.add(l);
    }
    const sort = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b));
    return { categorySuggestions: sort(cats), locationSuggestions: sort(locs) };
  }, [projects]);

  const filtered = useMemo(() => {
    const out = filter === 'all' ? projects : projects.filter((p) => p.status === filter);
    const sorted = [...out].sort((a, b) => {
      let av: string | number | null = a[sortKey] ?? null;
      let bv: string | number | null = b[sortKey] ?? null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        const cmp = av.localeCompare(bv);
        return sortDesc ? -cmp : cmp;
      }
      const numA = Number(av);
      const numB = Number(bv);
      return sortDesc ? numB - numA : numA - numB;
    });
    return sorted;
  }, [projects, filter, sortKey, sortDesc]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of projects) m.set(p.status, (m.get(p.status) ?? 0) + 1);
    return m;
  }, [projects]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

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
        <div data-tour="projects-pipeline" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = f.key === 'all' ? projects.length : counts.get(f.key) ?? 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={chipStyle(active)}
              >
                {f.label}
                {count > 0 ? (
                  <span
                    style={{
                      marginLeft: '0.375rem',
                      color: 'var(--color-text-tertiary)',
                      fontSize: '0.6875rem',
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => setUploadOpen(true)} style={secondaryButton}>
            Import from file
          </button>
          <button type="button" onClick={() => setMode({ kind: 'create' })} style={primaryButton}>
            + New project
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {projects.length === 0
            ? 'No projects yet. Click "New project" to create one.'
            : `No ${filter} projects.`}
        </p>
      ) : (
        <div data-tour="projects-table">
          <div
            className="app-desktop-only"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <Th sortable active={sortKey === 'title'} desc={sortDesc} onClick={() => toggleSort('title')}>
                  Project
                </Th>
                <Th>Client</Th>
                <Th>Category</Th>
                <Th sortable active={sortKey === 'status'} desc={sortDesc} onClick={() => toggleSort('status')}>
                  Status
                </Th>
                <Th sortable active={sortKey === 'shoot_date'} desc={sortDesc} onClick={() => toggleSort('shoot_date')}>
                  Shoot date
                </Th>
                <Th sortable active={sortKey === 'package_price'} desc={sortDesc} onClick={() => toggleSort('package_price')} align="right">
                  Price
                </Th>
                <Th>Payment</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setMode({ kind: 'edit', project: p })}
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
                  <Td>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {p.title}
                    </span>
                  </Td>
                  <Td>{p.client_id ? clientMap.get(p.client_id) ?? '—' : '—'}</Td>
                  <Td>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {p.category ?? '—'}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td>{formatDate(p.shoot_date)}</Td>
                  <Td align="right">{formatCurrency(p.package_price)}</Td>
                  <Td>{p.payment_status ? <PaymentBadge status={p.payment_status} /> : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Mobile card list */}
          <ul
            className="app-mobile-only"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: '0.625rem',
            }}
          >
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'edit', project: p })}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.875rem 1rem',
                    background: 'var(--color-bg-secondary)',
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
                      marginBottom: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {p.title}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {p.client_id ? clientMap.get(p.client_id) ?? '—' : '—'}
                    {p.category ? ` · ${p.category}` : ''}
                    {p.shoot_date ? ` · ${formatDate(p.shoot_date)}` : ''}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {formatCurrency(p.package_price)}
                    </span>
                    {p.payment_status ? <PaymentBadge status={p.payment_status} /> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProjectForm
        mode={mode}
        onClose={() => setMode(null)}
        clients={clients}
        categorySuggestions={categorySuggestions}
        locationSuggestions={locationSuggestions}
      />

      <ProjectsUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        clients={clients}
        hasAiKey={hasAiKey}
      />
    </>
  );
}

function Th({
  children,
  sortable = false,
  active = false,
  desc = false,
  onClick,
  align = 'left',
}: {
  children: React.ReactNode;
  sortable?: boolean;
  active?: boolean;
  desc?: boolean;
  onClick?: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <th
      onClick={onClick}
      style={{
        textAlign: align,
        padding: '0.625rem 1rem',
        fontWeight: 500,
        cursor: sortable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {children}
      {sortable && active ? (
        <span style={{ marginLeft: '0.25rem', color: 'var(--color-text-tertiary)' }}>
          {desc ? '↓' : '↑'}
        </span>
      ) : null}
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
        padding: '0.625rem 1rem',
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </td>
  );
}
