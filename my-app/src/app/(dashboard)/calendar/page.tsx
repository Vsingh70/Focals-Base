import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCalendarFeed } from '@/lib/actions/calendar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CalendarView, NewProjectButton } from '@/components/calendar/CalendarView';
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

  const [projectsRes, clientsRes, feedRes] = await Promise.all([
    // Only projects with a shoot_date can show up on the calendar; the rest
    // (e.g. unbooked inquiries) live on /projects until they're scheduled.
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .not('shoot_date', 'is', null)
      .order('shoot_date', { ascending: true }),
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('user_id', user.id)
      .order('full_name', { ascending: true }),
    getCalendarFeed(),
  ]);

  const projects = projectsRes.data ?? [];
  const clients = clientsRes.data ?? [];

  // Distinct prior project locations — feed the <datalist> autosuggest in
  // the ProjectForm. Derived server-side so NewProjectButton (which doesn't
  // see the projects prop) gets the same list as the in-calendar form.
  const locationSuggestions = Array.from(
    new Set(
      projects
        .map((p) => (p.location ?? '').trim())
        .filter((l) => l.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="app-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Calendar"
        subtitle="Every project with a scheduled date. Click a slot to add one, or an event to edit."
        actions={<NewProjectButton clients={clients} locationSuggestions={locationSuggestions} />}
      />

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div data-tour="calendar-grid">
          <CalendarView projects={projects} clients={clients} />
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
