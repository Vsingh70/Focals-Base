'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createGearSchema,
  updateGearSchema,
  type CreateGearInput,
  type UpdateGearInput,
} from '@/lib/validations/gear';
import type { Database } from '@/lib/supabase/types';

type Gear = Database['public']['Tables']['gear']['Row'];

export async function createGearItem(
  input: CreateGearInput
): Promise<ActionResult<Gear>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createGearSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('gear')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/gear');
  return ok(data);
}

export async function updateGearItem(
  input: UpdateGearInput
): Promise<ActionResult<Gear>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateGearSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { id, ...patch } = parsed.data;
  const { data, error } = await auth.supabase
    .from('gear')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/gear');
  return ok(data);
}

export async function deleteGearItem(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('gear')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/gear');
  return ok({ id });
}
