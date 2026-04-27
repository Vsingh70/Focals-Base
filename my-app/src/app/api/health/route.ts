import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Health check endpoint. Public — used by uptime monitors, Vercel health
 * checks, etc. Returns 200 with a small JSON body if the process can
 * reach Supabase; 503 otherwise so monitors mark the deploy degraded.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    const admin = createAdminClient();
    // Cheap query — just reads the schema, no data scan.
    const { error } = await admin.from('profiles').select('id').limit(1).maybeSingle();
    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          error: error.message,
          duration_ms: Date.now() - startedAt,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({
      status: 'ok',
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'down',
        error: err instanceof Error ? err.message : 'unknown',
        duration_ms: Date.now() - startedAt,
      },
      { status: 503 }
    );
  }
}
