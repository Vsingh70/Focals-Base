'use server';

import { ok, fail, requireUser, type ActionResult } from './_shared';
import { getProvider, MissingApiKeyError } from '@/lib/llm/provider';
import { suggestSlots, type SlotCandidate } from '@/lib/scheduling/suggestSlots';

export type SlotSuggestion = {
  /** Wall-clock ISO string ready to paste into shoot_date. */
  start: string;
  /** Short human-readable explanation written by the LLM. */
  reason: string;
  /** Heuristic tags carried through for tooling/debugging. */
  tags: string[];
};

export type SuggestSlotsInput = {
  /** Free-text category from the project being scheduled. */
  category?: string | null;
  /**
   * Optional anchor — usually inquiry.preferred_date or a date the user
   * already filled in. Bare `YYYY-MM-DD` or a full ISO; both work.
   */
  anchor?: string | null;
  /**
   * Optional note from the LLM caller (project notes, inquiry message,
   * etc). Goes verbatim into the prompt to ground the explanation.
   */
  context?: string | null;
};

/**
 * Heuristic + LLM-ranked slot suggestions.
 *
 * Strategy:
 *   1. Pull the next 30 days of existing shoot_dates from the user's
 *      projects.
 *   2. Run the local `suggestSlots` heuristic to produce a 20-slot
 *      shortlist with collision avoidance, golden-hour bias, weekend
 *      preference, and anchor-day weighting.
 *   3. Pass the shortlist to Claude with the project context. Claude
 *      picks the top 3 and writes a one-sentence reason for each.
 *
 * Falls back gracefully — if the user has no Anthropic key, returns the
 * top 3 heuristic candidates with auto-generated reasons (no AI call,
 * no error). If the LLM call fails, same fallback. The UI can show the
 * suggestions either way.
 */
export async function suggestProjectSlots(
  input: SuggestSlotsInput
): Promise<ActionResult<SlotSuggestion[]>> {
  const auth = await requireUser();
  if ('error' in auth) return fail(auth.error);

  // 1. Pull existing shoot_dates in a wide window (next 60 days, plus 30
  // days of recent past so the user sees collisions with last week's
  // shoot if they accidentally re-add the same day).
  const now = new Date();
  const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const { data: rows, error } = await auth.supabase
    .from('projects')
    .select('shoot_date')
    .eq('user_id', auth.user.id)
    .not('shoot_date', 'is', null)
    .gte('shoot_date', past.toISOString())
    .lte('shoot_date', future.toISOString());
  if (error) return fail(error.message);

  const existingShootDates = (rows ?? [])
    .map((r) => r.shoot_date)
    .filter((d): d is string => !!d);

  // 2. Heuristic shortlist.
  const candidates = suggestSlots({
    existingShootDates,
    category: input.category,
    anchor: input.anchor,
    now,
    limit: 20,
  });

  if (candidates.length === 0) {
    return fail(
      'No open slots found in the next 30 days. Try clearing some existing shoots or pick a date manually.'
    );
  }

  // 3. LLM ranking. Soft fall-through to local top-3 if no key or AI fails.
  let anthropic;
  try {
    anthropic = await getProvider().getClient(auth.user.id);
  } catch (e) {
    if (e instanceof MissingApiKeyError) {
      return ok(localTop3(candidates));
    }
    throw e;
  }

  const prompt = buildPrompt({
    candidates,
    category: input.category ?? null,
    anchor: input.anchor ?? null,
    context: input.context ?? null,
  });

  try {
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    const inputTokens = completion.usage?.input_tokens ?? 0;
    const outputTokens = completion.usage?.output_tokens ?? 0;
    void getProvider().recordUsage(auth.user.id, inputTokens, outputTokens);

    const text = completion.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();

    const ranked = parseLLMResponse(text, candidates);
    if (ranked.length === 0) return ok(localTop3(candidates));
    return ok(ranked);
  } catch {
    // AI failed — fall back to heuristic top-3 so the UI still works.
    return ok(localTop3(candidates));
  }
}

const SYSTEM_PROMPT = `You are helping a photographer pick the best 3 shoot
slots from a heuristic-generated shortlist. The shortlist already filtered
for: no collisions with existing shoots, time-of-day appropriate to the
category, optional anchor-day proximity. Your job:

1. Pick the 3 best slots from the candidates.
2. Write a one-sentence reason for each, written for the photographer
   (you = the AI assistant, they = "you"). Reference concrete factors
   when relevant: weekend, golden-hour, days from preferred date, etc.
3. Output JSON ONLY — no preamble, no markdown fences. Schema:
   [{"start":"<exact ISO from candidates>","reason":"<one sentence>"}, ...]

Strict rules:
- "start" must be EXACTLY one of the candidate ISO strings, copied byte-
  for-byte. Never invent a time.
- 3 entries unless the shortlist had fewer; then return all of them.
- Each reason must be <= 140 characters and end with a period.
- No extra fields, no comments, no markdown.`;

function buildPrompt(args: {
  candidates: SlotCandidate[];
  category: string | null;
  anchor: string | null;
  context: string | null;
}): string {
  const lines: string[] = [];
  lines.push('Project context:');
  lines.push(`- Category: ${args.category || '(none specified)'}`);
  if (args.anchor) lines.push(`- Anchor / preferred date: ${args.anchor}`);
  if (args.context) lines.push(`- Notes: ${args.context}`);
  lines.push('');
  lines.push('Candidate slots (sorted by heuristic score, higher = better):');
  for (const c of args.candidates) {
    lines.push(
      `- ${c.start} | score=${c.score}${c.tags.length ? ` | ${c.tags.join(',')}` : ''}`
    );
  }
  lines.push('');
  lines.push('Pick 3. Output JSON only.');
  return lines.join('\n');
}

function parseLLMResponse(
  text: string,
  candidates: SlotCandidate[]
): SlotSuggestion[] {
  // Tolerate accidental ```json fences even though the prompt says no.
  const trimmed = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const validStarts = new Set(candidates.map((c) => c.start));
  const tagsByStart = new Map(candidates.map((c) => [c.start, c.tags]));

  const out: SlotSuggestion[] = [];
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) continue;
    const obj = item as Record<string, unknown>;
    const start = typeof obj.start === 'string' ? obj.start : null;
    const reason = typeof obj.reason === 'string' ? obj.reason : null;
    if (!start || !reason || !validStarts.has(start)) continue;
    out.push({
      start,
      reason: reason.length > 200 ? reason.slice(0, 200) + '…' : reason,
      tags: tagsByStart.get(start) ?? [],
    });
    if (out.length >= 3) break;
  }
  return out;
}

function localTop3(candidates: SlotCandidate[]): SlotSuggestion[] {
  return candidates.slice(0, 3).map((c) => ({
    start: c.start,
    reason: describeTags(c.tags) || 'Open slot in your calendar.',
    tags: c.tags,
  }));
}

function describeTags(tags: string[]): string {
  if (tags.length === 0) return '';
  const parts: string[] = [];
  if (tags.includes('matches-preferred-date')) parts.push('matches your preferred date');
  if (tags.includes('near-preferred-date')) parts.push('close to your preferred date');
  if (tags.includes('golden-hour')) parts.push('golden-hour outdoor light');
  if (tags.includes('late-afternoon')) parts.push('late-afternoon light');
  if (tags.includes('weekend')) parts.push('weekend availability');
  if (parts.length === 0) return '';
  const joined = parts.join(' + ');
  return `${joined.charAt(0).toUpperCase() + joined.slice(1)}.`;
}
