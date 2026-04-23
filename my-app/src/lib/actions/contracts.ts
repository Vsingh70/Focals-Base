'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createContractSchema,
  updateContractStatusSchema,
  listContractsSchema,
  type CreateContractInput,
  type UpdateContractStatusInput,
  type ListContractsInput,
} from '@/lib/validations/contracts';
import {
  buildMergeValues,
  renderTemplate,
  findUnreplacedTags,
} from '@/lib/contracts/mergeTags';
import type { Database, Json } from '@/lib/supabase/types';

type Contract = Database['public']['Tables']['contracts']['Row'];

/**
 * Preview a contract body WITHOUT saving. Used by the create flow so the
 * user sees the rendered output before confirming.
 */
export async function previewContract(input: {
  template_id: string;
  project_id: string;
  client_id: string;
  custom_fields?: Record<string, string>;
}): Promise<ActionResult<{ body: string; unreplacedTags: string[] }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const [templateRes, projectRes, clientRes, profileRes] = await Promise.all([
    auth.supabase
      .from('contract_templates')
      .select('*')
      .eq('id', input.template_id)
      .eq('user_id', auth.user.id)
      .single(),
    auth.supabase
      .from('projects')
      .select('*')
      .eq('id', input.project_id)
      .eq('user_id', auth.user.id)
      .single(),
    auth.supabase
      .from('clients')
      .select('*')
      .eq('id', input.client_id)
      .eq('user_id', auth.user.id)
      .single(),
    auth.supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .single(),
  ]);

  if (templateRes.error || !templateRes.data) return fail('Template not found');
  if (projectRes.error || !projectRes.data) return fail('Project not found');
  if (clientRes.error || !clientRes.data) return fail('Client not found');
  if (profileRes.error || !profileRes.data) return fail('Profile not found');

  const values = buildMergeValues({
    client: clientRes.data,
    project: projectRes.data,
    profile: profileRes.data,
    customFields: input.custom_fields,
  });
  const body = renderTemplate(templateRes.data.body, values);
  const unreplacedTags = findUnreplacedTags(body);

  return ok({ body, unreplacedTags });
}

export async function createContract(
  input: CreateContractInput
): Promise<ActionResult<Contract>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createContractSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { title, template_id, project_id, client_id, custom_fields } = parsed.data;

  // Re-render server-side so the persisted body is authoritative.
  const preview = await previewContract({
    template_id,
    project_id,
    client_id,
    custom_fields,
  });
  if (preview.error !== null) return fail(preview.error);
  if (preview.data.unreplacedTags.length > 0) {
    return fail(
      `Unreplaced merge tags: ${preview.data.unreplacedTags.join(', ')}`
    );
  }

  const { data, error } = await auth.supabase
    .from('contracts')
    .insert({
      user_id: auth.user.id,
      template_id,
      project_id,
      client_id,
      title,
      body: preview.data.body,
      custom_fields: custom_fields as Json,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/contracts');
  return ok(data);
}

export async function updateContractStatus(
  input: UpdateContractStatusInput
): Promise<ActionResult<Contract>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateContractStatusSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const timestamps: Partial<Contract> = {};
  if (parsed.data.status === 'sent') timestamps.sent_at = new Date().toISOString();
  if (parsed.data.status === 'signed') timestamps.signed_at = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from('contracts')
    .update({ status: parsed.data.status, ...timestamps })
    .eq('id', parsed.data.id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/contracts');
  revalidatePath(`/contracts/${parsed.data.id}`);
  return ok(data);
}

export async function deleteContract(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('contracts')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/contracts');
  return ok({ id });
}

export async function listContracts(
  input: Partial<ListContractsInput> = {}
): Promise<ActionResult<{ rows: Contract[]; total: number }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = listContractsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { page, limit, status } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from('contracts')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return fail(error.message);
  return ok({ rows: data ?? [], total: count ?? 0 });
}
