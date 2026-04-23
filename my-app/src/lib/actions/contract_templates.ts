'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createTemplateSchema,
  updateTemplateSchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from '@/lib/validations/contracts';
import {
  DEFAULT_TEMPLATE_NAME,
  DEFAULT_TEMPLATE_BODY,
} from '@/lib/contracts/defaultTemplate';
import type { Database } from '@/lib/supabase/types';

type Template = Database['public']['Tables']['contract_templates']['Row'];

export async function createTemplate(
  input: CreateTemplateInput
): Promise<ActionResult<Template>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createTemplateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('contract_templates')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/contracts');
  revalidatePath('/contracts/templates');
  return ok(data);
}

export async function updateTemplate(
  input: UpdateTemplateInput
): Promise<ActionResult<Template>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateTemplateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { id, ...patch } = parsed.data;
  const { data, error } = await auth.supabase
    .from('contract_templates')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/contracts/templates');
  return ok(data);
}

export async function deleteTemplate(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('contract_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/contracts/templates');
  return ok({ id });
}

export async function listTemplates(): Promise<ActionResult<Template[]>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { data, error } = await auth.supabase
    .from('contract_templates')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) return fail(error.message);
  return ok(data ?? []);
}

/**
 * Seed the default "Photography session agreement" template if the user
 * has no templates yet. Idempotent: returns the existing list unchanged
 * if at least one template already exists.
 */
export async function ensureDefaultTemplate(): Promise<ActionResult<Template[]>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { data: existing, error: listError } = await auth.supabase
    .from('contract_templates')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (listError) return fail(listError.message);
  if (existing && existing.length > 0) return ok(existing);

  const { data, error } = await auth.supabase
    .from('contract_templates')
    .insert({
      user_id: auth.user.id,
      name: DEFAULT_TEMPLATE_NAME,
      body: DEFAULT_TEMPLATE_BODY,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/contracts');
  revalidatePath('/contracts/templates');
  return ok([data]);
}
