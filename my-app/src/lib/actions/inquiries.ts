'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  manualInquirySchema,
  updateInquiryStatusSchema,
  listInquiriesSchema,
  convertInquirySchema,
  type ManualInquiryInput,
  type UpdateInquiryStatusInput,
  type ListInquiriesInput,
  type ConvertInquiryInput,
} from '@/lib/validations/inquiries';
import type { Database } from '@/lib/supabase/types';

type Inquiry = Database['public']['Tables']['inquiries']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

export async function createManualInquiry(
  input: ManualInquiryInput
): Promise<ActionResult<Inquiry>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = manualInquirySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('inquiries')
    .insert({
      ...parsed.data,
      user_id: auth.user.id,
      source: 'manual',
      status: 'new',
    })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/inbox');
  return ok(data);
}

export async function updateInquiryStatus(
  input: UpdateInquiryStatusInput
): Promise<ActionResult<Inquiry>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateInquiryStatusSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('inquiries')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/inbox');
  return ok(data);
}

export async function listInquiries(
  input: Partial<ListInquiriesInput> = {}
): Promise<ActionResult<{ rows: Inquiry[]; total: number }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = listInquiriesSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { page, limit, status, source } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from('inquiries')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);

  const { data, error, count } = await query;
  if (error) return fail(error.message);
  return ok({ rows: data ?? [], total: count ?? 0 });
}

export async function convertInquiry(
  input: ConvertInquiryInput
): Promise<ActionResult<{ client: Client; project: Project | null }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = convertInquirySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);
  const { id, createProject, projectTitle } = parsed.data;

  // Fetch the inquiry (RLS ensures it belongs to the user)
  const { data: inquiry, error: fetchError } = await auth.supabase
    .from('inquiries')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();
  if (fetchError || !inquiry) return fail(fetchError?.message ?? 'Inquiry not found');

  if (inquiry.status === 'converted' && inquiry.converted_client_id) {
    return fail('Inquiry already converted');
  }

  // Insert client pre-filled from inquiry data
  const { data: client, error: clientError } = await auth.supabase
    .from('clients')
    .insert({
      user_id: auth.user.id,
      full_name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      source: 'inquiry',
    })
    .select()
    .single();
  if (clientError || !client) return fail(clientError?.message ?? 'Failed to create client');

  let project: Project | null = null;
  if (createProject) {
    const title = projectTitle ?? inquiry.shoot_type ?? `Project for ${inquiry.name}`;
    const { data: p, error: projectError } = await auth.supabase
      .from('projects')
      .insert({
        user_id: auth.user.id,
        client_id: client.id,
        title,
        category: inquiry.shoot_type,
        shoot_date: inquiry.preferred_date,
        status: 'inquiry',
        notes: inquiry.message,
      })
      .select()
      .single();
    if (projectError || !p) return fail(projectError?.message ?? 'Failed to create project');
    project = p;
  }

  // Mark inquiry converted and link the new rows
  const { error: updateError } = await auth.supabase
    .from('inquiries')
    .update({
      status: 'converted',
      converted_client_id: client.id,
      converted_project_id: project?.id ?? null,
    })
    .eq('id', id)
    .eq('user_id', auth.user.id);
  if (updateError) return fail(updateError.message);

  revalidatePath('/inbox');
  revalidatePath('/clients');
  revalidatePath('/projects');
  return ok({ client, project });
}
