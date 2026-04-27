'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import { createLink, updateLink, deleteLink } from '@/lib/actions/links';
import { LINK_CATEGORIES } from '@/lib/validations/links';
import type { Database } from '@/lib/supabase/types';

type LinkRow = Database['public']['Tables']['links']['Row'];

export type LinkFormMode = { kind: 'create' } | { kind: 'edit'; link: LinkRow };

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

export function LinkForm({
  mode,
  onClose,
}: {
  mode: LinkFormMode | null;
  onClose: () => void;
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
  const link = isEdit ? mode.link : null;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const payload = {
      title: String(formData.get('title') ?? ''),
      url: String(formData.get('url') ?? ''),
      category: (formData.get('category') as string) || null,
      notes: (formData.get('notes') as string) || null,
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateLink({ id: link!.id, ...payload })
        : await createLink(payload);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!link) return;
    if (!confirm('Delete this link?')) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteLink(link.id);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <SlideOver open={mode !== null} onClose={onClose} title={isEdit ? 'Edit link' : 'Add link'}>
      <form key={formKey} action={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle} htmlFor="link-title">
            Title
          </label>
          <input
            id="link-title"
            name="title"
            required
            maxLength={200}
            defaultValue={link?.title ?? ''}
            placeholder="e.g. Wedding posing reference"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="link-url">
            URL
          </label>
          <input
            id="link-url"
            name="url"
            type="url"
            required
            maxLength={2000}
            defaultValue={link?.url ?? ''}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="link-category">
            Category
          </label>
          <select
            id="link-category"
            name="category"
            defaultValue={link?.category ?? ''}
            style={{ ...inputStyle, appearance: 'auto' }}
          >
            <option value="">—</option>
            {LINK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle} htmlFor="link-notes">
            Notes
          </label>
          <textarea
            id="link-notes"
            name="notes"
            rows={3}
            defaultValue={link?.notes ?? ''}
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
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add link'}
            </button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
}
