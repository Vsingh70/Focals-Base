'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import type { Database } from '@/lib/supabase/types';

type InquirySource = Database['public']['Tables']['inquiry_sources']['Row'];

const createSchema = z.object({
  type: z.enum(['website', 'email', 'instagram', 'custom']),
  label: z.string().min(1).max(200),
});

function generateToken() {
  return randomBytes(24).toString('base64url');
}

export async function createInquirySource(
  input: z.input<typeof createSchema>
): Promise<ActionResult<InquirySource>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const token = generateToken();
  const { data, error } = await auth.supabase
    .from('inquiry_sources')
    .insert({
      user_id: auth.user.id,
      type: parsed.data.type,
      label: parsed.data.label,
      config: { token },
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/settings');
  revalidatePath('/inbox');
  return ok(data);
}

export async function listInquirySources(): Promise<ActionResult<InquirySource[]>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { data, error } = await auth.supabase
    .from('inquiry_sources')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function setInquirySourceActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<InquirySource>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { data, error } = await auth.supabase
    .from('inquiry_sources')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/settings');
  return ok(data);
}
