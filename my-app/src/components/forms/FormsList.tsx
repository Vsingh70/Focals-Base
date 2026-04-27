'use client';

import { useState } from 'react';
import { FormBuilder, type FormBuilderMode } from './FormBuilder';
import type { Database } from '@/lib/supabase/types';

type FormRow = Database['public']['Tables']['forms']['Row'];

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

function customFieldCount(rawFields: unknown): number {
  if (!Array.isArray(rawFields)) return 0;
  return rawFields.length;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FormsList({ forms }: { forms: FormRow[] }) {
  const [mode, setMode] = useState<FormBuilderMode | null>(null);

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '1rem',
        }}
      >
        <button type="button" onClick={() => setMode({ kind: 'create' })} style={primaryButton}>
          + New form
        </button>
      </div>

      {forms.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          No forms yet. Create one to define custom fields for projects, finances, or shoots.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.625rem' }}>
          {forms.map((f) => (
            <li
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1rem 1.25rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {f.name}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '0.25rem',
                  }}
                >
                  Updated {formatDate(f.updated_at)} · {customFieldCount(f.fields)} custom fields
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMode({ kind: 'edit', form: f })}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}

      <FormBuilder mode={mode} onClose={() => setMode(null)} />
    </>
  );
}
