'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { createClient as createClientAction, updateClient, deleteClient } from '@/lib/actions/clients';
import type { Database } from '@/lib/supabase/types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

export type ClientFormMode = { kind: 'create' } | { kind: 'edit'; client: ClientRow };

const SOURCES = ['inquiry', 'referral', 'instagram', 'website', 'manual'] as const;

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

export function ClientForm({
  mode,
  onClose,
  redirectAfterDelete = '/clients',
}: {
  mode: ClientFormMode | null;
  onClose: () => void;
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const { show: showToast } = useToast();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setError(null);
    setFormKey((k) => k + 1);
  }, [mode]);

  if (!mode) return null;
  const isEdit = mode.kind === 'edit';
  const c = isEdit ? mode.client : null;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const payload = {
      full_name: String(formData.get('full_name') ?? ''),
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      notes: (formData.get('notes') as string) || null,
      source: (formData.get('source') as typeof SOURCES[number]) || null,
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateClient({ id: c!.id, ...payload })
        : await createClientAction(payload);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      showToast(isEdit ? 'Client updated' : 'Client created', 'success');
      onClose();
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!c) return;
    const confirmed = await confirm({
      title: 'Delete client?',
      message:
        'Linked projects, shoots, and inquiries will keep their data, but their reference to this client will be cleared.',
      confirmLabel: 'Delete client',
      destructive: true,
    });
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteClient(c.id);
      if (res.error !== null) {
        setError(res.error);
        showToast(res.error, 'danger');
        return;
      }
      showToast('Client deleted', 'success');
      onClose();
      router.push(redirectAfterDelete);
      router.refresh();
    });
  };

  const formId = 'client-form';
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
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
        </button>
      </div>
    </div>
  );

  return (
    <SlideOver
      open={mode !== null}
      onClose={onClose}
      title={isEdit ? 'Edit client' : 'New client'}
      footer={footer}
    >
      <form id={formId} key={formKey} action={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle} htmlFor="client-full-name">
            Full name
          </label>
          <input
            id="client-full-name"
            name="full_name"
            required
            maxLength={200}
            defaultValue={c?.full_name ?? ''}
            placeholder="Client name"
            style={inputStyle}
          />
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="client-email">
              Email
            </label>
            <input
              id="client-email"
              name="email"
              type="email"
              defaultValue={c?.email ?? ''}
              placeholder="name@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="client-phone">
              Phone
            </label>
            <input
              id="client-phone"
              name="phone"
              defaultValue={c?.phone ?? ''}
              maxLength={60}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="client-source">
            Source
          </label>
          <select
            id="client-source"
            name="source"
            defaultValue={c?.source ?? ''}
            style={{ ...inputStyle, appearance: 'auto' }}
          >
            <option value="">—</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle} htmlFor="client-notes">
            Notes
          </label>
          <textarea
            id="client-notes"
            name="notes"
            rows={3}
            defaultValue={c?.notes ?? ''}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {error ? (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
            {error}
          </p>
        ) : null}
      </form>
    </SlideOver>
  );
}
