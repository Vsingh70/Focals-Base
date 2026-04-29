import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptApiKey } from './encryption';

/**
 * Abstraction over how an Anthropic client is obtained for a given user.
 * v1: UserKeyProvider — read encrypted key from user_integrations.
 * v2 (planned): ServerKeyProvider — single env var, count usage per user.
 *
 * Swap is one line in `getProvider()` below.
 */
export interface LLMProvider {
  /**
   * Returns an authenticated Anthropic client for the given user.
   * Throws if the user has no key configured.
   */
  getClient(userId: string): Promise<Anthropic>;

  /**
   * Marks a successful inference call against this provider for the user.
   * v1 implementation only stamps last_used_at; v2 will write to a usage_log
   * table for quota enforcement.
   */
  recordUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void>;
}

/**
 * Error thrown when a user attempts an LLM operation without a stored key.
 * The /api/projects/upload route catches this and returns a 400 with
 * actionable messaging that links to /settings.
 */
export class MissingApiKeyError extends Error {
  constructor() {
    super('No Anthropic API key configured. Add one in Settings → Integrations.');
    this.name = 'MissingApiKeyError';
  }
}

class UserKeyProvider implements LLMProvider {
  async getClient(userId: string): Promise<Anthropic> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('user_integrations')
      .select('encrypted_key, is_active')
      .eq('user_id', userId)
      .eq('provider', 'anthropic')
      .maybeSingle();

    if (error) throw new Error(`Could not load API key: ${error.message}`);
    if (!data || !data.is_active) throw new MissingApiKeyError();

    // Postgres returns bytea as a `\x...` hex string over PostgREST.
    const hex = String(data.encrypted_key).replace(/^\\x/, '');
    const buf = Buffer.from(hex, 'hex');
    const apiKey = decryptApiKey(buf);

    return new Anthropic({ apiKey });
  }

  async recordUsage(userId: string, _inputTokens: number, _outputTokens: number): Promise<void> {
    const supabase = createAdminClient();
    // Best-effort. We don't want a DB error to fail an otherwise successful
    // inference call.
    await supabase
      .from('user_integrations')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'anthropic');
  }
}

let cached: LLMProvider | null = null;

/**
 * Resolve the active LLM provider. Today there's only one. To swap to a
 * server-paid model later, replace the body of this function with:
 *
 *   if (process.env.ANTHROPIC_API_KEY) return new ServerKeyProvider();
 *   return new UserKeyProvider();
 */
export function getProvider(): LLMProvider {
  if (!cached) cached = new UserKeyProvider();
  return cached;
}
