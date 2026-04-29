/**
 * Fuzzy match an LLM-extracted client name against the user's existing
 * clients table. Pure function, no IO. Used both server-side (to annotate
 * proposed projects) and as documentation for the UI's client-resolution
 * affordances.
 *
 * Algorithm: combined token-overlap + Levenshtein-ratio score per candidate,
 * then bucketed:
 *   confident   ≥ 0.85 single best
 *   ambiguous   0.55–0.85 OR multiple candidates within 0.05 of the top
 *   none        otherwise
 *
 * Names are normalized: lowercased, accents stripped, punctuation removed,
 * collapsed whitespace. So "Sarah J." matches "sarah j" matches "Sarah J".
 */

export type ClientMatch =
  | { kind: 'confident'; clientId: string; matchedName: string; score: number }
  | { kind: 'ambiguous'; candidates: ScoredCandidate[] }
  | { kind: 'none'; suggestedName: string };

export type ScoredCandidate = { id: string; full_name: string; score: number };

const CONFIDENT_THRESHOLD = 0.85;
const AMBIGUOUS_FLOOR = 0.55;
const AMBIGUITY_GAP = 0.05;

function normalize(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(name: string): string[] {
  const norm = normalize(name);
  if (!norm) return [];
  return norm.split(' ');
}

function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  // Shared tokens / max length. Treats 1-char tokens as initials matching
  // any token starting with that letter (so "Sarah J" matches "Sarah Johnson").
  const setB = new Set(b);
  let shared = 0;
  for (const t of a) {
    if (setB.has(t)) {
      shared += 1;
      continue;
    }
    if (t.length === 1) {
      // initial — match any longer token starting with this letter
      if (b.some((other) => other.length > 1 && other.startsWith(t))) shared += 0.7;
    }
  }
  return shared / Math.max(a.length, b.length);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const dp = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      prev = tmp;
    }
  }
  return dp[n];
}

function levenshteinRatio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

function scoreOne(extracted: string, candidate: string): number {
  const a = normalize(extracted);
  const c = normalize(candidate);
  if (!a || !c) return 0;
  if (a === c) return 1;

  const overlap = tokenOverlap(a.split(' '), c.split(' '));
  const ratio = levenshteinRatio(a, c);
  // Token overlap dominates because human names vary in length but share
  // tokens — "Sarah J" vs "Sarah J Johnson" should score high.
  return Math.max(overlap, ratio * 0.85);
}

export function matchClientName(
  extracted: string,
  clients: { id: string; full_name: string }[]
): ClientMatch {
  const cleaned = extracted.trim();
  if (!cleaned) return { kind: 'none', suggestedName: '' };

  if (clients.length === 0) {
    return { kind: 'none', suggestedName: cleaned };
  }

  const scored: ScoredCandidate[] = clients
    .map((c) => ({ ...c, score: scoreOne(cleaned, c.full_name) }))
    .filter((c) => c.score >= AMBIGUOUS_FLOOR)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { kind: 'none', suggestedName: cleaned };
  }

  const top = scored[0];

  // If the top candidate is confident AND no other candidate is within the
  // ambiguity gap, accept it.
  if (top.score >= CONFIDENT_THRESHOLD) {
    const close = scored.filter((c) => top.score - c.score < AMBIGUITY_GAP);
    if (close.length === 1) {
      return { kind: 'confident', clientId: top.id, matchedName: top.full_name, score: top.score };
    }
    return { kind: 'ambiguous', candidates: close.slice(0, 4) };
  }

  // Sub-confident but above the floor → ambiguous
  return { kind: 'ambiguous', candidates: scored.slice(0, 4) };
}
