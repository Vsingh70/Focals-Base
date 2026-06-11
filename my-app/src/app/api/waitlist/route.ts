import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { waitlistSchema } from '@/lib/validations/waitlist';

// The landing pages are served from a different origin than this app, so the
// route must answer cross-origin preflights and include CORS headers.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Waitlist-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!rateLimit(`waitlist:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': '60' } }
    );
  }

  // Optional shared-secret gate. Set WAITLIST_TOKEN in env to require it, and
  // put the same value in window.LENSLATE_WAITLIST_TOKEN on the pages.
  const required = process.env.WAITLIST_TOKEN;
  if (required && request.headers.get('x-waitlist-token') !== required) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a valid email.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Honeypot tripped — pretend success so bots can't detect the drop.
  if (parsed.data.hp && parsed.data.hp.trim() !== '') {
    return NextResponse.json({ ok: true }, { status: 201, headers: CORS_HEADERS });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('waitlist_signups').insert({
    email: parsed.data.email,
    source: parsed.data.source ?? null,
    user_agent: request.headers.get('user-agent'),
  });

  if (error) {
    // 23505 = unique_violation → already on the list. Frontend treats 409 as success.
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { ok: true, duplicate: true },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { error: 'Could not join right now.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: CORS_HEADERS });
}
