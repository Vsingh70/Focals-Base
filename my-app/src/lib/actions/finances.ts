'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/lib/validations/finances';
import type { Database } from '@/lib/supabase/types';

type Transaction = Database['public']['Tables']['finances']['Row'];

export async function createTransaction(
  input: CreateTransactionInput
): Promise<ActionResult<Transaction>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('finances')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/finances');
  revalidatePath('/');
  return ok(data);
}

export async function updateTransaction(
  input: UpdateTransactionInput
): Promise<ActionResult<Transaction>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { id, ...patch } = parsed.data;
  const { data, error } = await auth.supabase
    .from('finances')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/finances');
  revalidatePath('/');
  return ok(data);
}

export async function deleteTransaction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('finances')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/finances');
  revalidatePath('/');
  return ok({ id });
}
