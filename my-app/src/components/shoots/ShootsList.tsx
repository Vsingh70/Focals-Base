'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { ShootForm, deriveShootLocationSuggestions } from '@/components/calendar/ShootForm';
import { updateShoot } from '@/lib/actions/shoots';
import type { Database } from '@/lib/supabase/types';

type Shoot = Database['public']['Tables']['shoots']['Row'];
type ClientLite = { id: string; full_name: string };
type ProjectLite = { id: string; title: string };

type ToggleKey = 'upcoming' | 'past';

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

const quickActionButton: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.6875rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.875rem',
    background: active ? 'var(--color-bg-tertiary)' : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    border: '1px solid',
    borderColor: active ? 'var(--color-border-secondary)' : 'transparent',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
}

function dateBadge(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  };
}

const shootStatusToneMap = {
  scheduled: 'accent',
  completed: 'success',
  cancelled: 'danger',
  rescheduled: 'warning',
} as const;

export function ShootsList({
  shoots,
  clients,
  projects,
}: {
  shoots: Shoot[];
  clients: ClientLite[];
  projects: ProjectLite[];
}) {
  const router = useRouter();
  const [view, setView] = useState<ToggleKey>('upcoming');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Shoot | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.full_name])),
    [clients]
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.title])),
    [projects]
  );

  const now = useMemo(() => new Date(), []);
  const locationSuggestions = useMemo(() => deriveShootLocationSuggestions(shoots), [shoots]);

  const visible = useMemo(() => {
    const filtered = shoots.filter((s) => {
      const isPast = new Date(s.scheduled_at) < now;
      return view === 'past' ? isPast : !isPast;
    });
    // Upcoming: ascending. Past: descending.
    return filtered.sort((a, b) => {
      const ta = new Date(a.scheduled_at).getTime();
      const tb = new Date(b.scheduled_at).getTime();
      return view === 'past' ? tb - ta : ta - tb;
    });
  }, [shoots, view, now]);

  const handleQuickStatus = (shoot: Shoot, status: 'completed' | 'cancelled') => {
    startTransition(async () => {
      await updateShoot({ id: shoot.id, status });
      router.refresh();
    });
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
        <div data-tour="shoots-toggle" style={{ display: 'flex', gap: '0.25rem' }}>
          <button type="button" onClick={() => setView('upcoming')} style={chipStyle(view === 'upcoming')}>
            Upcoming
          </button>
          <button type="button" onClick={() => setView('past')} style={chipStyle(view === 'past')}>
            Past
          </button>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} style={primaryButton}>
          + New shoot
        </button>
      </div>

      {visible.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {view === 'upcoming' ? 'No upcoming shoots.' : 'No past shoots.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.625rem' }}>
          {visible.map((s) => {
            const date = dateBadge(s.scheduled_at);
            const tone =
              shootStatusToneMap[s.status as keyof typeof shootStatusToneMap] ?? 'neutral';
            const isUpcoming = new Date(s.scheduled_at) >= now;
            return (
              <li
                key={s.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditing(s)}
                  style={{
                    display: 'flex',
                    flex: '0 0 auto',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    width: '4rem',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.5rem 0.375rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    color: 'inherit',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--color-text-tertiary)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {date.weekday.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.375rem',
                      color: 'var(--color-text-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {date.day}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {date.month}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(s)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    color: 'inherit',
                  }}
                >
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
                    {s.title}
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
                    {date.time}
                    {s.client_id ? ` · ${clientMap.get(s.client_id) ?? '—'}` : ''}
                    {s.project_id ? ` · ${projectMap.get(s.project_id) ?? '—'}` : ''}
                    {s.location ? ` · ${s.location}` : ''}
                    {s.duration_minutes ? ` · ${s.duration_minutes}m` : ''}
                  </div>
                </button>
                <div
                  style={{
                    display: 'flex',
                    flex: '0 0 auto',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {s.status ? <Badge tone={tone}>{s.status}</Badge> : null}
                  {isUpcoming && s.status === 'scheduled' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(s, 'completed')}
                        disabled={isPending}
                        style={quickActionButton}
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(s, 'cancelled')}
                        disabled={isPending}
                        style={{ ...quickActionButton, color: 'var(--color-danger)' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ShootForm
        mode={createOpen ? { kind: 'create' } : null}
        onClose={() => setCreateOpen(false)}
        clients={clients}
        projects={projects}
        locationSuggestions={locationSuggestions}
      />
      <ShootForm
        mode={editing ? { kind: 'edit', shoot: editing } : null}
        onClose={() => setEditing(null)}
        clients={clients}
        projects={projects}
        locationSuggestions={locationSuggestions}
      />
    </>
  );
}
