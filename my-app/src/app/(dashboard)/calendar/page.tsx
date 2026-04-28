import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCalendarFeed } from '@/lib/actions/calendar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CalendarView, NewShootButton } from '@/components/calendar/CalendarView';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { TourGate } from '@/components/tour/TourGate';
import { calendarTour } from '@/components/tour/tours';

export const metadata = {
  title: `Calendar · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [shootsRes, clientsRes, projectsRes, feedRes] = await Promise.all([
    supabase
      .from('shoots')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('user_id', user.id)
      .order('full_name', { ascending: true }),
    supabase
      .from('projects')
      .select('id, title')
      .eq('user_id', user.id)
      .order('title', { ascending: true }),
    getCalendarFeed(),
  ]);

  const shoots = shootsRes.data ?? [];
  const clients = clientsRes.data ?? [];
  const projects = projectsRes.data ?? [];

  // Distinct prior shoot locations — feed the <datalist> autosuggest in the
  // ShootForm. Derived server-side so NewShootButton (which doesn't see the
  // shoots prop) gets the same list as the in-calendar form.
  const locationSuggestions = Array.from(
    new Set(
      shoots
        .map((s) => (s.location ?? '').trim())
        .filter((l) => l.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="app-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Calendar"
        subtitle="All scheduled shoots. Click a date to add one, or an event to edit."
        actions={<NewShootButton clients={clients} projects={projects} locationSuggestions={locationSuggestions} />}
      />

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div data-tour="calendar-grid">
          <CalendarView shoots={shoots} clients={clients} projects={projects} />
        </div>
        {feedRes.data ? (
          <section data-tour="calendar-sync">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                margin: '0 0 0.75rem',
                letterSpacing: '-0.01em',
              }}
            >
              Subscribe
            </h2>
            <CalendarSync feed={feedRes.data} />
          </section>
        ) : null}
      </div>

      <TourGate tourId="calendar" steps={calendarTour.steps} helpHref="/help/calendar" />
    </div>
  );
}
