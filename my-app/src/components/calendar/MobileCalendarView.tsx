'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ProjectForm, type ProjectFormMode } from '@/components/projects/ProjectForm';
import { deriveProjectLocationSuggestions } from './CalendarView';
import type { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ClientLite = { id: string; full_name: string };

const DEFAULT_DURATION_MIN = 60;

// Project status → Badge tone for the per-day list cards.
const statusToneMap = {
  inquiry: 'neutral',
  booked: 'accent',
  in_progress: 'warning',
  editing: 'warning',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
} as const;

// Project status → coloured bar swatch in the day cell + left border on the
// per-day list card.
const STATUS_BAR_COLOR: Record<string, string> = {
  inquiry: 'var(--color-text-tertiary)',
  booked: 'var(--color-accent)',
  in_progress: 'var(--color-warning)',
  editing: 'var(--color-warning)',
  delivered: 'var(--color-success)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
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

/**
 * Convert a stored wall-clock ISO timestamp into a local-time Date whose
 * components match the original digits (so .getHours() etc. return the
 * value the user typed regardless of viewer locale). See CalendarView for
 * the rationale.
 */
function wallClockDate(iso: string): Date | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
    parsed.getUTCHours(),
    parsed.getUTCMinutes()
  );
}

function formatLongDay(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function MobileCalendarView({
  projects,
  clients,
}: {
  projects: Project[];
  clients: ClientLite[];
}) {
  const [formMode, setFormMode] = useState<ProjectFormMode | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentMonthRef = useRef<HTMLElement | null>(null);
  const scrolledOnce = useRef(false);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = dayKey(today);

  // Group projects by local-day key for fast cell lookup. Projects without
  // a shoot_date don't appear on the calendar.
  const projectsByDay = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of projects) {
      if (!p.shoot_date) continue;
      const dt = wallClockDate(p.shoot_date);
      if (!dt) continue;
      const key = dayKey(startOfDay(dt));
      const list = map.get(key);
      if (list) list.push(p);
      else map.set(key, [p]);
    }
    // Sort each day's projects by shoot time. Stored timestamps sort the
    // same as wall-clock since they all share the +00 anchor.
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.shoot_date ?? 0).getTime() - new Date(b.shoot_date ?? 0).getTime()
      );
    }
    return map;
  }, [projects]);

  const locationSuggestions = useMemo(
    () => deriveProjectLocationSuggestions(projects),
    [projects]
  );

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
  const selectedDayProjects = selectedDayKey ? projectsByDay.get(selectedDayKey) ?? [] : [];
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.full_name])),
    [clients]
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
          + Project
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
                  const dayProjects = projectsByDay.get(cellKey) ?? [];
                  const visibleBars = dayProjects.slice(0, 3);

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
                        {visibleBars.map((p, idx) => (
                          <span
                            key={idx}
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '2px',
                              background:
                                STATUS_BAR_COLOR[p.status ?? 'inquiry'] ??
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
                      marginBottom: selectedDayProjects.length > 0 ? '0.625rem' : 0,
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
                        setFormMode({ kind: 'create', presetShootDate: start });
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
                  {selectedDayProjects.length === 0 ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      No projects scheduled.
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
                      {selectedDayProjects.map((p) => {
                        const start = wallClockDate(p.shoot_date ?? '') ?? new Date(0);
                        const tone =
                          statusToneMap[p.status as keyof typeof statusToneMap] ?? 'neutral';
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => setFormMode({ kind: 'edit', project: p })}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '0.625rem 0.75rem',
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-border)',
                                borderLeft: `3px solid ${
                                  STATUS_BAR_COLOR[p.status ?? 'inquiry'] ??
                                  'var(--color-accent)'
                                }`,
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                color: 'inherit',
                                opacity: p.status === 'completed' ? 0.7 : 1,
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
                                  {p.title}
                                </span>
                                {p.status ? <Badge tone={tone}>{p.status}</Badge> : null}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {formatTimeRange(start, DEFAULT_DURATION_MIN)}
                                {p.client_id
                                  ? ` · ${clientMap.get(p.client_id) ?? '—'}`
                                  : ''}
                                {p.location ? ` · ${p.location}` : ''}
                              </div>
                              {p.category ? (
                                <div
                                  style={{
                                    fontSize: '0.625rem',
                                    color: 'var(--color-text-tertiary)',
                                    marginTop: '0.125rem',
                                  }}
                                >
                                  {p.category}
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

      <ProjectForm
        mode={formMode}
        onClose={() => setFormMode(null)}
        clients={clients}
        locationSuggestions={locationSuggestions}
      />
    </>
  );
}
