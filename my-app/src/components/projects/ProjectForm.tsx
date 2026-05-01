'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { SlideOver } from '@/components/ui/SlideOver';
import { ClientPicker } from '@/components/clients/ClientPicker';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { createProject, updateProject, deleteProject } from '@/lib/actions/projects';
import { suggestProjectSlots, type SlotSuggestion } from '@/lib/actions/scheduling';
import type { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ClientLite = { id: string; full_name: string };

export type ProjectFormMode =
  // `presetShootDate` is filled when a user clicks an empty slot on the
  // calendar — the new project should default to that date/time.
  | { kind: 'create'; presetShootDate?: Date }
  | { kind: 'edit'; project: Project };

function toDatetimeLocalValue(raw: string | Date | null | undefined): string {
  // shoot_date is wall-clock (see handleSubmit). For string inputs from the
  // DB, the UTC components ARE the wall-clock the user typed. For Date
  // inputs (calendar slot click — JS produces a local-time Date), the local
  // components are the wall-clock. Pick the right getters per source.
  if (!raw) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  if (typeof raw === 'string') {
    const naive = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(raw);
    if (naive) return naive[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00`;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }
  // Date instance — read local components.
  if (Number.isNaN(raw.getTime())) return '';
  return `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}T${pad(raw.getHours())}:${pad(raw.getMinutes())}`;
}

/**
 * Render a wall-clock ISO ("...T15:00:00.000Z") as a friendly local-feeling
 * label like "Sat, May 10 · 3:00 PM". Always reads in UTC so the digits the
 * server picked are exactly what's shown — no viewer-TZ shift.
 */
function formatSuggestion(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${day} · ${time}`;
}

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9375rem',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem',
};

const primaryButton: React.CSSProperties = {
  padding: '0.625rem 1rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const secondaryButton: React.CSSProperties = {
  padding: '0.625rem 1rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const dangerButton: React.CSSProperties = {
  padding: '0.625rem 1rem',
  background: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid rgba(232, 80, 64, 0.3)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

export function ProjectForm({
  mode,
  onClose,
  clients,
  categorySuggestions = [],
  locationSuggestions = [],
}: {
  mode: ProjectFormMode | null;
  onClose: () => void;
  clients: ClientLite[];
  categorySuggestions?: string[];
  locationSuggestions?: string[];
}) {
  const router = useRouter();
  const { show: showToast } = useToast();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  // Slot-suggestion AI state. Lives only inside the form so closing the
  // slide-over forgets the most recent suggestions.
  const [suggestions, setSuggestions] = useState<SlotSuggestion[] | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [isSuggesting, startSuggesting] = useTransition();
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const categoryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setError(null);
    setSuggestions(null);
    setSuggestError(null);
    setFormKey((k) => k + 1);
  }, [mode]);

  if (!mode) return null;
  const isEdit = mode.kind === 'edit';
  const p = isEdit ? mode.project : null;
  const presetShootDate = !isEdit ? mode.presetShootDate ?? null : null;

  const handleSuggestSlots = () => {
    setSuggestError(null);
    setSuggestions(null);
    const category = categoryInputRef.current?.value?.trim() || p?.category || null;
    const dateLocal = dateInputRef.current?.value?.trim() || null;
    const noteSeed =
      titleInputRef.current?.value?.trim() || p?.title || undefined;
    startSuggesting(async () => {
      const res = await suggestProjectSlots({
        category,
        // If the user already typed a date, treat it as the anchor; the
        // heuristic will narrow to ±10 days around it.
        anchor: dateLocal || null,
        context: noteSeed,
      });
      if (res.error !== null) {
        setSuggestError(res.error);
        return;
      }
      setSuggestions(res.data);
    });
  };

  const applySuggestion = (s: SlotSuggestion) => {
    if (!dateInputRef.current) return;
    // Server returned a wall-clock ISO at +00. Strip seconds + zone for
    // datetime-local. The leading 16 chars are exactly YYYY-MM-DDTHH:mm.
    dateInputRef.current.value = s.start.slice(0, 16);
    setSuggestions(null);
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const priceRaw = formData.get('package_price');
    const paidRaw = formData.get('amount_paid');
    const dateLocal = String(formData.get('shoot_date') ?? '');
    // shoot_date is stored as wall-clock — the photographer means "8:30 on
    // their watch", not "8:30 in some specific timezone". Send the
    // datetime-local value verbatim ("YYYY-MM-DDTHH:mm"); Postgres parses
    // it as naive timestamp and stores it under the +00 zone so renderers
    // formatting in UTC display the same number the user typed.
    const shootDate = dateLocal || null;
    const payload = {
      title: String(formData.get('title') ?? ''),
      client_id: (formData.get('client_id') as string) || null,
      category: (formData.get('category') as string) || null,
      status: formData.get('status') as typeof PROJECT_STATUSES[number],
      shoot_date: shootDate,
      location: (formData.get('location') as string) || null,
      package_price: priceRaw && priceRaw !== '' ? Number(priceRaw) : null,
      amount_paid: paidRaw && paidRaw !== '' ? Number(paidRaw) : 0,
      payment_status: formData.get('payment_status') as typeof PAYMENT_STATUSES[number],
      notes: (formData.get('notes') as string) || null,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateProject({ id: p!.id, ...payload })
        : await createProject(payload);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      showToast(isEdit ? 'Project updated' : 'Project created', 'success');
      onClose();
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!p) return;
    const confirmed = await confirm({
      title: 'Delete project?',
      message:
        'Linked finances will keep their data, but their reference to this project will be cleared.',
      confirmLabel: 'Delete project',
      destructive: true,
    });
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteProject(p.id);
      if (res.error !== null) {
        setError(res.error);
        showToast(res.error, 'danger');
        return;
      }
      showToast('Project deleted', 'success');
      onClose();
      router.refresh();
    });
  };

  const formId = 'project-form';
  const footer = (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {isEdit ? (
        <button type="button" onClick={handleDelete} disabled={isPending} style={dangerButton}>
          Delete
        </button>
      ) : (
        <span />
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={onClose} disabled={isPending} style={secondaryButton}>
          Cancel
        </button>
        <button
          type="submit"
          form={formId}
          disabled={isPending}
          style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </div>
  );

  return (
    <SlideOver
      open={mode !== null}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      footer={footer}
    >
      <form id={formId} key={formKey} action={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle} htmlFor="proj-title">
            Title
          </label>
          <input
            id="proj-title"
            name="title"
            ref={titleInputRef}
            required
            maxLength={200}
            defaultValue={p?.title ?? ''}
            placeholder="e.g. Johnson family portraits"
            style={inputStyle}
          />
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="proj-client">
              Client
            </label>
            <ClientPicker
              name="client_id"
              defaultValue={p?.client_id ?? ''}
              clients={clients}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="proj-category">
              Category
            </label>
            <input
              id="proj-category"
              name="category"
              ref={categoryInputRef}
              defaultValue={p?.category ?? ''}
              maxLength={60}
              placeholder="portrait, wedding, editorial…"
              list="proj-category-options"
              autoComplete="off"
              style={inputStyle}
            />
            {categorySuggestions.length > 0 ? (
              <datalist id="proj-category-options">
                {categorySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            ) : null}
          </div>
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="proj-status">
              Status
            </label>
            <select
              id="proj-status"
              name="status"
              defaultValue={p?.status ?? 'inquiry'}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <label style={labelStyle} htmlFor="proj-date">
                Shoot date & time
              </label>
              <button
                type="button"
                onClick={handleSuggestSlots}
                disabled={isSuggesting}
                title="Use AI to find an open slot in your calendar."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-accent)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: isSuggesting ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: isSuggesting ? 0.6 : 1,
                }}
              >
                <Sparkles size={12} strokeWidth={1.75} />
                {isSuggesting ? 'Finding…' : 'Suggest a time'}
              </button>
            </div>
            <input
              id="proj-date"
              name="shoot_date"
              ref={dateInputRef}
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(p?.shoot_date ?? presetShootDate)}
              style={inputStyle}
            />
            {suggestError ? (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-danger)',
                  margin: '0.375rem 0 0',
                }}
              >
                {suggestError}
              </p>
            ) : null}
            {suggestions && suggestions.length > 0 ? (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0.5rem 0 0',
                  display: 'grid',
                  gap: '0.375rem',
                }}
              >
                {suggestions.map((s) => (
                  <li key={s.start}>
                    <button
                      type="button"
                      onClick={() => applySuggestion(s)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.625rem',
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {formatSuggestion(s.start)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--color-text-tertiary)',
                          marginTop: '0.125rem',
                        }}
                      >
                        {s.reason}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="proj-location">
            Location
          </label>
          <input
            id="proj-location"
            name="location"
            defaultValue={p?.location ?? ''}
            maxLength={200}
            placeholder="Studio, venue, address…"
            list="proj-location-options"
            autoComplete="off"
            style={inputStyle}
          />
          {locationSuggestions.length > 0 ? (
            <datalist id="proj-location-options">
              {locationSuggestions.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          ) : null}
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="proj-price">
              Package price ($)
            </label>
            <input
              id="proj-price"
              name="package_price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={p?.package_price ?? ''}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="proj-paid">
              Amount paid ($)
            </label>
            <input
              id="proj-paid"
              name="amount_paid"
              type="number"
              min={0}
              step="0.01"
              defaultValue={p?.amount_paid ?? '0'}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="proj-payment-status">
              Payment status
            </label>
            <select
              id="proj-payment-status"
              name="payment_status"
              defaultValue={p?.payment_status ?? 'unpaid'}
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
          <label style={labelStyle} htmlFor="proj-notes">
            Notes
          </label>
          <textarea
            id="proj-notes"
            name="notes"
            rows={3}
            defaultValue={p?.notes ?? ''}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {error ? (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
            {error}
          </p>
        ) : null}

        {isEdit && p ? (
          <div
            style={{
              display: 'grid',
              gap: '0.375rem',
              padding: '0.875rem 1rem',
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Contract
            </span>
            <a
              href={`/contracts/new?projectId=${p.id}&generate=1`}
              onClick={onClose}
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Generate contract from this project →
            </a>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              Uses Claude to draft a contract body from this project&apos;s details.
              Requires an Anthropic key in Settings.
            </span>
          </div>
        ) : null}
      </form>
    </SlideOver>
  );
}
