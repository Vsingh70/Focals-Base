import 'server-only';
import type Anthropic from '@anthropic-ai/sdk';
import type { ExtractedContent } from './extractors';

/**
 * Subset of CreateProjectInput plus the raw extracted client name (which the
 * caller will fuzzy-match against the user's existing clients table) and a
 * source_excerpt the UI uses to show the user *where* in the document each
 * project came from.
 */
export type ProposedProject = {
  title: string;
  client_name: string | null;
  category: string | null;
  status: ProjectStatus | null;
  shoot_date: string | null;     // ISO datetime or YYYY-MM-DD
  location: string | null;
  package_price: number | null;
  amount_paid: number | null;
  payment_status: PaymentStatus | null;
  notes: string | null;
  source_excerpt: string;
};

export type ProjectStatus =
  | 'inquiry'
  | 'booked'
  | 'in_progress'
  | 'editing'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type ExtractionResult = {
  projects: ProposedProject[];
  warnings: string[];
  inputTokens: number;
  outputTokens: number;
};

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_OUTPUT_TOKENS = 4096;

const SYSTEM_PROMPT = `You extract photography-business project data from documents.

The user is a photographer using a CRM. They've uploaded a file that may contain
one or many projects: bookings, inquiries, invoices, contracts, exported CRM
data, screenshots of messages, etc.

Your job: read the document and return a list of project records. Each record
must conform to the project schema below. If a field isn't clearly present in
the document, return null for that field — never invent values.

Schema fields (all required keys, but most accept null):
- title (string, required): a short human label for the project. If missing,
  synthesize one like "Wedding for Sarah Johnson" using available context.
- client_name (string|null): the client's full name as it appears in the
  document. Do not normalize, lowercase, or shorten it. If multiple clients
  appear for one project (e.g. couple), use the primary contact.
- category (string|null): free-text descriptor like "wedding", "portrait",
  "editorial", "graduation", "engagement", "family". Lowercase singular noun.
- status: one of [inquiry, booked, in_progress, editing, delivered, completed,
  cancelled] or null.
- shoot_date (string|null): ISO 8601. Prefer "YYYY-MM-DDTHH:MM" if a time is
  given; otherwise "YYYY-MM-DD". Do not include timezone suffixes.
- location (string|null): venue, address, or city.
- package_price (number|null): total price in dollars (NOT cents). Strip "$"
  and commas. If "$2,500" return 2500.
- amount_paid (number|null): money already received. Same dollar units.
- payment_status: one of [unpaid, partial, paid] or null. Infer from
  package_price vs. amount_paid if obvious, otherwise null.
- notes (string|null): anything else worth keeping (special requests, deliverables,
  travel notes). Keep under 500 characters.
- source_excerpt (string, required): 1–2 sentences quoted or paraphrased from
  the document showing WHERE you found this project's data. Used in the UI to
  build user trust. Max 200 characters.

Calling rules:
- Always respond with the propose_projects tool — never with raw text.
- If you find no project-shaped data at all, return projects=[] and put a
  clear explanation in warnings (e.g. ["File appears to be a recipe, not project data"]).
- If a field is genuinely ambiguous, use null and add a warning identifying
  the project (e.g. ["Sarah Johnson row: couldn't tell if status is 'booked' or 'in_progress'"]).
- Be conservative: it's far better to return null than to hallucinate values.`;

const TOOL_DEFINITION = {
  name: 'propose_projects',
  description: 'Submit the list of projects extracted from the document.',
  input_schema: {
    type: 'object' as const,
    required: ['projects', 'warnings'],
    properties: {
      projects: {
        type: 'array',
        description: 'One entry per project found in the document. Empty if none.',
        items: {
          type: 'object',
          required: ['title', 'source_excerpt'],
          properties: {
            title: { type: 'string', maxLength: 200 },
            client_name: { type: ['string', 'null'], maxLength: 200 },
            category: { type: ['string', 'null'], maxLength: 60 },
            status: {
              type: ['string', 'null'],
              enum: [
                'inquiry',
                'booked',
                'in_progress',
                'editing',
                'delivered',
                'completed',
                'cancelled',
                null,
              ],
            },
            shoot_date: { type: ['string', 'null'] },
            location: { type: ['string', 'null'], maxLength: 200 },
            package_price: { type: ['number', 'null'], minimum: 0 },
            amount_paid: { type: ['number', 'null'], minimum: 0 },
            payment_status: {
              type: ['string', 'null'],
              enum: ['unpaid', 'partial', 'paid', null],
            },
            notes: { type: ['string', 'null'], maxLength: 500 },
            source_excerpt: { type: 'string', maxLength: 250 },
          },
        },
      },
      warnings: {
        type: 'array',
        items: { type: 'string' },
        description: 'Field-level uncertainty or document-level notes.',
      },
    },
  },
};

