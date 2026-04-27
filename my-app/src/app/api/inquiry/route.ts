import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseInquiry } from '@/lib/inquiries/parsers';
import type { Json } from '@/lib/supabase/types';

// Allow any origin to POST from embedded website widgets, Resend webhooks,
// Zapier flows, etc. Tokens (per-source) are the actual auth gate.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Inquiry-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function extractToken(request: NextRequest): string | null {
  const headerToken = request.headers.get('x-inquiry-token');
  if (headerToken) return headerToken;
  const queryToken = request.nextUrl.searchParams.get('token');
  if (queryToken) return queryToken;
  return null;
}

export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json(
      { error: 'Missing token (use X-Inquiry-Token header or ?token= query)' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const parsed = parseInquiry(body);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          'Could not extract inquiry from payload. Expected widget shape, Resend inbound-email payload, or generic JSON with at least a name field.',
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const admin = createAdminClient();

  // Resolve the owning user_id via the token on an active inquiry_sources row.
  const { data: source, error: sourceError } = await admin
    .from('inquiry_sources')
    .select('id, user_id, label, type')
    .eq('is_active', true)
    .filter('config->>token', 'eq', token)
    .limit(1)
    .maybeSingle();

  if (sourceError) {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
  if (!source) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // source_handle precedence:
  //  1. explicit value extracted by the parser (e.g. "Sarah Johnson <sarah@example.com>")
  //  2. label configured on the inquiry source row (anti-spoof: caller can't change this)
  const sourceHandle = parsed.source_handle ?? source.label;

  const { error: insertError } = await admin.from('inquiries').insert({
    user_id: source.user_id,
    source: parsed.source,
    source_handle: sourceHandle,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    shoot_type: parsed.shoot_type,
    preferred_date: parsed.preferred_date,
    message: parsed.message,
    status: 'new',
    raw_payload: body as Json,
  });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ success: true }, { status: 201, headers: CORS_HEADERS });
}
