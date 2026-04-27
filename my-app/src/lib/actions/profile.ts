'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/profile';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<Profile>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  // Normalize empty strings to null on optional fields.
  const patch = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v])
  );

  const { data, error } = await auth.supabase
    .from('profiles')
    .update(patch)
    .eq('id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/settings');
  return ok(data);
}

/**
 * Permanently delete the current user's auth row. ON DELETE CASCADE on
 * profiles + every owner-scoped table removes their data automatically.
 * Uses the admin client because supabase.auth.deleteUser requires service-role.
 */
export async function deleteAccount(confirmation: string): Promise<ActionResult<null>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  if (confirmation !== 'DELETE') {
    return fail('Confirmation text must be exactly "DELETE".');
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return fail(error.message);

  // Best-effort: clear the user's session cookies on this device.
  try {
    await auth.supabase.auth.signOut();
  } catch {
    /* user already deleted; signOut may fail */
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}
