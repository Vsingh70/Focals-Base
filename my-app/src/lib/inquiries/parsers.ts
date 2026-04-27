/**
 * Parsers for inbound inquiry webhooks. The /api/inquiry endpoint accepts
 * payloads from a variety of integrations (the embeddable widget, Resend
 * inbound email, Zapier, Typeform, raw JSON, etc.). Each parser inspects a
 * payload and either returns a normalized inquiry or signals "not my shape".
 *
 * The dispatcher tries parsers in priority order. The first one that
 * returns a value wins. If no parser matches, the request is rejected.
 */

export type ParsedInquiry = {
  name: string;
  email: string | null;
  phone: string | null;
  shoot_type: string | null;
  preferred_date: string | null;
  message: string | null;
  source: 'website_form' | 'email' | 'instagram' | 'manual';
  source_handle: string | null;
};

export type Parser = {
  name: string;
  parse: (body: unknown) => ParsedInquiry | null;
};

// ---------- shared helpers ----------

function s(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function pickFirst<T>(...vals: (T | null | undefined)[]): T | null {
  for (const v of vals) if (v != null) return v;
  return null;
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function clamp(s: string | null, max: number): string | null {
  if (s == null) return null;
  return s.length > max ? s.slice(0, max) : s;
}

// Extract a name from an RFC-5322 "From" header like
// `Sarah Johnson <sarah@example.com>`. Falls back to the email's local part.
function nameFromAddress(rawFrom: string | null): { name: string | null; email: string | null } {
  if (!rawFrom) return { name: null, email: null };
  const match = rawFrom.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim() || null, email: match[2].trim() || null };
  }
  const bareEmail = rawFrom.match(/^[^@\s]+@[^@\s]+$/);
  if (bareEmail) {
    const local = rawFrom.split('@')[0];
    const guess = local.replace(/[._-]+/g, ' ').trim();
    return { name: guess || null, email: rawFrom.trim() };
  }
  return { name: null, email: null };
}

// ---------- widget parser ----------

const widgetParser: Parser = {
  name: 'widget',
  parse(body) {
    if (!isObject(body)) return null;
    // Widget always sends a `name` string and no email-shaped envelope.
    const name = s(body.name);
    if (!name) return null;
    if ('from' in body || 'envelope' in body || 'to' in body) return null; // looks like email payload
    return {
      name: clamp(name, 200) ?? name,
      email: clamp(s(body.email), 200),
      phone: clamp(s(body.phone), 60),
      shoot_type: clamp(s(body.shoot_type), 100),
      preferred_date: s(body.preferred_date),
      message: clamp(s(body.message), 5000),
      source: 'website_form',
      source_handle: clamp(s(body.source_label), 200),
    };
  },
};

// ---------- Resend inbound-email parser ----------
// Resend's inbound-parse webhook delivers something like:
// {
//   from: 'Sarah Johnson <sarah@example.com>',
//   to: ['inquiries@vflics.com'],
//   subject: 'Wedding photography inquiry',
//   text: '...plain-text body...',
//   html: '...html body...',
//   headers: { ... },
// }
// (Some providers wrap this in `data` or `payload`; we handle that too.)

const resendParser: Parser = {
  name: 'resend',
  parse(body) {
    if (!isObject(body)) return null;
    const data = isObject(body.data) ? body.data : isObject(body.payload) ? body.payload : body;
    if (!isObject(data)) return null;

    const from = s(data.from);
    const subject = s(data.subject);
    const text = s(data.text);
    const html = s(data.html);

    // Heuristic: requires `from` AND at least one of (subject, text, html).
    if (!from) return null;
    if (!subject && !text && !html) return null;

    const { name, email } = nameFromAddress(from);
    const fallbackName = name ?? email ?? from;
    const messageBody = pickFirst(text, stripHtml(html));

    return {
      name: clamp(fallbackName, 200) ?? fallbackName,
      email: clamp(email, 200),
      phone: null,
      shoot_type: clamp(subject, 100),
      preferred_date: null,
      message: clamp(messageBody, 5000),
      source: 'email',
      source_handle: clamp(from, 200),
    };
  },
};

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Generic JSON parser ----------
// Best-effort: pluck common field names. Last in the priority list because
// it's the most permissive — only used if no specific shape matched.

const NAME_KEYS = ['name', 'full_name', 'fullName', 'fullname', 'firstName', 'first_name'];
const EMAIL_KEYS = ['email', 'emailAddress', 'email_address', 'mail'];
const PHONE_KEYS = ['phone', 'phoneNumber', 'phone_number', 'tel', 'telephone'];
const MESSAGE_KEYS = ['message', 'body', 'description', 'notes', 'comments', 'content'];
const SHOOT_KEYS = ['shoot_type', 'shootType', 'type', 'category', 'subject'];
const DATE_KEYS = ['preferred_date', 'preferredDate', 'date', 'shoot_date', 'shootDate'];

function findKey(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    if (k in obj) {
      const v = s(obj[k]);
      if (v) return v;
    }
  }
  // Try lowercased keys too (some senders capitalize)
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) lower[k.toLowerCase()] = v;
  for (const k of keys) {
    const lk = k.toLowerCase();
    if (lk in lower) {
      const v = s(lower[lk]);
      if (v) return v;
    }
  }
  return null;
}

const genericParser: Parser = {
  name: 'generic',
  parse(body) {
    if (!isObject(body)) return null;
    // Some senders wrap the actual payload in `data` / `fields` / `payload`.
    const candidates = [body];
    if (isObject(body.data)) candidates.push(body.data);
    if (isObject(body.fields)) candidates.push(body.fields);
    if (isObject(body.payload)) candidates.push(body.payload);

    for (const cand of candidates) {
      const name = findKey(cand, NAME_KEYS);
      if (!name) continue;
      const email = findKey(cand, EMAIL_KEYS);
      const phone = findKey(cand, PHONE_KEYS);
      const message = findKey(cand, MESSAGE_KEYS);
      const shootType = findKey(cand, SHOOT_KEYS);
      const date = findKey(cand, DATE_KEYS);

      return {
        name: clamp(name, 200) ?? name,
        email: clamp(email, 200),
        phone: clamp(phone, 60),
        shoot_type: clamp(shootType, 100),
        preferred_date: date && /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : null,
        message: clamp(message, 5000),
        source: 'website_form',
        source_handle: null,
      };
    }
    return null;
  },
};

// ---------- Dispatcher ----------

const PARSERS: Parser[] = [widgetParser, resendParser, genericParser];

export function parseInquiry(body: unknown): ParsedInquiry | null {
  for (const parser of PARSERS) {
    const result = parser.parse(body);
    if (result) return result;
  }
  return null;
}

export function listParserNames(): string[] {
  return PARSERS.map((p) => p.name);
}
