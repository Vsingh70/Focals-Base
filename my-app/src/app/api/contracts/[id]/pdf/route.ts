import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { ContractPdf } from '@/lib/pdf/contract';

// Force Node.js runtime — @react-pdf/renderer uses native streams/buffers.
export const runtime = 'nodejs';

type Props = {
  params: Promise<{ id: string }>;
};

type ContractDetail = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  custom_fields: Record<string, string> | null;
  clients: { full_name: string | null } | { full_name: string | null }[] | null;
  projects: { title: string | null } | { title: string | null }[] | null;
};

function firstOrSelf<T>(v: T | T[] | null): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function parseCustomFields(raw: unknown): Array<{ key: string; value: string }> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string' && v.length > 0)
    .map(([key, value]) => ({ key, value: String(value) }));
}

function safeFileName(title: string) {
  return title.replace(/[^a-zA-Z0-9-_ ]+/g, '').trim().slice(0, 80) || 'contract';
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const [contractRes, profileRes] = await Promise.all([
    supabase
      .from('contracts')
      .select(
        'id, title, body, created_at, custom_fields, clients(full_name), projects(title)'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name, business_name')
      .eq('id', user.id)
      .single(),
  ]);

  if (contractRes.error) {
    return new NextResponse('Internal error', { status: 500 });
  }
  if (!contractRes.data) {
    return new NextResponse('Not found', { status: 404 });
  }

  const row = contractRes.data as ContractDetail;
  const profile = profileRes.data;
  const client = firstOrSelf(row.clients);
  const project = firstOrSelf(row.projects);

  const buffer = await renderToBuffer(
    ContractPdf({
      title: row.title,
      body: row.body,
      businessName: profile?.business_name ?? null,
      photographerName: profile?.full_name ?? null,
      clientName: client?.full_name ?? null,
      projectTitle: project?.title ?? null,
      contractId: row.id,
      createdAt: row.created_at,
      customFields: parseCustomFields(row.custom_fields),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFileName(row.title)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
