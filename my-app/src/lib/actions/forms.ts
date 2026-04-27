'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createFormSchema,
  updateFormSchema,
  MAX_HOVER_PREVIEWS,
  type CreateFormInput,
  type UpdateFormInput,
} from '@/lib/validations/forms';
import type { Database, Json } from '@/lib/supabase/types';

type FormRow = Database['public']['Tables']['forms']['Row'];

function validateHoverPreviews(
  fields: { hover_preview?: boolean }[]
): string | null {
  const count = fields.filter((f) => f.hover_preview).length;
  if (count > MAX_HOVER_PREVIEWS) {
    return `Maximum ${MAX_HOVER_PREVIEWS} hover-preview fields allowed.`;
  }
  return null;
}

export async function createForm(input: CreateFormInput): Promise<ActionResult<FormRow>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createFormSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const previewError = validateHoverPreviews(parsed.data.fields);
  if (previewError) return fail(previewError);

  const { data, error } = await auth.supabase
    .from('forms')
    .insert({
      user_id: auth.user.id,
      name: parsed.data.name,
      fields: parsed.data.fields as unknown as Json,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/forms');
  return ok(data);
}

export async function updateForm(input: UpdateFormInput): Promise<ActionResult<FormRow>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateFormSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  if (parsed.data.fields) {
    const previewError = validateHoverPreviews(parsed.data.fields);
    if (previewError) return fail(previewError);
  }

  const { id, ...patch } = parsed.data;
  const updatePayload: Record<string, unknown> = { ...patch };
  if (patch.fields) updatePayload.fields = patch.fields as unknown as Json;

  const { data, error } = await auth.supabase
    .from('forms')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/forms');
  return ok(data);
}

export async function deleteForm(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('forms')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/forms');
  return ok({ id });
}
