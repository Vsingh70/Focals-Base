'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import { createProject, updateProject, deleteProject } from '@/lib/actions/projects';
import type { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ClientLite = { id: string; full_name: string };

export type ProjectFormMode = { kind: 'create' } | { kind: 'edit'; project: Project };

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
}: {
  mode: ProjectFormMode | null;
  onClose: () => void;
  clients: ClientLite[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setError(null);
    setFormKey((k) => k + 1);
  }, [mode]);

  if (!mode) return null;
  const isEdit = mode.kind === 'edit';
  const p = isEdit ? mode.project : null;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const priceRaw = formData.get('package_price');
    const paidRaw = formData.get('amount_paid');
    const payload = {
      title: String(formData.get('title') ?? ''),
      client_id: (formData.get('client_id') as string) || null,
      category: (formData.get('category') as string) || null,
      status: formData.get('status') as typeof PROJECT_STATUSES[number],
      shoot_date: (formData.get('shoot_date') as string) || null,
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
      onClose();
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!p) return;
    if (!confirm('Delete this project? Linked shoots and finances will set their project_id to null.')) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteProject(p.id);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <SlideOver
      open={mode !== null}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
    >
      <form key={formKey} action={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle} htmlFor="proj-title">
            Title
          </label>
          <input
            id="proj-title"
            name="title"
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
            <select
              id="proj-client"
              name="client_id"
              defaultValue={p?.client_id ?? ''}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="proj-category">
              Category
            </label>
            <input
              id="proj-category"
              name="category"
              defaultValue={p?.category ?? ''}
              maxLength={60}
              placeholder="portrait, wedding, editorial…"
              style={inputStyle}
            />
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
            <label style={labelStyle} htmlFor="proj-date">
              Shoot date
            </label>
            <input
              id="proj-date"
              name="shoot_date"
              type="date"
              defaultValue={p?.shoot_date ?? ''}
              style={inputStyle}
            />
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
            style={inputStyle}
          />
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

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--color-border)',
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
              disabled={isPending}
              style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
}
