'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import type { TourId } from '@/lib/tour/ids';
import type { Json } from '@/lib/supabase/types';

function parseProgress(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

export async function markTourSeen(
  tourId: TourId
): Promise<ActionResult<{ tutorial_progress: Record<string, boolean> }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { data: profile, error: fetchError } = await auth.supabase
    .from('profiles')
    .select('tutorial_progress')
    .eq('id', auth.user.id)
    .single();
  if (fetchError) return fail(fetchError.message);

  const next = { ...parseProgress(profile.tutorial_progress), [tourId]: true };

  const { error: updateError } = await auth.supabase
    .from('profiles')
    .update({ tutorial_progress: next as Json })
    .eq('id', auth.user.id);
  if (updateError) return fail(updateError.message);

  return ok({ tutorial_progress: next });
}

export async function resetTours(): Promise<ActionResult<null>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('profiles')
    .update({ tutorial_progress: {} as Json })
    .eq('id', auth.user.id);
  if (error) return fail(error.message);

  revalidatePath('/', 'layout');
  return ok(null);
}
