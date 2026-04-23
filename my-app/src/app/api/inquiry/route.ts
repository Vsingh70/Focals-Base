import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicInquirySchema } from '@/lib/validations/inquiries';
import type { Json } from '@/lib/supabase/types';

// Allow any origin to POST from embedded website widgets.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Inquiry-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-inquiry-token');
  if (!token) {
    return NextResponse.json(
      { error: 'Missing X-Inquiry-Token header' },
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

  const parsed = publicInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
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

  const { source_label, ...payload } = parsed.data;

  const { error: insertError } = await admin.from('inquiries').insert({
    user_id: source.user_id,
    source: 'website_form',
    source_handle: source_label ?? source.label,
    name: payload.name,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    shoot_type: payload.shoot_type ?? null,
    preferred_date: payload.preferred_date ?? null,
    message: payload.message ?? null,
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
