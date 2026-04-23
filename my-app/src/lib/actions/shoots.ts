'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createShootSchema,
  updateShootSchema,
  listShootsSchema,
  type CreateShootInput,
  type UpdateShootInput,
  type ListShootsInput,
} from '@/lib/validations/shoots';
import type { Database } from '@/lib/supabase/types';

type Shoot = Database['public']['Tables']['shoots']['Row'];

export async function createShoot(input: CreateShootInput): Promise<ActionResult<Shoot>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createShootSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('shoots')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/calendar');
  revalidatePath('/shoots');
  return ok(data);
}

export async function updateShoot(input: UpdateShootInput): Promise<ActionResult<Shoot>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateShootSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { id, ...patch } = parsed.data;
  const { data, error } = await auth.supabase
    .from('shoots')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/calendar');
  revalidatePath('/shoots');
  revalidatePath(`/shoots/${id}`);
  return ok(data);
}

export async function deleteShoot(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('shoots')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/calendar');
  revalidatePath('/shoots');
  return ok({ id });
}

export async function listShoots(
  input: Partial<ListShootsInput> = {}
): Promise<ActionResult<{ rows: Shoot[]; total: number }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = listShootsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { from, to, status, page, limit } = parsed.data;
  const rangeFrom = (page - 1) * limit;
  const rangeTo = rangeFrom + limit - 1;

  let query = auth.supabase
    .from('shoots')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('scheduled_at', { ascending: true })
    .range(rangeFrom, rangeTo);

  if (from) query = query.gte('scheduled_at', from);
  if (to) query = query.lte('scheduled_at', to);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return fail(error.message);
  return ok({ rows: data ?? [], total: count ?? 0 });
}
