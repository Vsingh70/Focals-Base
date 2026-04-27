'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { GearForm, type GearFormMode } from './GearForm';
import type { Database } from '@/lib/supabase/types';

type Gear = Database['public']['Tables']['gear']['Row'];

const statusToneMap = {
  owned: 'success',
  wishlist: 'accent',
  sold: 'neutral',
  rented: 'warning',
} as const;

const filterChips: { key: 'all' | 'owned' | 'wishlist' | 'sold' | 'rented'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'owned', label: 'Owned' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'rented', label: 'Rented' },
  { key: 'sold', label: 'Sold' },
];

const categoryFilters: { key: string; label: string }[] = [
  { key: 'all', label: 'All categories' },
  { key: 'camera', label: 'Camera' },
  { key: 'lens', label: 'Lens' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'audio', label: 'Audio' },
  { key: 'bag', label: 'Bag' },
  { key: 'misc', label: 'Misc' },
];

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

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.75rem',
    background: active ? 'var(--color-bg-tertiary)' : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    border: '1px solid',
    borderColor: active ? 'var(--color-border-secondary)' : 'transparent',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function GearGrid({ gear }: { gear: Gear[] }) {
  const [statusFilter, setStatusFilter] = useState<typeof filterChips[number]['key']>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [mode, setMode] = useState<GearFormMode | null>(null);

  const filtered = useMemo(() => {
    return gear.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
      return true;
    });
  }, [gear, statusFilter, categoryFilter]);

  const totalValue = useMemo(
    () =>
      gear
        .filter((g) => g.status === 'owned')
        .reduce((acc, g) => acc + Number(g.purchase_price ?? 0), 0),
    [gear]
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'grid', gap: '0.625rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {filterChips.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                style={chipStyle(statusFilter === f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {categoryFilters.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategoryFilter(c.key)}
                style={chipStyle(categoryFilter === c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div
            data-tour="gear-total"
            style={{
              padding: '0.5rem 0.875rem',
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            Total value (owned):{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(totalValue)}
            </strong>
          </div>
          <button type="button" onClick={() => setMode({ kind: 'create' })} style={primaryButton}>
            + Add gear
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {gear.length === 0
            ? 'No gear yet. Click "Add gear" to track your first item.'
            : 'No gear matches these filters.'}
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {filtered.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => setMode({ kind: 'edit', gear: g })}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {g.name}
                  </span>
                  <Badge tone={statusToneMap[g.status as keyof typeof statusToneMap] ?? 'neutral'}>
                    {g.status ?? 'owned'}
                  </Badge>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {[g.brand, g.model].filter(Boolean).join(' ') || '—'}
                  {g.category ? ` · ${g.category}` : ''}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  <span>{formatCurrency(g.purchase_price)}</span>
                  {g.purchase_date ? (
                    <span>{new Date(g.purchase_date).toLocaleDateString()}</span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <GearForm mode={mode} onClose={() => setMode(null)} />
    </>
  );
}
