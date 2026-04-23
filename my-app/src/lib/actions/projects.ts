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
