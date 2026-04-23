'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export type CalendarFeed = {
  httpsUrl: string;
  webcalUrl: string;
  googleAddUrl: string;
};

function buildFeed(userId: string, token: string): CalendarFeed {
  const base = siteUrl().replace(/\/$/, '');
  const path = `/api/calendar/${userId}?token=${encodeURIComponent(token)}`;
  const httpsUrl = `${base}${path}`;
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, 'webcal://');
  const googleAddUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsUrl)}`;
  return { httpsUrl, webcalUrl, googleAddUrl };
}

export async function getCalendarFeed(): Promise<ActionResult<CalendarFeed>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('calendar_token')
    .eq('id', auth.user.id)
    .single();

  if (error) return fail(error.message);
  if (!profile?.calendar_token) return fail('Calendar token missing');

  return ok(buildFeed(auth.user.id, profile.calendar_token));
}

export async function regenerateCalendarToken(): Promise<ActionResult<CalendarFeed>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const nextToken = randomUUID();
  const { error } = await auth.supabase
    .from('profiles')
    .update({ calendar_token: nextToken })
    .eq('id', auth.user.id);

  if (error) return fail(error.message);

  revalidatePath('/calendar');
  revalidatePath('/settings');
  return ok(buildFeed(auth.user.id, nextToken));
}
