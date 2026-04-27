'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createLinkSchema,
  updateLinkSchema,
  type CreateLinkInput,
  type UpdateLinkInput,
} from '@/lib/validations/links';
import type { Database } from '@/lib/supabase/types';

type Link = Database['public']['Tables']['links']['Row'];

export async function createLink(input: CreateLinkInput): Promise<ActionResult<Link>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createLinkSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('links')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/links');
  return ok(data);
}

export async function updateLink(input: UpdateLinkInput): Promise<ActionResult<Link>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateLinkSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { id, ...patch } = parsed.data;
  const { data, error } = await auth.supabase
    .from('links')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/links');
  return ok(data);
}

export async function deleteLink(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('links')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/links');
  return ok({ id });
}
