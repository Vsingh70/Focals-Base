'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { ClientForm, type ClientFormMode } from './ClientForm';
import type { Database } from '@/lib/supabase/types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

const SOURCES = ['all', 'inquiry', 'referral', 'instagram', 'website', 'manual'] as const;
type SourceFilter = (typeof SOURCES)[number];

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

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-sans)',
  width: '100%',
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

export function ClientsList({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [mode, setMode] = useState<ClientFormMode | null>(null);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (source !== 'all' && c.source !== source) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${c.full_name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [clients, search, source]);

  return (
    <>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          data-tour="clients-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            style={{ ...inputStyle, flex: 1, minWidth: '240px' }}
          />
          <button type="button" onClick={() => setMode({ kind: 'create' })} style={primaryButton}>
            + New client
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {SOURCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              style={chipStyle(source === s)}
            >
              {s}
            </button>
          ))}
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
          {clients.length === 0
            ? 'No clients yet. Click "New client" to add one.'
            : 'No clients match these filters.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                      marginTop: '0.125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                {c.source ? <Badge tone="neutral">{c.source}</Badge> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ClientForm mode={mode} onClose={() => setMode(null)} />
    </>
  );
}
