/**
 * Pure function that proposes candidate shoot slots in the next 30 days
 * (or 14 days when an `anchor` is provided). The output is a ranked
 * shortlist that the LLM ranking step then narrows down to 3 with reasons.
 *
 * Wall-clock semantics: all stored shoot_date values are anchored at +00
 * with their UTC components matching the digits the photographer typed.
 * To compare slots, we work entirely in wall-clock UTC: the candidate
 * times we generate are also UTC, so a "10:00 AM" candidate compared
 * against a "10:00 AM" stored shoot_date collides cleanly without ever
 * touching the server's local timezone. See globals.css + LocalDateBadge
 * for the rendering side of the same convention.
 */

const DEFAULT_DURATION_MIN = 60;
const COLLISION_BUFFER_MIN = 60; // ±60 min of an existing shoot

/** Categories the heuristic treats as "outdoor" → prefer golden hour. */
const OUTDOOR_CATEGORIES = new Set([
  'portrait',
  'family',
  'wedding',
  'engagement',
  'maternity',
  'senior',
  'graduation',
  'lifestyle',
  'editorial',
  'fashion',
]);

/** Categories the heuristic treats as weekend-friendly. */
const WEEKEND_CATEGORIES = new Set([
  'wedding',
  'family',
  'portrait',
  'engagement',
  'maternity',
  'graduation',
  'senior',
]);

export type SlotCandidate = {
  /**
   * Wall-clock ISO string suitable for storing as `shoot_date` directly.
   * Always at minute granularity, anchored at +00.
   */
  start: string;
  /**
   * 0–100. Higher = more recommended. Computed locally; the LLM step
   * uses this only as a tie-break hint.
   */
  score: number;
  /**
   * Short tags the LLM can use to explain the choice without re-deriving
   * the rationale itself.
   */
  tags: string[];
};

export type SuggestSlotsInput = {
  /** ISO strings (e.g. "2026-05-10T08:30:00.000Z") of existing shoots. */
  existingShootDates: string[];
  /** Free-text category from the project. Lower-cased + trimmed inside. */
  category?: string | null;
  /**
   * If the user already has a target day in mind (e.g. inquiry.preferred_date,
   * usually "YYYY-MM-DD" but tolerated as a full ISO too). Boosts slots
   * within ±3 days of this anchor.
   */
  anchor?: string | null;
  /**
   * Defaults to "now" but injectable for tests.
   */
  now?: Date;
  /** How many slots to keep. Defaults to 20 — the LLM ranking step's input. */
  limit?: number;
};

export function suggestSlots(input: SuggestSlotsInput): SlotCandidate[] {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 20;
  const cat = (input.category ?? '').trim().toLowerCase();
  const isOutdoor = matchesAny(cat, OUTDOOR_CATEGORIES);
  const prefersWeekend = matchesAny(cat, WEEKEND_CATEGORIES);

  // Pull anchor day (UTC). Works whether anchor is a bare YYYY-MM-DD or a
  // full ISO; we only care about the calendar day in UTC.
  const anchorDay = parseAnchorDay(input.anchor, now);

  // Window: next 30 days from "tomorrow" (don't propose today since the
  // user is presumably setting this up for the future). When an anchor
  // is in play, narrow to ±10 days around it.
  const startDay = startOfNextDayUTC(now);
  let endDay = addDaysUTC(startDay, 30);
  if (anchorDay) {
    const anchorMinus10 = addDaysUTC(anchorDay, -10);
    const anchorPlus10 = addDaysUTC(anchorDay, 10);
    if (anchorMinus10.getTime() > startDay.getTime()) {
      // Allow some look-back if the anchor is far enough out.
      // Otherwise leave startDay as "tomorrow".
    }
    endDay = anchorPlus10;
  }

  // Bucket existing shoots by UTC-day-key for O(1) collision checks.
  const occupiedByDay = new Map<string, Date[]>();
  for (const iso of input.existingShootDates) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const key = utcDayKey(d);
    const list = occupiedByDay.get(key);
    if (list) list.push(d);
    else occupiedByDay.set(key, [d]);
  }

  // Candidate hours of day in UTC (since shoot_date wall-clock components
  // ARE the UTC components after our +00 anchoring). Indoor/commercial
  // bias toward business-hours; outdoor leans late afternoon.
  const indoorHours = [10, 11, 13, 14, 15, 16];
  const outdoorHours = [9, 14, 16, 17, 18];
  const hours = isOutdoor ? outdoorHours : indoorHours;

  const candidates: SlotCandidate[] = [];

  for (
    let day = new Date(startDay.getTime());
    day.getTime() < endDay.getTime();
    day = addDaysUTC(day, 1)
  ) {
    const dow = day.getUTCDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dow === 0 || dow === 6;

    for (const hour of hours) {
      const slot = new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          hour,
          0,
          0
        )
      );
      if (slot.getTime() <= now.getTime()) continue;
      if (collidesWithExisting(slot, occupiedByDay)) continue;

      const tags: string[] = [];
      let score = 50;

      if (anchorDay) {
        const dayDelta = Math.abs(daysBetweenUTC(anchorDay, slot));
        if (dayDelta === 0) {
          score += 30;
          tags.push('matches-preferred-date');
        } else if (dayDelta <= 3) {
          score += 20 - dayDelta * 4;
          tags.push('near-preferred-date');
        } else if (dayDelta <= 7) {
          score += 8 - dayDelta;
        } else {
          score -= dayDelta;
        }
      }

      if (prefersWeekend) {
        if (isWeekend) {
          score += 15;
          tags.push('weekend');
        } else {
          score -= 8;
        }
      }

      if (isOutdoor && (hour === 17 || hour === 18)) {
        score += 12;
        tags.push('golden-hour');
      } else if (isOutdoor && hour === 16) {
        score += 6;
        tags.push('late-afternoon');
      }

      // Prefer mid-week for editorial/commercial categories
      if (!prefersWeekend && (dow === 2 || dow === 3 || dow === 4)) {
        score += 4;
      }

      // Slight bias against very-soon slots so we don't always pick
      // tomorrow morning.
      const daysOut = daysBetweenUTC(now, slot);
      if (daysOut < 2) score -= 5;
      if (daysOut > 21 && !anchorDay) score -= 4;

      candidates.push({
        start: slot.toISOString(),
        score: Math.max(0, Math.min(100, Math.round(score))),
        tags,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

function matchesAny(text: string, set: Set<string>): boolean {
  if (!text) return false;
  for (const term of set) {
    if (text.includes(term)) return true;
  }
  return false;
}

function utcDayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function startOfNextDayUTC(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  return addDaysUTC(d, 1);
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days, 0, 0, 0)
  );
}

function daysBetweenUTC(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function parseAnchorDay(raw: string | null | undefined, now: Date): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    return new Date(
      Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    );
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  // Normalize to start-of-day UTC for day-distance math
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function collidesWithExisting(
  slot: Date,
  occupiedByDay: Map<string, Date[]>
): boolean {
  const key = utcDayKey(slot);
  const sameDay = occupiedByDay.get(key);
  if (!sameDay) return false;
  const slotStart = slot.getTime();
  const slotEnd = slotStart + DEFAULT_DURATION_MIN * 60_000;
  for (const occupied of sameDay) {
    const occStart = occupied.getTime();
    const occEnd = occStart + DEFAULT_DURATION_MIN * 60_000;
    // Buffer either side
    const bufferMs = COLLISION_BUFFER_MIN * 60_000;
    if (slotStart < occEnd + bufferMs && slotEnd + bufferMs > occStart) {
      return true;
    }
  }
  return false;
}
