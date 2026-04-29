'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ListProjectsInput,
} from '@/lib/validations/projects';
import { createClientSchema } from '@/lib/validations/clients';
import type { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<Project>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { data, error } = await auth.supabase
    .from('projects')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/projects');
  return ok(data);
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<ActionResult<Project>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { id, ...patch } = parsed.data;
  const { data, error } = await auth.supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
  return ok(data);
}

export async function deleteProject(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return fail(error.message);
  revalidatePath('/projects');
  return ok({ id });
}

export async function listProjects(
  input: Partial<ListProjectsInput> = {}
): Promise<ActionResult<{ rows: Project[]; total: number }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const parsed = listProjectsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message);

  const { page, limit, status, client_id } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (client_id) query = query.eq('client_id', client_id);

  const { data, error, count } = await query;
  if (error) return fail(error.message);
  return ok({ rows: data ?? [], total: count ?? 0 });
}

// ---------------------------------------------------------------------------
// Bulk-commit projects from an LLM upload review pane.
//
// Composes the existing createClient + createProject paths so all the usual
// validation runs per row. Errors on any row are collected but DO NOT abort
// the batch — the user gets a "created N, skipped M" summary and can retry
// just the failures.
// ---------------------------------------------------------------------------

export type CommitProjectRow = {
  rowKey: string;                  // echoed back in errors so UI can highlight
  // Same shape as CreateProjectInput minus client_id:
  title: string;
  category?: string | null;
  status?: CreateProjectInput['status'];
  shoot_date?: string | null;
  location?: string | null;
  package_price?: number | null;
  amount_paid?: number;
  payment_status?: CreateProjectInput['payment_status'];
  notes?: string | null;
  // Client resolution:
  clientDecision:
    | { kind: 'existing'; clientId: string }
    | { kind: 'create'; full_name: string; email?: string | null; phone?: string | null }
    | { kind: 'none' };
};

export type CommitProjectError = { rowKey: string; message: string };

export type CommitProjectsResult = {
  jobId: string | null;
  createdProjectCount: number;
  createdClientCount: number;
  errors: CommitProjectError[];
};

export async function commitUploadedProjects(input: {
  jobId: string | null;
  rows: CommitProjectRow[];
}): Promise<ActionResult<CommitProjectsResult>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const errors: CommitProjectError[] = [];
  let createdProjectCount = 0;
  let createdClientCount = 0;

  for (const row of input.rows) {
    // 1. Resolve client_id, creating a new client if requested
    let clientId: string | null = null;
    if (row.clientDecision.kind === 'existing') {
      clientId = row.clientDecision.clientId;
    } else if (row.clientDecision.kind === 'create') {
      const parsedClient = createClientSchema.safeParse({
        full_name: row.clientDecision.full_name,
        email: row.clientDecision.email ?? null,
        phone: row.clientDecision.phone ?? null,
        source: 'manual',
      });
      if (!parsedClient.success) {
        errors.push({ rowKey: row.rowKey, message: `Client invalid: ${parsedClient.error.message}` });
        continue;
      }
      const { data: clientData, error: clientErr } = await auth.supabase
        .from('clients')
        .insert({ ...parsedClient.data, user_id: auth.user.id })
        .select('id')
        .single();
      if (clientErr || !clientData) {
        errors.push({ rowKey: row.rowKey, message: `Could not create client: ${clientErr?.message ?? 'unknown'}` });
        continue;
      }
      clientId = clientData.id;
      createdClientCount += 1;
    }

    // 2. Validate + insert project
    const projectPayload: CreateProjectInput = {
      title: row.title,
      client_id: clientId,
      category: row.category ?? null,
      status: row.status ?? 'inquiry',
      shoot_date: row.shoot_date ?? null,
      location: row.location ?? null,
      package_price: row.package_price ?? null,
      amount_paid: row.amount_paid ?? 0,
      payment_status: row.payment_status,
      notes: row.notes ?? null,
    };
    const parsed = createProjectSchema.safeParse(projectPayload);
    if (!parsed.success) {
      errors.push({ rowKey: row.rowKey, message: `Project invalid: ${parsed.error.message}` });
      continue;
    }
    const { error: projErr } = await auth.supabase
      .from('projects')
      .insert({ ...parsed.data, user_id: auth.user.id });
    if (projErr) {
      errors.push({ rowKey: row.rowKey, message: `Could not save project: ${projErr.message}` });
      continue;
    }
    createdProjectCount += 1;
  }

  // 3. Stamp the upload job (best-effort)
  if (input.jobId) {
    await auth.supabase
      .from('project_upload_jobs')
      .update({
        status: errors.length === input.rows.length ? 'failed' : 'committed',
        committed_count: createdProjectCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.jobId)
      .eq('user_id', auth.user.id);
  }

  revalidatePath('/projects');
  if (createdClientCount > 0) revalidatePath('/clients');

  return ok({
    jobId: input.jobId,
    createdProjectCount,
    createdClientCount,
    errors,
  });
}
