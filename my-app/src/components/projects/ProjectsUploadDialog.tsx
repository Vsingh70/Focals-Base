'use client';

import { forwardRef, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { commitUploadedProjects, type CommitProjectRow } from '@/lib/actions/projects';
import type { AnnotatedProposedProject, UploadResponse } from '@/app/api/projects/upload/route';

type ClientLite = { id: string; full_name: string };

const PROJECT_STATUSES = [
  'inquiry',
  'booked',
  'in_progress',
  'editing',
  'delivered',
  'completed',
  'cancelled',
] as const;
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'] as const;

const ACCEPT_MIME =
  '.pdf,.csv,.xlsx,.xls,.docx,.txt,.jpg,.jpeg,.png,.heic,.heif';
const ACCEPT_DESCRIPTION = 'PDF, CSV, XLSX, DOCX, TXT, JPG, PNG, HEIC';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  color: 'var(--color-text-tertiary)',
  marginBottom: '0.25rem',
};

const primaryButton: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const ghostButton: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

type RowState = AnnotatedProposedProject & {
  // User edits + decisions, layered on top of the LLM proposal:
  selected: boolean;
  edited: {
    title: string;
    category: string;
    status: typeof PROJECT_STATUSES[number];
    shoot_date: string;        // datetime-local format or ''
    location: string;
    package_price: string;     // string for empty-state, parsed on commit
    amount_paid: string;
    payment_status: typeof PAYMENT_STATUSES[number];
    notes: string;
  };
  clientChoice:
    | { kind: 'existing'; clientId: string }
    | { kind: 'create'; full_name: string }
    | { kind: 'none' };
};

/**
 * Format an LLM-extracted date string for an <input type="datetime-local">.
 *
 * The tricky case: the LLM often returns a bare "YYYY-MM-DD" with no time.
 * `new Date("2026-02-07")` is treated by JS as UTC midnight, which in any
 * timezone west of UTC renders as the *previous* day at the local
 * UTC-offset time (e.g. 2026-02-06 19:00 in EST). To preserve the user's
 * intent — "Feb 7" — parse date-only strings as a *local* calendar date
 * and leave the time component blank so the UI doesn't fabricate one.
 *
 * Full ISO timestamps (with `T` and a timezone) round-trip normally.
 */
