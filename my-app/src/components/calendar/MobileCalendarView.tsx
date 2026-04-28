'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ShootForm, deriveShootLocationSuggestions } from './ShootForm';
import type { Database } from '@/lib/supabase/types';

type Shoot = Database['public']['Tables']['shoots']['Row'];
type ClientLite = { id: string; full_name: string };
type ProjectLite = { id: string; title: string };

type OpenForm = { kind: 'create'; presetStart?: Date } | { kind: 'edit'; shoot: Shoot } | null;

const statusToneMap = {
  scheduled: 'accent',
  completed: 'success',
  cancelled: 'danger',
  rescheduled: 'warning',
} as const;

const STATUS_BAR_COLOR: Record<string, string> = {
  scheduled: 'var(--color-accent)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
  rescheduled: 'var(--color-warning)',
};

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Month range: 2 past, current, 9 forward = 12 months total.
const MONTHS_BACK = 2;
const MONTHS_FWD = 9;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns 6×7 = 42 day cells for a given month, including leading days from
 * the previous month and trailing days from the next month so the grid always
 * fills exactly 6 rows. Week starts on Monday.
 */
function buildMonthCells(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  // JS getDay: Sun=0, Mon=1, … Sat=6. We want Monday-start, so shift.
  const offset = (firstOfMonth.getDay() + 6) % 7; // Mon=0, Sun=6
  const start = new Date(year, month, 1 - offset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

function formatTimeRange(start: Date, durationMin: number) {
  const end = new Date(start.getTime() + durationMin * 60_000);
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function formatLongDay(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function MobileCalendarView({
  shoots,
  clients,
  projects,
}: {
  shoots: Shoot[];
  clients: ClientLite[];
  projects: ProjectLite[];
}) {
  const [formMode, setFormMode] = useState<OpenForm>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentMonthRef = useRef<HTMLElement | null>(null);
  const scrolledOnce = useRef(false);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = dayKey(today);

  // Group shoots by local-day key for fast cell lookup.
  const shootsByDay = useMemo(() => {
    const map = new Map<string, Shoot[]>();
    for (const s of shoots) {
      const dt = new Date(s.scheduled_at);
      const key = dayKey(startOfDay(dt));
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    // Sort each day's shoots by start time.
    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    }
    return map;
  }, [shoots]);

  const locationSuggestions = useMemo(() => deriveShootLocationSuggestions(shoots), [shoots]);

  // Months to render: 2 past + current + 9 forward.
  const months = useMemo(() => {
    const list: { year: number; month: number; key: string }[] = [];
    const base = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let offset = -MONTHS_BACK; offset <= MONTHS_FWD; offset++) {
      const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth(), key: monthKey(d) });
    }
    return list;
  }, [today]);

  const currentMonthKey = monthKey(today);

  // Auto-scroll the current month into view on first mount.
  useEffect(() => {
    if (scrolledOnce.current) return;
    if (currentMonthRef.current && containerRef.current) {
      currentMonthRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
      scrolledOnce.current = true;
    }
  }, []);

  const handleDayTap = (d: Date) => {
    setSelectedDay((prev) => (prev && dayKey(prev) === dayKey(d) ? null : d));
  };

  const selectedDayKey = selectedDay ? dayKey(selectedDay) : null;
  const selectedDayShoots = selectedDayKey ? shootsByDay.get(selectedDayKey) ?? [] : [];
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.full_name])),
    [clients]
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.title])),
    [projects]
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => {
            currentMonthRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            setSelectedDay(today);
          }}
          style={{
            padding: '0.5rem 0.75rem',
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setFormMode({ kind: 'create' })}
          style={{
            padding: '0.5rem 0.875rem',
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          + Shoot
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          paddingBottom: '1rem',
        }}
      >
        {months.map((m) => {
          const isCurrent = m.key === currentMonthKey;
          const cells = buildMonthCells(m.year, m.month);
          const monthLabel = new Date(m.year, m.month, 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
          return (
            <section
              key={m.key}
              ref={isCurrent ? currentMonthRef : undefined}
              style={{ marginBottom: '1.5rem' }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: isCurrent
                    ? 'var(--color-accent)'
                    : 'var(--color-text-primary)',
                  margin: '0 0 0.5rem 0.25rem',
                }}
              >
                {monthLabel}
              </h3>

              {/* Weekday header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  marginBottom: '0.25rem',
                }}
              >
                {WEEKDAY_HEADERS.map((label, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.625rem',
                      color: 'var(--color-text-tertiary)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '2px',
                }}
              >
                {cells.map((d) => {
                  const inMonth = d.getMonth() === m.month;
                  const cellKey = dayKey(d);
                  const isToday = cellKey === todayKey;
                  const isSelected = selectedDayKey === cellKey;
                  const dayShoots = shootsByDay.get(cellKey) ?? [];
                  const visibleBars = dayShoots.slice(0, 3);

                  return (
                    <button
                      key={cellKey}
                      type="button"
                      onClick={() => inMonth && handleDayTap(d)}
                      disabled={!inMonth}
                      className="app-tap-skip"
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '2px',
                        padding: '6px 0 4px',
                        background: isSelected
                          ? 'var(--color-accent-muted)'
                          : 'transparent',
                        border: isToday
                          ? '1px solid var(--color-accent)'
                          : '1px solid transparent',
                        borderRadius: '50%',
                        cursor: inMonth ? 'pointer' : 'default',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.875rem',
                        color: !inMonth
                          ? 'var(--color-text-tertiary)'
                          : isSelected
                            ? 'var(--color-accent)'
                            : isToday
                              ? 'var(--color-accent)'
                              : 'var(--color-text-primary)',
                        opacity: !inMonth ? 0.35 : 1,
                        fontWeight: isToday || isSelected ? 600 : 400,
                        transition: 'background 0.15s, color 0.15s',
                      }}
                    >
                      <span style={{ lineHeight: 1 }}>{d.getDate()}</span>
                      <div
                        style={{
                          display: 'flex',
                          gap: '2px',
                          height: '4px',
                          marginTop: 'auto',
                        }}
                      >
                        {visibleBars.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '2px',
                              background:
                                STATUS_BAR_COLOR[s.status ?? 'scheduled'] ??
                                'var(--color-accent)',
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Inline detail: events for the selected day, only if it's
                  inside this month. */}
              {selectedDay && selectedDay.getMonth() === m.month &&
              selectedDay.getFullYear() === m.year ? (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: selectedDayShoots.length > 0 ? '0.625rem' : 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {formatLongDay(selectedDay)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const start = new Date(selectedDay);
                        start.setHours(10, 0, 0, 0);
                        setFormMode({ kind: 'create', presetStart: start });
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-accent)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                      }}
                    >
                      + Add
                    </button>
                  </div>
                  {selectedDayShoots.length === 0 ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      No shoots scheduled.
                    </p>
                  ) : (
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'grid',
                        gap: '0.5rem',
                      }}
                    >
                      {selectedDayShoots.map((s) => {
                        const start = new Date(s.scheduled_at);
                        const tone =
                          statusToneMap[s.status as keyof typeof statusToneMap] ?? 'neutral';
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => setFormMode({ kind: 'edit', shoot: s })}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '0.625rem 0.75rem',
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-border)',
                                borderLeft: `3px solid ${
                                  STATUS_BAR_COLOR[s.status ?? 'scheduled'] ??
                                  'var(--color-accent)'
                                }`,
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                color: 'inherit',
                                opacity: s.status === 'completed' ? 0.7 : 1,
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
                                <span
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'var(--color-text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {s.title}
                                </span>
                                {s.status ? <Badge tone={tone}>{s.status}</Badge> : null}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {formatTimeRange(start, s.duration_minutes ?? 60)}
                                {s.client_id
                                  ? ` · ${clientMap.get(s.client_id) ?? '—'}`
                                  : ''}
                                {s.location ? ` · ${s.location}` : ''}
                              </div>
                              {s.project_id ? (
                                <div
                                  style={{
                                    fontSize: '0.625rem',
                                    color: 'var(--color-text-tertiary)',
                                    marginTop: '0.125rem',
                                  }}
                                >
                                  {projectMap.get(s.project_id) ?? ''}
                                </div>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <ShootForm
        mode={formMode}
        onClose={() => setFormMode(null)}
        clients={clients}
        projects={projects}
        locationSuggestions={locationSuggestions}
      />
    </>
  );
}
