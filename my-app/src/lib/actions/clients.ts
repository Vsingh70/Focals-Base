'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createClientSchema,
  updateClientSchema,
  listClientsSchema,
  type CreateClientInput,
  type UpdateClientInput,
  type ListClientsInput,
} from '@/lib/validations/clients';
import type { Database } from '@/lib/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];

export async function createClient(
  input: CreateClientInput
): Promise<ActionResult<Client>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('clients')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/clients');
  return ok(data);
}

export async function updateClient(
  input: UpdateClientInput
): Promise<ActionResult<Client>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { id, ...patch } = parsed.data;
  const { data, error } = await auth.supabase
    .from('clients')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
  return ok(data);
}

export async function deleteClient(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/clients');
  return ok({ id });
}

export async function listClients(
  input: Partial<ListClientsInput> = {}
): Promise<ActionResult<{ rows: Client[]; total: number }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = listClientsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { page, limit, search } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike('full_name', `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return fail(error.message);
  return ok({ rows: data ?? [], total: count ?? 0 });
}
