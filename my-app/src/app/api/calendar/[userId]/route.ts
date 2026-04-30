import ical from 'ical-generator';
import { createAdminClient } from '@/lib/supabase/admin';

// Default duration when projects don't carry a duration field. Matches
// CalendarView's default — keep them in sync.
const DEFAULT_DURATION_MIN = 60;

type ProjectRow = {
  id: string;
  title: string;
  shoot_date: string | null;
  location: string | null;
  status: string | null;
  category: string | null;
  notes: string | null;
  clients: { full_name: string | null } | { full_name: string | null }[] | null;
};

function firstOrSelf<T>(value: T | T[] | null): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('calendar_token, full_name, business_name')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    return new Response('Internal error', { status: 500 });
  }
  if (!profile || profile.calendar_token !== token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Projects with a shoot_date and not cancelled. The project IS the calendar
  // event now — no separate shoots table.
  const { data: projects, error: projectsError } = await admin
    .from('projects')
    .select(
      'id, title, shoot_date, location, status, category, notes, clients(full_name)'
    )
    .eq('user_id', userId)
    .not('shoot_date', 'is', null)
    .neq('status', 'cancelled')
    .order('shoot_date', { ascending: true });

  if (projectsError) {
    return new Response('Internal error', { status: 500 });
  }

  const calName =
    profile.business_name ??
    profile.full_name ??
    process.env.NEXT_PUBLIC_APP_NAME ??
    'Projects';

  const calendar = ical({
    name: `${calName} · Projects`,
    prodId: { company: calName, product: 'app-name', language: 'EN' },
  });

  for (const raw of (projects ?? []) as ProjectRow[]) {
    if (!raw.shoot_date) continue;
    // shoot_date is wall-clock — the digits in the column are the digits the
    // photographer typed. Read UTC components, feed them into a local-time
    // Date so ical-generator's floating-time formatter emits the same
    // YYYYMMDDTHHmmSS without a TZID or Z suffix. Apple Calendar / Google
    // Calendar render floating times against the viewer's clock, which is
    // exactly what we want.
    const stored = new Date(raw.shoot_date);
    if (Number.isNaN(stored.getTime())) continue;
    const start = new Date(
      stored.getUTCFullYear(),
      stored.getUTCMonth(),
      stored.getUTCDate(),
      stored.getUTCHours(),
      stored.getUTCMinutes()
    );
    const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60_000);

    const client = firstOrSelf(raw.clients);

    const descLines = [
      client?.full_name ? `Client: ${client.full_name}` : null,
      raw.category ? `Category: ${raw.category}` : null,
      raw.status ? `Status: ${raw.status}` : null,
      raw.notes ? `\n${raw.notes}` : null,
    ].filter(Boolean);

    calendar.createEvent({
      id: raw.id,
      start,
      end,
      floating: true,
      summary: raw.title,
      description: descLines.join('\n'),
      location: raw.location ?? undefined,
    });
  }

  return new Response(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="projects.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
