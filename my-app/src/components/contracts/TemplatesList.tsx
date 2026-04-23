'use client';

import { useState } from 'react';
import { TemplateEditor } from './TemplateEditor';
import { extractTags } from '@/lib/contracts/mergeTags';
import type { Database } from '@/lib/supabase/types';

type Template = Database['public']['Tables']['contract_templates']['Row'];
type Mode = { kind: 'create' } | { kind: 'edit'; template: Template } | null;

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

const secondaryButton: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TemplatesList({ templates }: { templates: Template[] }) {
  const [mode, setMode] = useState<Mode>(null);

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
          + New template
        </button>
      </div>

      {templates.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          No templates yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {templates.map((t) => {
            const tags = extractTags(t.body);
            return (
              <li
                key={t.id}
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
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
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-tertiary)',
                      marginTop: '0.25rem',
                    }}
                  >
                    Updated {formatDate(t.updated_at)} · {tags.length} merge tag
                    {tags.length === 1 ? '' : 's'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'edit', template: t })}
                  style={secondaryButton}
                >
                  Edit
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <TemplateEditor mode={mode} onClose={() => setMode(null)} />
    </>
  );
}