function toDatetimeLocal(raw: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const pad = (n: number) => String(n).padStart(2, '0');

  // Date-only: "YYYY-MM-DD"
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    // Leave time blank — the LLM didn't have one. Letting datetime-local
    // accept "YYYY-MM-DDTHH:mm" with empty HH:mm would be invalid; instead
    // we default to 00:00 in *local* time so the displayed day matches.
    return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00`;
  }

  // Full timestamp (with or without TZ): let Date parse and read in local time
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Serialize a `datetime-local` value for the commit payload.
 *
 * Plain `new Date(localValue).toISOString()` would convert to UTC using the
 * browser's offset, which means a user in EDT with the input untouched at
 * "YYYY-MM-DDT00:00" sends `T05:00:00Z` — fine in EDT but renders as the
 * wrong calendar day for any user east of UTC+5. When the time is exactly
 * midnight, treat the value as a bare date and let the server schema's
 * date-aware transform default it to noon UTC instead.
 */
function serializeShootDate(value: string): string | null {
  if (!value) return null;
  const dateOnlyMatch = /^(\d{4}-\d{2}-\d{2})T00:00$/.exec(value);
  if (dateOnlyMatch) return dateOnlyMatch[1];
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function buildInitialRow(p: AnnotatedProposedProject): RowState {
  // Default client choice from the LLM-annotated match
  let clientChoice: RowState['clientChoice'];
  if (p.clientMatch.kind === 'confident') {
    clientChoice = { kind: 'existing', clientId: p.clientMatch.clientId };
  } else if (p.clientMatch.kind === 'ambiguous') {
    // Don't auto-pick; force user to choose. Pre-select first candidate to
    // keep the UI predictable.
    clientChoice = { kind: 'existing', clientId: p.clientMatch.candidates[0].id };
  } else if (p.clientMatch.kind === 'none' && p.client_name) {
    clientChoice = { kind: 'create', full_name: p.client_name };
  } else {
    clientChoice = { kind: 'none' };
  }
  return {
    ...p,
    selected: true,
    edited: {
      title: p.title,
      category: p.category ?? '',
      status: (PROJECT_STATUSES as readonly string[]).includes(p.status ?? '')
        ? (p.status as typeof PROJECT_STATUSES[number])
        : 'inquiry',
      shoot_date: toDatetimeLocal(p.shoot_date),
      location: p.location ?? '',
      package_price: p.package_price != null ? String(p.package_price) : '',
      amount_paid: p.amount_paid != null ? String(p.amount_paid) : '',
      payment_status: (PAYMENT_STATUSES as readonly string[]).includes(p.payment_status ?? '')
        ? (p.payment_status as typeof PAYMENT_STATUSES[number])
        : 'unpaid',
      notes: p.notes ?? '',
    },
    clientChoice,
  };
}

export function ProjectsUploadDialog({
  open,
  onClose,
  clients,
  hasAiKey,
}: {
  open: boolean;
  onClose: () => void;
  clients: ClientLite[];
  hasAiKey: boolean;
}) {
  const router = useRouter();
  const { show: showToast } = useToast();
  const confirm = useConfirm();

  const [phase, setPhase] = useState<'pick' | 'extracting' | 'review' | 'committing'>('pick');
  const [filename, setFilename] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    setPhase('pick');
    setFilename(null);
    setJobId(null);
    setWarnings([]);
    setRows([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleClose() {
    if (phase === 'review' && rows.length > 0) {
      const ok = await confirm({
        title: 'Discard extracted projects?',
        message: 'Your edits won’t be saved.',
        confirmLabel: 'Discard',
        destructive: true,
      });
      if (!ok) return;
    }
    reset();
    onClose();
  }

  async function uploadFile(file: File) {
    setError(null);
    setFilename(file.name);
    setPhase('extracting');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/projects/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as UploadResponse | { error: string };
      if (!res.ok || 'error' in json) {
        setError('error' in json ? json.error : 'Upload failed');
        setPhase('pick');
        return;
      }
      const body = json as UploadResponse;
      if (body.projects.length === 0) {
        setError(
          body.warnings[0] ??
            "Couldn't find any projects in that file. Try a different one or add the project manually."
        );
        setPhase('pick');
        return;
      }
      setJobId(body.jobId);
      setWarnings(body.warnings);
      setRows(body.projects.map(buildInitialRow));
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPhase('pick');
    }
  }

  function patchRow(rowKey: string, patch: Partial<RowState>) {
    setRows((current) => current.map((r) => (r.rowKey === rowKey ? { ...r, ...patch } : r)));
  }

  function patchEdited(rowKey: string, patch: Partial<RowState['edited']>) {
    setRows((current) =>
      current.map((r) =>
        r.rowKey === rowKey ? { ...r, edited: { ...r.edited, ...patch } } : r
      )
    );
  }

  function handleCommit() {
    setError(null);
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      setError('Pick at least one project to import.');
      return;
    }
    setPhase('committing');
    const payload: CommitProjectRow[] = selected.map((r) => ({
      rowKey: r.rowKey,
      title: r.edited.title.trim() || 'Untitled project',
      category: r.edited.category.trim() || null,
      status: r.edited.status,
      shoot_date: serializeShootDate(r.edited.shoot_date),
      location: r.edited.location.trim() || null,
      package_price:
        r.edited.package_price.trim() === ''
          ? null
          : Number.isFinite(Number(r.edited.package_price))
            ? Number(r.edited.package_price)
            : null,
      amount_paid:
        r.edited.amount_paid.trim() === ''
          ? 0
          : Number.isFinite(Number(r.edited.amount_paid))
            ? Number(r.edited.amount_paid)
            : 0,
      payment_status: r.edited.payment_status,
      notes: r.edited.notes.trim() || null,
      clientDecision:
        r.clientChoice.kind === 'existing'
          ? { kind: 'existing', clientId: r.clientChoice.clientId }
          : r.clientChoice.kind === 'create'
            ? { kind: 'create', full_name: r.clientChoice.full_name }
            : { kind: 'none' },
    }));

    startTransition(async () => {
      const res = await commitUploadedProjects({ jobId, rows: payload });
      if (res.error !== null) {
        setError(res.error);
        showToast(res.error, 'danger');
        setPhase('review');
        return;
      }
      const { createdProjectCount, createdClientCount, errors: rowErrors } = res.data;
      if (rowErrors.length > 0) {
        const failedKeys = new Set(rowErrors.map((e) => e.rowKey));
        // Keep the failed rows in the dialog so the user can fix them.
        setRows((current) => current.filter((r) => failedKeys.has(r.rowKey)));
        setError(
          `Created ${createdProjectCount}, ${rowErrors.length} couldn’t be saved — see below.`
        );
        showToast(
          `Created ${createdProjectCount} project${createdProjectCount === 1 ? '' : 's'}, ${rowErrors.length} failed`,
          'danger'
        );
        setPhase('review');
        router.refresh();
        return;
      }
      const clientsBit =
        createdClientCount > 0
          ? `, added ${createdClientCount} client${createdClientCount === 1 ? '' : 's'}`
          : '';
      showToast(
        `Created ${createdProjectCount} project${createdProjectCount === 1 ? '' : 's'}${clientsBit}`,
        'success'
      );
      router.refresh();
      reset();
      onClose();
    });
  }

  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <SlideOver open={open} onClose={handleClose} title="Import projects from a file">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {!hasAiKey ? (
            <NotConnectedNotice />
          ) : phase === 'pick' || phase === 'extracting' ? (
            <UploadDropzone
              ref={fileInputRef}
              isExtracting={phase === 'extracting'}
              filename={filename}
              error={error}
              onFile={uploadFile}
            />
          ) : (
            <ReviewList
              filename={filename ?? ''}
              warnings={warnings}
              rows={rows}
              clients={clients}
              error={error}
              onTogglePatch={patchRow}
              onEditPatch={patchEdited}
            />
          )}
        </div>

        {phase === 'review' || phase === 'committing' ? (
          <footer
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: '0.875rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              background: 'var(--color-bg-secondary)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>
              {selectedCount} of {rows.length} selected
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={handleClose} style={ghostButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={phase === 'committing' || selectedCount === 0}
                style={{
                  ...primaryButton,
                  opacity: phase === 'committing' || selectedCount === 0 ? 0.6 : 1,
                }}
              >
                {phase === 'committing'
                  ? 'Saving…'
                  : `Create ${selectedCount} project${selectedCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </footer>
        ) : null}
      </div>
    </SlideOver>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NotConnectedNotice() {
  return (
    <div
      style={{
        padding: '1.25rem',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-tertiary)',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
        File import needs an Anthropic API key.
      </p>
      <p
        style={{
          margin: '0.625rem 0 1rem',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        Add one in Settings → Integrations to enable LLM extraction. You'll be
        billed by Anthropic for usage.
      </p>
      <a
        href="/settings#integrations"
        style={{
          ...primaryButton,
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Open settings
      </a>
    </div>
  );
}

type DropzoneProps = {
  isExtracting: boolean;
  filename: string | null;
  error: string | null;
  onFile: (file: File) => void;
};

const UploadDropzone = forwardRef<HTMLInputElement, DropzoneProps>(
  function UploadDropzone({ isExtracting, filename, error, onFile }, ref) {
    const [isDragging, setIsDragging] = useState(false);

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          Drop a file with one or many projects. Claude will extract titles,
          dates, prices, clients, and statuses — you'll review before anything
          is saved.
        </p>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            if (!isExtracting) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (isExtracting) return;
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '2rem 1rem',
            border: `1.5px dashed ${
              isDragging ? 'var(--color-accent)' : 'var(--color-border-secondary)'
            }`,
            borderRadius: 'var(--radius-lg)',
            background: isDragging
              ? 'var(--color-bg-tertiary)'
              : 'var(--color-bg)',
            cursor: isExtracting ? 'wait' : 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <input
            ref={ref}
            type="file"
            accept={ACCEPT_MIME}
            disabled={isExtracting}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
            style={{ display: 'none' }}
          />
          <span
            style={{
              fontSize: '0.9375rem',
              color: 'var(--color-text-primary)',
            }}
          >
            {isExtracting
              ? `Reading ${filename}…`
              : 'Drop a file or click to browse'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            {ACCEPT_DESCRIPTION} · max 10MB
          </span>
        </label>
        {error ? (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
            {error}
          </p>
        ) : null}
        <p
          style={{
            margin: 0,
            fontSize: '0.6875rem',
            color: 'var(--color-text-tertiary)',
            lineHeight: 1.5,
          }}
        >
          Files are sent to Anthropic's Claude API for one-time extraction. We
          don't keep the file content after extraction; only the metadata of
          the upload (filename, size, count) is logged for your reference.
        </p>
      </div>
    );
  }
);

function ReviewList({
  filename,
  warnings,
  rows,
  clients,
  error,
  onTogglePatch,
  onEditPatch,
}: {
  filename: string;
  warnings: string[];
  rows: RowState[];
  clients: ClientLite[];
  error: string | null;
  onTogglePatch: (rowKey: string, patch: Partial<RowState>) => void;
  onEditPatch: (rowKey: string, patch: Partial<RowState['edited']>) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.875rem' }}>
      <header>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {rows.length} project{rows.length === 1 ? '' : 's'} extracted from{' '}
          <span style={{ color: 'var(--color-text-primary)' }}>{filename}</span>. Edit
          before importing — uncheck any you want to skip.
        </p>
      </header>

      {warnings.length > 0 ? (
        <div
          style={{
            padding: '0.625rem 0.75rem',
            background: 'rgba(244, 168, 50, 0.1)',
            border: '1px solid rgba(244, 168, 50, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--color-warning)',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Warnings</strong>
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {warnings.map((w, i) => (
              <li key={i} style={{ marginBottom: '0.125rem' }}>
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-danger)' }}>{error}</p>
      ) : null}

      {rows.map((r) => (
        <RowCard
          key={r.rowKey}
          row={r}
          clients={clients}
          onTogglePatch={onTogglePatch}
          onEditPatch={onEditPatch}
        />
      ))}
    </div>
  );
}

function RowCard({
  row,
  clients,
  onTogglePatch,
  onEditPatch,
}: {
  row: RowState;
  clients: ClientLite[];
  onTogglePatch: (rowKey: string, patch: Partial<RowState>) => void;
  onEditPatch: (rowKey: string, patch: Partial<RowState['edited']>) => void;
}) {
  const [expanded, setExpanded] = useState(row.clientMatch.kind !== 'confident');

  return (
    <div
      style={{
        padding: '0.75rem 0.875rem',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        opacity: row.selected ? 1 : 0.55,
      }}
    >
      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          checked={row.selected}
          onChange={(e) => onTogglePatch(row.rowKey, { selected: e.target.checked })}
          style={{ marginTop: '0.25rem' }}
          aria-label={`Include ${row.edited.title}`}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            {row.edited.title || 'Untitled'}
          </div>
          <div
            style={{
              marginTop: '0.125rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            {row.edited.category ? <span>{row.edited.category}</span> : null}
            {row.edited.shoot_date ? (
              <span>
                {new Date(row.edited.shoot_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            ) : null}
            {row.edited.package_price ? <span>${row.edited.package_price}</span> : null}
            {row.edited.location ? <span>{row.edited.location}</span> : null}
          </div>
          {row.source_excerpt ? (
            <div
              style={{
                marginTop: '0.375rem',
                fontSize: '0.6875rem',
                color: 'var(--color-text-tertiary)',
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              “{row.source_excerpt}”
            </div>
          ) : null}
          <ClientChooser
            row={row}
            clients={clients}
            onChange={(choice) => onTogglePatch(row.rowKey, { clientChoice: choice })}
          />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              marginTop: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {expanded ? '↑ Hide fields' : '↓ Edit fields'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div
          style={{
            marginTop: '0.625rem',
            paddingTop: '0.625rem',
            borderTop: '1px solid var(--color-border)',
            display: 'grid',
            gap: '0.5rem',
          }}
        >
          <div>
            <label style={labelStyle}>Title</label>
            <input
              value={row.edited.title}
              onChange={(e) => onEditPatch(row.rowKey, { title: e.target.value })}
              style={inputStyle}
              maxLength={200}
            />
          </div>
          <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <input
                value={row.edited.category}
                onChange={(e) => onEditPatch(row.rowKey, { category: e.target.value })}
                style={inputStyle}
                maxLength={60}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={row.edited.status}
                onChange={(e) =>
                  onEditPatch(row.rowKey, {
                    status: e.target.value as typeof PROJECT_STATUSES[number],
                  })
                }
                style={{ ...inputStyle, appearance: 'auto' }}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={labelStyle}>Shoot date & time</label>
              <input
                type="datetime-local"
                value={row.edited.shoot_date}
                onChange={(e) => onEditPatch(row.rowKey, { shoot_date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input
                value={row.edited.location}
                onChange={(e) => onEditPatch(row.rowKey, { location: e.target.value })}
                style={inputStyle}
                maxLength={200}
              />
            </div>
          </div>
          <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={labelStyle}>Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={row.edited.package_price}
                onChange={(e) => onEditPatch(row.rowKey, { package_price: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Paid</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={row.edited.amount_paid}
                onChange={(e) => onEditPatch(row.rowKey, { amount_paid: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Pmt status</label>
              <select
                value={row.edited.payment_status}
                onChange={(e) =>
                  onEditPatch(row.rowKey, {
                    payment_status: e.target.value as typeof PAYMENT_STATUSES[number],
                  })
                }
                style={{ ...inputStyle, appearance: 'auto' }}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={row.edited.notes}
              onChange={(e) => onEditPatch(row.rowKey, { notes: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClientChooser({
  row,
  clients,
  onChange,
}: {
  row: RowState;
  clients: ClientLite[];
  onChange: (choice: RowState['clientChoice']) => void;
}) {
  if (!row.client_name) {
    return (
      <div style={{ marginTop: '0.5rem' }}>
        <ClientSelect row={row} clients={clients} onChange={onChange} />
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {row.clientMatch.kind === 'confident' ? (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          Client:{' '}
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {row.clientMatch.matchedName}
          </span>{' '}
          <span style={{ color: 'var(--color-success)' }}>✓ existing</span>{' '}
          <button
            type="button"
            onClick={() => onChange({ kind: 'create', full_name: row.client_name ?? '' })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              padding: 0,
              fontSize: '0.6875rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              textDecoration: 'underline',
            }}
          >
            change
          </button>
        </div>
      ) : null}

      {row.clientMatch.kind === 'ambiguous' ? (
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>
            Multiple possible matches for "{row.client_name}":
          </div>
          {row.clientMatch.candidates.map((c) => (
            <label
              key={c.id}
              style={{
                display: 'flex',
                gap: '0.375rem',
                alignItems: 'center',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <input
                type="radio"
                name={`client-${row.rowKey}`}
                checked={
                  row.clientChoice.kind === 'existing' && row.clientChoice.clientId === c.id
                }
                onChange={() => onChange({ kind: 'existing', clientId: c.id })}
              />
              {c.full_name}{' '}
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.6875rem' }}>
                {Math.round(c.score * 100)}%
              </span>
            </label>
          ))}
          <label
            style={{
              display: 'flex',
              gap: '0.375rem',
              alignItems: 'center',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <input
              type="radio"
              name={`client-${row.rowKey}`}
              checked={row.clientChoice.kind === 'create'}
              onChange={() => onChange({ kind: 'create', full_name: row.client_name ?? '' })}
            />
            Create new "{row.client_name}"
          </label>
        </div>
      ) : null}

      {row.clientMatch.kind === 'none' ? (
        <ClientSelect
          row={row}
          clients={clients}
          onChange={onChange}
          suggestedNew={row.client_name}
        />
      ) : null}
    </div>
  );
}

function ClientSelect({
  row,
  clients,
  onChange,
  suggestedNew,
}: {
  row: RowState;
  clients: ClientLite[];
  onChange: (choice: RowState['clientChoice']) => void;
  suggestedNew?: string;
}) {
  const value =
    row.clientChoice.kind === 'existing'
      ? row.clientChoice.clientId
      : row.clientChoice.kind === 'create'
        ? '__new__'
        : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Client:</label>
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') onChange({ kind: 'none' });
          else if (v === '__new__')
            onChange({ kind: 'create', full_name: suggestedNew ?? '' });
          else onChange({ kind: 'existing', clientId: v });
        }}
        style={{ ...inputStyle, width: 'auto', flex: '1 1 160px', appearance: 'auto' }}
      >
        <option value="">— none —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name}
          </option>
        ))}
        {suggestedNew ? (
          <option value="__new__">+ Create new "{suggestedNew}"</option>
        ) : null}
      </select>
    </div>
  );
}
