import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// Stretched 32-byte key derived from the env var. Cached per-process because
// scrypt is intentionally expensive and the secret never changes mid-run.
let cachedKey: Buffer | null = null;
function deriveKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.LLM_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'LLM_KEY_ENCRYPTION_SECRET env var is missing or too short (min 32 chars).'
    );
  }
  // Static salt is fine here — we want deterministic key derivation across
  // restarts, not per-message rotation. The IV provides per-message uniqueness.
  cachedKey = scryptSync(secret, 'focals-llm-key-salt', 32);
  return cachedKey;
}

/**
 * Encrypt a plaintext API key with AES-256-GCM. Output layout:
 *   [ iv (12 bytes) | auth tag (16 bytes) | ciphertext (n bytes) ]
 * Returned as Buffer for direct insert into a Postgres bytea column.
 */
export function encryptApiKey(plaintext: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

/**
 * Decrypt a buffer produced by `encryptApiKey`. Throws on tampered data
 * (GCM auth tag mismatch) or wrong secret.
 */
export function decryptApiKey(packed: Buffer): string {
  if (packed.length < 12 + 16 + 1) {
    throw new Error('Encrypted key buffer is too short to be valid.');
  }
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const ciphertext = packed.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Builds the masked display string we store alongside the ciphertext.
 * Anthropic keys look like `sk-ant-api03-AbCd...XyZ` — we keep the prefix
 * (everything up to and including `api03-`) and the last four characters,
 * with an ellipsis in between.
 */
export function buildKeyHint(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (trimmed.length <= 8) return '••••';
  // Match `sk-ant-api03-` style prefixes; otherwise show the first 6 chars.
  const prefixMatch = trimmed.match(/^([a-z]+-[a-z]+-[a-z0-9]+-)/i);
  const prefix = prefixMatch ? prefixMatch[1] : trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}…${suffix}`;
}
