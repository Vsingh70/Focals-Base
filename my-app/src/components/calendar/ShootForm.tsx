'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import { ClientPicker } from '@/components/clients/ClientPicker';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { createShoot, updateShoot, deleteShoot } from '@/lib/actions/shoots';
import type { Database } from '@/lib/supabase/types';

type Shoot = Database['public']['Tables']['shoots']['Row'];
type ClientLite = { id: string; full_name: string };
type ProjectLite = { id: string; title: string };

type Mode = { kind: 'create'; presetStart?: Date } | { kind: 'edit'; shoot: Shoot };

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

function toDatetimeLocalValue(d: Date): string {
  // Produces YYYY-MM-DDTHH:mm in local time for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Distinct, non-empty, alphabetically-sorted shoot locations — feeds the
 * <datalist> autosuggest in the shoot form. Exposed as a helper so every
 * parent that renders ShootForm can derive the list from its own `shoots`
 * prop without re-implementing the same loop.
 */
export function deriveShootLocationSuggestions(shoots: { location: string | null }[]): string[] {
  const seen = new Set<string>();
  for (const s of shoots) {
    const l = (s.location ?? '').trim();
    if (l) seen.add(l);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function ShootForm({
  mode,
  onClose,
  clients,
  projects,
  locationSuggestions = [],
}: {
  mode: Mode | null;
  onClose: () => void;
  clients: ClientLite[];
  projects: ProjectLite[];
  locationSuggestions?: string[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { show: showToast } = useToast();
  const confirm = useConfirm();
  const [formKey, setFormKey] = useState(0);

  // Reset the form when mode changes
  useEffect(() => {
    setError(null);
    setFormKey((k) => k + 1);
  }, [mode]);

  if (!mode) return null;

  const shoot = mode.kind === 'edit' ? mode.shoot : null;
  const isEdit = shoot !== null;
  const presetStart = mode.kind === 'create' ? mode.presetStart : undefined;

  const defaultStart = shoot ? new Date(shoot.scheduled_at) : presetStart ?? new Date();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const localDt = String(formData.get('scheduled_at') ?? '');
    const scheduledIso = localDt ? new Date(localDt).toISOString() : '';
    const payload = {
      title: String(formData.get('title') ?? ''),
      scheduled_at: scheduledIso,
      duration_minutes: Number(formData.get('duration_minutes') || 60),
      location: (formData.get('location') as string) || null,
      notes: (formData.get('notes') as string) || null,
      client_id: (formData.get('client_id') as string) || null,
      project_id: (formData.get('project_id') as string) || null,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateShoot({ id: shoot!.id, ...payload })
        : await createShoot(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      showToast(isEdit ? 'Shoot updated' : 'Shoot created', 'success');
      onClose();
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!shoot) return;
    const confirmed = await confirm({
      title: 'Delete shoot?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete shoot',
      destructive: true,
    });
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteShoot(shoot.id);
      if (res.error) {
        setError(res.error);
        showToast(res.error, 'danger');
        return;
      }
      showToast('Shoot deleted', 'success');
      onClose();
      router.refresh();
    });
  };

  return (
    <SlideOver open={mode !== null} onClose={onClose} title={isEdit ? 'Edit shoot' : 'New shoot'}>
      <form
        key={formKey}
        action={handleSubmit}
        style={{ display: 'grid', gap: '1rem' }}
      >
        <div>
          <label style={labelStyle} htmlFor="shoot-title">
            Title
          </label>
          <input
            id="shoot-title"
            name="title"
            required
            maxLength={200}
            defaultValue={shoot?.title ?? ''}
            placeholder="e.g. Johnson family portrait"
            style={inputStyle}
          />
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="shoot-datetime">
              Date & time
            </label>
            <input
              id="shoot-datetime"
              name="scheduled_at"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocalValue(defaultStart)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="shoot-duration">
              Duration (min)
            </label>
            <input
              id="shoot-duration"
              name="duration_minutes"
              type="number"
              min={5}
              max={1440}
              defaultValue={shoot?.duration_minutes ?? 60}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="shoot-location">
            Location
          </label>
          <input
            id="shoot-location"
            name="location"
            defaultValue={shoot?.location ?? ''}
            maxLength={200}
            placeholder="Studio, venue, address…"
            list="shoot-location-options"
            autoComplete="off"
            style={inputStyle}
          />
          {locationSuggestions.length > 0 ? (
            <datalist id="shoot-location-options">
              {locationSuggestions.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          ) : null}
        </div>

        <div>
          <label style={labelStyle} htmlFor="shoot-client">
            Client
          </label>
          <ClientPicker
            name="client_id"
            defaultValue={shoot?.client_id ?? ''}
            clients={clients}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="shoot-project">
            Project
          </label>
          <select
            id="shoot-project"
            name="project_id"
            defaultValue={shoot?.project_id ?? ''}
            style={{ ...inputStyle, appearance: 'auto' }}
          >
            <option value="">—</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle} htmlFor="shoot-notes">
            Notes
          </label>
          <textarea
            id="shoot-notes"
            name="notes"
            rows={3}
            defaultValue={shoot?.notes ?? ''}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {error ? (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
            {error}
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
          }}
        >
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              style={dangerButton}
            >
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
              disabled={isPending}
              style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create shoot'}
            </button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
}
