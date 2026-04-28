'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-overrides.css';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ShootForm, deriveShootLocationSuggestions } from './ShootForm';
import { MobileCalendarView } from './MobileCalendarView';
import type { Database } from '@/lib/supabase/types';

type Shoot = Database['public']['Tables']['shoots']['Row'];
type ClientLite = { id: string; full_name: string };
type ProjectLite = { id: string; title: string };

type RBCEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Shoot;
};

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const statusColor: Record<string, string> = {
  scheduled: 'var(--color-accent)',
  completed: 'var(--color-text-tertiary)',
  rescheduled: 'var(--color-warning)',
  cancelled: 'var(--color-danger)',
};

function shootToEvent(s: Shoot): RBCEvent {
  const start = new Date(s.scheduled_at);
  const end = new Date(start.getTime() + (s.duration_minutes ?? 60) * 60_000);
  return { id: s.id, title: s.title, start, end, resource: s };
}

type OpenForm = { kind: 'create'; presetStart?: Date } | { kind: 'edit'; shoot: Shoot } | null;

type CalendarProps = {
  shoots: Shoot[];
  clients: ClientLite[];
  projects: ProjectLite[];
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

function DesktopCalendarView({ shoots, clients, projects }: CalendarProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [formMode, setFormMode] = useState<OpenForm>(null);

  const events = useMemo(() => shoots.map(shootToEvent), [shoots]);
  const locationSuggestions = useMemo(() => deriveShootLocationSuggestions(shoots), [shoots]);

  const eventPropGetter = (event: RBCEvent) => {
    const color = statusColor[event.resource.status ?? 'scheduled'] ?? 'var(--color-accent)';
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
              setFormMode({ kind: 'create', presetStart: slotInfo.start })
            }
            onSelectEvent={(event) => setFormMode({ kind: 'edit', shoot: event.resource })}
            eventPropGetter={eventPropGetter}
            popup
            style={{ height: '100%' }}
          />
        </div>
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

export function NewShootButton({
  clients,
  projects,
  locationSuggestions = [],
}: {
  clients: ClientLite[];
  projects: ProjectLite[];
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
        + Shoot
      </button>
      <ShootForm
        mode={open ? { kind: 'create' } : null}
        onClose={() => setOpen(false)}
        clients={clients}
        projects={projects}
        locationSuggestions={locationSuggestions}
      />
    </>
  );
}
