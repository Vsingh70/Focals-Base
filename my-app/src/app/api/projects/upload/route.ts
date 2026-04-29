import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extract, MAX_FILE_BYTES } from '@/lib/upload/extractors';
import { extractProjectsFromContent, type ProposedProject } from '@/lib/upload/extractProjects';
import { matchClientName, type ClientMatch } from '@/lib/upload/matchClient';
import { getProvider, MissingApiKeyError } from '@/lib/llm/provider';

// pdf-parse + pdfjs-dist do not work in the Edge runtime; force Node.
export const runtime = 'nodejs';
// File parsing + Claude round-trip can comfortably exceed the default 10s.
export const maxDuration = 60;

export type AnnotatedProposedProject = ProposedProject & {
  rowKey: string;          // stable client-side key for React lists
  clientMatch: ClientMatch;
};

export type UploadResponse = {
  jobId: string;
  filename: string;
  projects: AnnotatedProposedProject[];
  warnings: string[];
  truncated: boolean;
};

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse multipart
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded (expected form field "file")' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        error: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Max is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
      },
      { status: 413 }
    );
  }

  // 3. Pre-create the audit row so we have a jobId to link errors to.
  const { data: jobRow, error: jobInsertError } = await supabase
    .from('project_upload_jobs')
    .insert({
      user_id: user.id,
      filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      status: 'pending',
    })
    .select('id')
    .single();
  if (jobInsertError || !jobRow) {
    return NextResponse.json(
      { error: `Could not start upload: ${jobInsertError?.message ?? 'unknown'}` },
      { status: 500 }
    );
  }
  const jobId = jobRow.id;

  async function failJob(message: string, status: number) {
    await supabase
      .from('project_upload_jobs')
      .update({
        status: 'failed',
        error: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', user!.id);
    return NextResponse.json({ error: message, jobId }, { status });
  }

  // 4. Extract file content
  const buffer = Buffer.from(await file.arrayBuffer());
  const extracted = await extract({
    buffer,
    filename: file.name,
    mimeType: file.type,
  });
  if (!extracted.ok) {
    const status = extracted.error.code === 'too_large' ? 413 : 400;
    return failJob(extracted.error.message, status);
  }
  const truncated =
    extracted.content.kind === 'text' ? extracted.content.truncated : false;

  // 5. Load existing clients for matching + LLM hint list
  const { data: clientsRows, error: clientsError } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('user_id', user.id);
  if (clientsError) {
    return failJob(`Could not load clients: ${clientsError.message}`, 500);
  }
  const clients = clientsRows ?? [];

  // 6. Resolve LLM provider + run extraction
  const provider = getProvider();
  let llm;
  try {
    llm = await provider.getClient(user.id);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return failJob(err.message, 400);
    }
    const message = err instanceof Error ? err.message : 'Unknown LLM error';
    return failJob(message, 500);
  }

  let extraction;
  try {
    extraction = await extractProjectsFromContent(
      extracted.content,
      clients.map((c) => c.full_name),
      llm
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LLM call failed';
    // Common case: revoked key → 401 from Anthropic
    if (message.includes('401') || message.toLowerCase().includes('authentication')) {
      return failJob(
        'Your Anthropic API key was rejected. Re-add it in Settings → Integrations.',
        401
      );
    }
    return failJob(message, 502);
  }

  // 7. Best-effort usage stamp
  await provider.recordUsage(user.id, extraction.inputTokens, extraction.outputTokens);

  // 8. Annotate each proposed project with a client match
  const annotated: AnnotatedProposedProject[] = extraction.projects.map((p, idx) => ({
    ...p,
    rowKey: `${jobId}-${idx}`,
    clientMatch: p.client_name
      ? matchClientName(p.client_name, clients)
      : { kind: 'none', suggestedName: '' },
  }));

  // 9. Mark job extracted
  await supabase
    .from('project_upload_jobs')
    .update({
      status: 'extracted',
      extracted_count: annotated.length,
      input_tokens: extraction.inputTokens,
      output_tokens: extraction.outputTokens,
    })
    .eq('id', jobId)
    .eq('user_id', user.id);

  const body: UploadResponse = {
    jobId,
    filename: file.name,
    projects: annotated,
    warnings: extraction.warnings.concat(
      truncated ? ['Document was truncated; only the first portion was processed.'] : []
    ),
    truncated,
  };

  return NextResponse.json(body, { status: 200 });
}
