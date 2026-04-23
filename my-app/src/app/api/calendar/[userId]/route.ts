import ical from 'ical-generator';
import { createAdminClient } from '@/lib/supabase/admin';

type ShootRow = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  status: string | null;
  notes: string | null;
  clients: { full_name: string | null } | { full_name: string | null }[] | null;
  projects: { title: string | null } | { title: string | null }[] | null;
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

  const { data: shoots, error: shootsError } = await admin
    .from('shoots')
    .select(
      'id, title, scheduled_at, duration_minutes, location, status, notes, clients(full_name), projects(title)'
    )
    .eq('user_id', userId)
    .neq('status', 'cancelled')
    .order('scheduled_at', { ascending: true });

  if (shootsError) {
    return new Response('Internal error', { status: 500 });
  }

  const calName =
    profile.business_name ??
    profile.full_name ??
    process.env.NEXT_PUBLIC_APP_NAME ??
    'Shoots';

  const calendar = ical({
    name: `${calName} · Shoots`,
    prodId: { company: calName, product: 'app-name', language: 'EN' },
  });

  for (const raw of (shoots ?? []) as ShootRow[]) {
    const start = new Date(raw.scheduled_at);
    const durationMin = raw.duration_minutes ?? 60;
    const end = new Date(start.getTime() + durationMin * 60_000);

    const client = firstOrSelf(raw.clients);
    const project = firstOrSelf(raw.projects);

    const descLines = [
      client?.full_name ? `Client: ${client.full_name}` : null,
      project?.title ? `Project: ${project.title}` : null,
      raw.status ? `Status: ${raw.status}` : null,
      raw.notes ? `\n${raw.notes}` : null,
    ].filter(Boolean);

    calendar.createEvent({
      id: raw.id,
      start,
      end,
      summary: raw.title,
      description: descLines.join('\n'),
      location: raw.location ?? undefined,
    });
  }

  return new Response(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="shoots.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
