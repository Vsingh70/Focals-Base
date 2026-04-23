import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail<T = never>(error: string): ActionResult<T> {
  return { data: null, error };
}

export async function requireUser(): Promise<
  { user: User; supabase: Awaited<ReturnType<typeof createClient>> } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (!user || error) return { error: 'Unauthorized' };
  return { user, supabase };
}
