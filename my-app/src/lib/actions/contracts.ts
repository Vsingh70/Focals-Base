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
import { getProvider, MissingApiKeyError } from '@/lib/llm/provider';
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

/**
 * Generate a fresh contract body from project + client context using Claude.
 *
 * Returns plain text (markdown headings) that the user can edit freely
 * before saving. Uses the user's stored Anthropic key via the same
 * `getProvider()` plumbing as the LLM upload feature; if no key is set,
 * surfaces an actionable error pointing the user at Settings.
 */
export async function generateContractDraft(input: {
  project_id: string;
}): Promise<ActionResult<{ body: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const projectRes = await auth.supabase
    .from('projects')
    .select('*, clients(*)')
    .eq('id', input.project_id)
    .eq('user_id', auth.user.id)
    .single();
  if (projectRes.error || !projectRes.data) return fail('Project not found');
  const project = projectRes.data;
  const client = (project as unknown as { clients: { full_name: string | null; email: string | null } | null }).clients;

  const profileRes = await auth.supabase
    .from('profiles')
    .select('full_name, business_name')
    .eq('id', auth.user.id)
    .single();
  const photographerName =
    profileRes.data?.business_name?.trim() ||
    profileRes.data?.full_name?.trim() ||
    'the Photographer';

  let anthropic;
  try {
    anthropic = await getProvider().getClient(auth.user.id);
  } catch (e) {
    if (e instanceof MissingApiKeyError) {
      return fail(
        'Connect your Anthropic API key in Settings → Integrations → AI file import first.'
      );
    }
    throw e;
  }

  // Compact factual brief — Claude turns this into a contract body.
  const brief = [
    `Photographer: ${photographerName}`,
    client?.full_name ? `Client: ${client.full_name}` : null,
    client?.email ? `Client email: ${client.email}` : null,
    project.title ? `Project / shoot title: ${project.title}` : null,
    project.category ? `Category: ${project.category}` : null,
    project.shoot_date ? `Shoot date (wall-clock UTC): ${project.shoot_date}` : null,
    project.location ? `Location: ${project.location}` : null,
    project.package_price != null ? `Package price: $${project.package_price}` : null,
    project.amount_paid != null && project.amount_paid > 0
      ? `Already paid: $${project.amount_paid}`
      : null,
    project.notes ? `Notes: ${project.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const system = `You are drafting a professional photography services contract.
Style: clear plain English, fair to both parties, US legal conventions but not
jurisdiction-specific. Use markdown headings (## Section Title) and short
paragraphs. Cover at minimum: scope of work + deliverables, payment terms
(deposit/balance/late fees), shoot date and location, cancellation +
rescheduling, image rights and usage, model release reference, liability
limitation, governing law placeholder, and signature lines for both parties.
Reference any specifics from the brief verbatim where useful (price, dates,
names). Do NOT invent legal citations or specific dollar amounts that aren't
in the brief. Output the contract body only — no preamble, no closing remark.`;

  try {
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [
        {
          role: 'user',
          content: `Project brief:\n\n${brief}\n\nDraft the contract body now.`,
        },
      ],
    });

    const body = completion.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();
    if (!body) return fail('The AI returned an empty draft. Try again.');

    // Best-effort usage stamp — same pattern as the upload flow.
    const inputTokens = completion.usage?.input_tokens ?? 0;
    const outputTokens = completion.usage?.output_tokens ?? 0;
    await getProvider().recordUsage(auth.user.id, inputTokens, outputTokens);

    return ok({ body });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown AI error';
    return fail(`Could not generate draft: ${message}`);
  }
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
