'use client';

import { useState } from 'react';
import { ClientForm } from './ClientForm';
import type { Database } from '@/lib/supabase/types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

const secondaryButton: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

export function ClientDetailActions({ client }: { client: ClientRow }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setEditing(true)} style={secondaryButton}>
        Edit
      </button>
      <ClientForm
        mode={editing ? { kind: 'edit', client } : null}
        onClose={() => setEditing(false)}
        redirectAfterDelete="/clients"
      />
    </>
  );
}
