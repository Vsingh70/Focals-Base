'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { createGearItem, updateGearItem, deleteGearItem } from '@/lib/actions/gear';
import type { Database } from '@/lib/supabase/types';

type Gear = Database['public']['Tables']['gear']['Row'];

export type GearFormMode = { kind: 'create' } | { kind: 'edit'; gear: Gear };

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

export function GearForm({
  mode,
  onClose,
}: {
  mode: GearFormMode | null;
  onClose: () => void;
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
  const g = isEdit ? mode.gear : null;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const purchasePriceRaw = formData.get('purchase_price');
    const payload = {
      name: String(formData.get('name') ?? ''),
      brand: (formData.get('brand') as string) || null,
      model: (formData.get('model') as string) || null,
      serial_number: (formData.get('serial_number') as string) || null,
      category: (formData.get('category') as string) || null,
      status: (formData.get('status') as string) || 'owned',
      purchase_price:
        purchasePriceRaw && purchasePriceRaw !== '' ? Number(purchasePriceRaw) : null,
      purchase_date: (formData.get('purchase_date') as string) || null,
      notes: (formData.get('notes') as string) || null,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateGearItem({
            id: g!.id,
            ...payload,
            category: payload.category as
              | 'camera'
              | 'lens'
              | 'lighting'
              | 'audio'
              | 'bag'
              | 'misc'
              | null,
            status: payload.status as 'owned' | 'wishlist' | 'sold' | 'rented',
          })
        : await createGearItem({
            ...payload,
            category: payload.category as
              | 'camera'
              | 'lens'
              | 'lighting'
              | 'audio'
              | 'bag'
              | 'misc'
              | null,
            status: payload.status as 'owned' | 'wishlist' | 'sold' | 'rented',
          });
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      showToast(isEdit ? 'Gear updated' : 'Gear added', 'success');
      onClose();
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!g) return;
    const confirmed = await confirm({
      title: 'Delete gear item?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete item',
      destructive: true,
    });
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteGearItem(g.id);
      if (res.error !== null) {
        setError(res.error);
        showToast(res.error, 'danger');
        return;
      }
      showToast('Gear deleted', 'success');
      onClose();
      router.refresh();
    });
  };

  return (
    <SlideOver open={mode !== null} onClose={onClose} title={isEdit ? 'Edit gear' : 'Add gear'}>
      <form key={formKey} action={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle} htmlFor="gear-name">
            Name
          </label>
          <input
            id="gear-name"
            name="name"
            required
            maxLength={200}
            defaultValue={g?.name ?? ''}
            placeholder="e.g. Sony A7 IV"
            style={inputStyle}
          />
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="gear-category">
              Category
            </label>
            <select
              id="gear-category"
              name="category"
              defaultValue={g?.category ?? ''}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="">—</option>
              <option value="camera">Camera</option>
              <option value="lens">Lens</option>
              <option value="lighting">Lighting</option>
              <option value="audio">Audio</option>
              <option value="bag">Bag</option>
              <option value="misc">Misc</option>
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="gear-status">
              Status
            </label>
            <select
              id="gear-status"
              name="status"
              defaultValue={g?.status ?? 'owned'}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="owned">Owned</option>
              <option value="wishlist">Wishlist</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="gear-brand">
              Brand
            </label>
            <input
              id="gear-brand"
              name="brand"
              defaultValue={g?.brand ?? ''}
              maxLength={100}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="gear-model">
              Model
            </label>
            <input
              id="gear-model"
              name="model"
              defaultValue={g?.model ?? ''}
              maxLength={100}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="gear-serial">
            Serial number
          </label>
          <input
            id="gear-serial"
            name="serial_number"
            defaultValue={g?.serial_number ?? ''}
            maxLength={100}
            style={inputStyle}
          />
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="gear-price">
              Purchase price ($)
            </label>
            <input
              id="gear-price"
              name="purchase_price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={g?.purchase_price ?? ''}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="gear-date">
              Purchase date
            </label>
            <input
              id="gear-date"
              name="purchase_date"
              type="date"
              defaultValue={g?.purchase_date ?? ''}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="gear-notes">
            Notes
          </label>
          <textarea
            id="gear-notes"
            name="notes"
            rows={3}
            defaultValue={g?.notes ?? ''}
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
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add gear'}
            </button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
}