function buildUserPrompt(content: ExtractedContent, existingClientNames: string[]): string {
  const clientList =
    existingClientNames.length === 0
      ? 'The user has no existing clients in their CRM yet.'
      : `The user already has these clients in their CRM:\n${existingClientNames
          .map((n) => `- ${n}`)
          .join('\n')}\n\nIf an extracted client_name appears to match an existing one, use the existing client's spelling exactly.`;

  if (content.kind === 'text') {
    return `${clientList}\n\n--- DOCUMENT START ---\n${content.text}\n--- DOCUMENT END ---${
      content.truncated
        ? '\n\n(Note: document was truncated. Extract what you can from what is visible.)'
        : ''
    }`;
  }
  // For images, the actual image goes in a separate content block; this prompt
  // accompanies it.
  return `${clientList}\n\nThe attached image contains photography project data. Extract every project visible in the image.`;
}

export async function extractProjectsFromContent(
  content: ExtractedContent,
  existingClientNames: string[],
  llm: Anthropic
): Promise<ExtractionResult> {
  const userPromptText = buildUserPrompt(content, existingClientNames);

  const userMessage: Anthropic.MessageParam =
    content.kind === 'image'
      ? {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: content.mediaType,
                data: content.base64,
              },
            },
            { type: 'text', text: userPromptText },
          ],
        }
      : {
          role: 'user',
          content: [{ type: 'text', text: userPromptText }],
        };

  const response = await llm.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: 'tool', name: 'propose_projects' },
    messages: [userMessage],
  });

  // Find the tool_use block. With tool_choice forced, Claude must call the
  // tool, but be defensive.
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );
  if (!toolUse) {
    return {
      projects: [],
      warnings: ['LLM did not return a structured response. Try a different file.'],
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }

  const raw = toolUse.input as { projects?: unknown; warnings?: unknown };
  const projects = Array.isArray(raw.projects)
    ? (raw.projects as ProposedProject[]).map(normalizeProposedProject)
    : [];
  const warnings = Array.isArray(raw.warnings) ? (raw.warnings as string[]) : [];

  return {
    projects,
    warnings,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/**
 * Defensive normalization. The LLM is reasonably good at staying within the
 * tool schema but we don't trust it. Coerce types, clamp lengths, drop empty
 * strings, reject out-of-range values. Mirrors the helpers in
 * src/lib/inquiries/parsers.ts in spirit.
 */
function normalizeProposedProject(raw: ProposedProject): ProposedProject {
  function s(v: unknown, max: number): string | null {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    if (t.length === 0) return null;
    return t.length > max ? t.slice(0, max) : t;
  }
  function n(v: unknown): number | null {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null;
    return v;
  }
  const validStatus = (
    [
      'inquiry',
      'booked',
      'in_progress',
      'editing',
      'delivered',
      'completed',
      'cancelled',
    ] as const
  ).includes(raw.status as ProjectStatus)
    ? (raw.status as ProjectStatus)
    : null;
  const validPayment = (['unpaid', 'partial', 'paid'] as const).includes(
    raw.payment_status as PaymentStatus
  )
    ? (raw.payment_status as PaymentStatus)
    : null;
  return {
    title: s(raw.title, 200) ?? 'Untitled project',
    client_name: s(raw.client_name, 200),
    category: s(raw.category, 60),
    status: validStatus,
    shoot_date: s(raw.shoot_date, 50),
    location: s(raw.location, 200),
    package_price: n(raw.package_price),
    amount_paid: n(raw.amount_paid),
    payment_status: validPayment,
    notes: s(raw.notes, 500),
    source_excerpt: s(raw.source_excerpt, 250) ?? '',
  };
}
