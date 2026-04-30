'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-overrides.css';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ProjectForm, type ProjectFormMode } from '@/components/projects/ProjectForm';
import { MobileCalendarView } from './MobileCalendarView';
import type { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ClientLite = { id: string; full_name: string };

// Each project on the calendar gets a default 60-minute slot (projects don't
// carry duration; the user just picks a start time).
const DEFAULT_DURATION_MS = 60 * 60_000;

type RBCEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Project;
};

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Project lifecycle → calendar swatch.
const statusColor: Record<string, string> = {
  inquiry: 'var(--color-text-tertiary)',
  booked: 'var(--color-accent)',
  in_progress: 'var(--color-warning)',
  editing: 'var(--color-warning)',
  delivered: 'var(--color-success)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
};

function projectToEvent(p: Project): RBCEvent | null {
  if (!p.shoot_date) return null;
  const start = wallClockDate(p.shoot_date);
  if (!start) return null;
  return {
    id: p.id,
    title: p.title,
    start,
    end: new Date(start.getTime() + DEFAULT_DURATION_MS),
    resource: p,
  };
}

/**
 * Convert a wall-clock ISO timestamp into a JS Date whose *local-time*
 * components match the stored UTC components. react-big-calendar formats
 * events using local-time getters (`.getHours()` etc.), so to render a
 * shoot stored as 2026-05-15T08:30:00Z as "8:30 AM" in any viewer's
 * timezone, we need the resulting Date to satisfy `.getHours() === 8` in
 * the viewer's locale. Read UTC parts from the source and feed them to the
 * local-time Date constructor.
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

/**
 * Distinct, non-empty, alphabetically sorted project locations — feeds the
 * <datalist> autosuggest in ProjectForm. Lives here so the calendar parents
 * can pass a derived list down without duplicating the loop.
 */
export function deriveProjectLocationSuggestions(
  projects: { location: string | null }[]
): string[] {
  const seen = new Set<string>();
  for (const p of projects) {
    const l = (p.location ?? '').trim();
    if (l) seen.add(l);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

type CalendarProps = {
  projects: Project[];
  clients: ClientLite[];
};

/**
 * Top-level dispatcher: picks between the desktop react-big-calendar layout
 * and the mobile list-by-day layout based on viewport width. Each branch is
 * a separate child component so React's rule-of-hooks isn't violated when
 * we conditionally render one vs. the other.
 */
export function CalendarView(props: CalendarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setIsMobile(window.innerWidth <= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Until mounted we render the desktop variant — server-rendered HTML is
  // desktop-shape so this avoids a hydration mismatch. After mount, on
  // mobile, swap to the dedicated mobile component.
  if (mounted && isMobile) {
    return <MobileCalendarView {...props} />;
  }
  return <DesktopCalendarView {...props} />;
}

function DesktopCalendarView({ projects, clients }: CalendarProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [formMode, setFormMode] = useState<ProjectFormMode | null>(null);

  const events = useMemo(
    () => projects.map(projectToEvent).filter((e): e is RBCEvent => e !== null),
    [projects]
  );
  const locationSuggestions = useMemo(
    () => deriveProjectLocationSuggestions(projects),
    [projects]
  );

  const eventPropGetter = (event: RBCEvent) => {
    const color = statusColor[event.resource.status ?? 'inquiry'] ?? 'var(--color-accent)';
    return {
      style: {
        backgroundColor: 'var(--color-bg-tertiary)',
        border: `1px solid ${color}`,
        color: 'var(--color-text-primary)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8125rem',
        padding: '2px 6px',
        opacity: event.resource.status === 'completed' ? 0.7 : 1,
      },
    };
  };

  return (
    <>
      <div
        className="app-calendar"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        <div
          className="app-calendar-inner"
          style={{ height: 640, width: '100%', overflow: 'hidden' }}
        >
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            selectable
            onSelectSlot={(slotInfo) =>
              setFormMode({ kind: 'create', presetShootDate: slotInfo.start })
            }
            onSelectEvent={(event) => setFormMode({ kind: 'edit', project: event.resource })}
            eventPropGetter={eventPropGetter}
            popup
            style={{ height: '100%' }}
          />
        </div>
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

export function NewProjectButton({
  clients,
  locationSuggestions = [],
}: {
  clients: ClientLite[];
  locationSuggestions?: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
      <ProjectForm
        mode={open ? { kind: 'create' } : null}
        onClose={() => setOpen(false)}
        clients={clients}
        locationSuggestions={locationSuggestions}
      />
    </>
  );
}
