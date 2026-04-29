'use server';

import { revalidatePath } from 'next/cache';
import { ok, fail, requireUser, type ActionResult } from './_shared';
import { encryptApiKey, buildKeyHint } from '@/lib/llm/encryption';

type Provider = 'anthropic';

export type IntegrationStatus = {
  provider: Provider;
  connected: boolean;
  keyHint: string | null;
  lastUsedAt: string | null;
};

/**
 * Calls Anthropic's `/v1/models` endpoint with the provided key. Returns true
 * if the key is accepted. Used to validate before storing — saves the user
 * from a "your key didn't work" surprise on first upload.
 */
async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      // Modest timeout; if Anthropic is down we don't want to hang the form.
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setAnthropicKey(input: { key: string }): Promise<ActionResult<IntegrationStatus>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const trimmed = input.key.trim();
  if (!trimmed.startsWith('sk-ant-')) {
    return fail('That doesn’t look like an Anthropic API key. Keys start with "sk-ant-".');
  }
  if (trimmed.length < 30) {
    return fail('Key is too short to be valid.');
  }

  const valid = await validateAnthropicKey(trimmed);
  if (!valid) {
    return fail('Anthropic rejected that key. Double-check it at console.anthropic.com.');
  }

  const encrypted = encryptApiKey(trimmed);
  const keyHint = buildKeyHint(trimmed);

  // Postgres bytea over PostgREST takes a hex-prefixed string `\x...`.
  const { data, error } = await auth.supabase
    .from('user_integrations')
    .upsert(
      {
        user_id: auth.user.id,
        provider: 'anthropic',
        encrypted_key: `\\x${encrypted.toString('hex')}`,
        key_hint: keyHint,
        is_active: true,
      },
      { onConflict: 'user_id,provider' }
    )
    .select('provider, key_hint, last_used_at')
    .single();

  if (error) return fail(error.message);
  revalidatePath('/settings');
  return ok({
    provider: 'anthropic',
    connected: true,
    keyHint: data.key_hint,
    lastUsedAt: data.last_used_at,
  });
}

export async function removeAnthropicKey(): Promise<ActionResult<{ removed: boolean }>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { error } = await auth.supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('provider', 'anthropic');

  if (error) return fail(error.message);
  revalidatePath('/settings');
  return ok({ removed: true });
}

export async function getIntegrationStatus(): Promise<ActionResult<IntegrationStatus>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  const { data, error } = await auth.supabase
    .from('user_integrations')
    .select('provider, key_hint, last_used_at')
    .eq('user_id', auth.user.id)
    .eq('provider', 'anthropic')
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) {
    return ok({ provider: 'anthropic', connected: false, keyHint: null, lastUsedAt: null });
  }
  return ok({
    provider: 'anthropic',
    connected: true,
    keyHint: data.key_hint,
    lastUsedAt: data.last_used_at,
  });
}
