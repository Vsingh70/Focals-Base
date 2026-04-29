import 'server-only';

/**
 * File-format extraction. Each format maps to either plain text (passed to
 * Claude as a text block) or a base64-encoded image (passed as a vision
 * input). The dispatcher picks based on MIME type.
 */
export type ExtractedContent =
  | { kind: 'text'; text: string; truncated: boolean }
  | { kind: 'image'; mediaType: 'image/jpeg' | 'image/png'; base64: string };

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Loose upper bound that still leaves comfortable headroom under Claude's
// 200K-token (Sonnet) / 200K-token (Haiku 4.5) context window. ~4 chars/token
// in typical English; we cap text payloads at 600,000 chars (~150K tokens).
const MAX_TEXT_CHARS = 600_000;

export type ExtractError =
  | { code: 'unsupported_type'; message: string }
  | { code: 'too_large'; message: string }
  | { code: 'parse_failed'; message: string };

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_TEXT_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_TEXT_CHARS), truncated: true };
}

async function extractPdf(buf: Buffer): Promise<{ text: string; truncated: boolean }> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const result = await parser.getText();
    return truncate(result.text);
  } finally {
    await parser.destroy();
  }
}

async function extractCsv(buf: Buffer): Promise<{ text: string; truncated: boolean }> {
  const { default: Papa } = await import('papaparse');
  const raw = buf.toString('utf-8');
  const parsed = Papa.parse<string[]>(raw, { skipEmptyLines: true });
  // Re-emit as a tab-separated text block — easier for the LLM to scan than
  // raw CSV with embedded quotes/commas, and lets us drop quoting noise.
  const lines = (parsed.data as string[][])
    .map((row) => row.map((cell) => String(cell ?? '').trim()).join('\t'))
    .join('\n');
  return truncate(lines);
}

async function extractXlsx(buf: Buffer): Promise<{ text: string; truncated: boolean }> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'buffer' });
  const chunks: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t', RS: '\n' });
    if (csv.trim()) {
      chunks.push(`# Sheet: ${sheetName}\n${csv}`);
    }
  }
  return truncate(chunks.join('\n\n'));
}

async function extractDocx(buf: Buffer): Promise<{ text: string; truncated: boolean }> {
  const { default: mammoth } = await import('mammoth');
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return truncate(value);
}

function extractTxt(buf: Buffer): { text: string; truncated: boolean } {
  return truncate(buf.toString('utf-8'));
}

async function extractImage(
  buf: Buffer,
  mimeType: string
): Promise<{ mediaType: 'image/jpeg' | 'image/png'; base64: string }> {
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    const heicConvert = (await import('heic-convert')).default;
    const converted = await heicConvert({
      buffer: new Uint8Array(buf) as never,
      format: 'JPEG',
      quality: 0.9,
    });
    return {
      mediaType: 'image/jpeg',
      base64: Buffer.from(converted).toString('base64'),
    };
  }
  const mediaType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  return { mediaType, base64: buf.toString('base64') };
}

/**
 * Resolves the actual MIME type from what the browser told us plus the
 * filename extension. Browsers regularly mis-type CSVs as
 * application/octet-stream and Word docs as application/zip.
 */
function resolveMimeType(declared: string, filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  if (declared && declared !== 'application/octet-stream') return declared;
  switch (ext) {
    case 'pdf':  return 'application/pdf';
    case 'csv':  return 'text/csv';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls':  return 'application/vnd.ms-excel';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt':  return 'text/plain';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png':  return 'image/png';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    default:     return declared || 'application/octet-stream';
  }
}

export type ExtractInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string; // browser-declared
};

/**
 * Run the right extractor for the file. Returns either text or image content
 * suitable for direct inclusion in a Claude `messages.create` call.
 */
export async function extract(
  input: ExtractInput
): Promise<{ ok: true; content: ExtractedContent; resolvedMimeType: string } | { ok: false; error: ExtractError }> {
  if (input.buffer.byteLength > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: {
        code: 'too_large',
        message: `File is ${(input.buffer.byteLength / 1024 / 1024).toFixed(1)}MB. Max is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
      },
    };
  }

  const resolved = resolveMimeType(input.mimeType, input.filename);

  if (!SUPPORTED_MIME_TYPES.includes(resolved as (typeof SUPPORTED_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: {
        code: 'unsupported_type',
        message: `File type "${resolved}" is not supported. Try PDF, CSV, XLSX, DOCX, TXT, JPG, PNG, or HEIC.`,
      },
    };
  }

  try {
    if (resolved === 'application/pdf') {
      const r = await extractPdf(input.buffer);
      return { ok: true, content: { kind: 'text', ...r }, resolvedMimeType: resolved };
    }
    if (resolved === 'text/csv') {
      const r = await extractCsv(input.buffer);
      return { ok: true, content: { kind: 'text', ...r }, resolvedMimeType: resolved };
    }
    if (
      resolved === 'application/vnd.ms-excel' ||
      resolved === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      const r = await extractXlsx(input.buffer);
      return { ok: true, content: { kind: 'text', ...r }, resolvedMimeType: resolved };
    }
    if (resolved === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const r = await extractDocx(input.buffer);
      return { ok: true, content: { kind: 'text', ...r }, resolvedMimeType: resolved };
    }
    if (resolved === 'text/plain') {
      const r = extractTxt(input.buffer);
      return { ok: true, content: { kind: 'text', ...r }, resolvedMimeType: resolved };
    }
    // image/* path
    const r = await extractImage(input.buffer, resolved);
    return { ok: true, content: { kind: 'image', ...r }, resolvedMimeType: resolved };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown extraction error';
    return { ok: false, error: { code: 'parse_failed', message } };
  }
}
