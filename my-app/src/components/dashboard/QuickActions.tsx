'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SlideOver } from '@/components/ui/SlideOver';
import { createProject } from '@/lib/actions/projects';
import { createClient } from '@/lib/actions/clients';

type OpenForm = 'project' | 'client' | null;

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

const actionButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '0.875rem 1rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9375rem',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  textDecoration: 'none',
  fontFamily: 'var(--font-sans)',
};

export function QuickActions() {
  const [open, setOpen] = useState<OpenForm>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleProjectSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createProject({
        title: String(formData.get('title') ?? ''),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(null);
      router.refresh();
    });
  };

  const handleClientSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createClient({
        full_name: String(formData.get('full_name') ?? ''),
        email: (formData.get('email') as string) || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(null);
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen('project');
          }}
          style={actionButtonStyle}
        >
          <span>New Project</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen('client');
          }}
          style={actionButtonStyle}
        >
          <span>Add Client</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
        </button>
        <Link href="/finances/add" style={actionButtonStyle}>
          <span>Log Expense</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
        </Link>
        <Link href="/inbox" style={actionButtonStyle}>
          <span>New Inquiry</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
        </Link>
      </div>

      <SlideOver
        open={open === 'project'}
        onClose={() => setOpen(null)}
        title="New Project"
      >
        <form action={handleProjectSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={labelStyle} htmlFor="project-title">
              Title
            </label>
            <input
              id="project-title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Johnson family portraits"
              style={inputStyle}
            />
          </div>
          {error ? (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {isPending ? 'Creating…' : 'Create project'}
          </button>
        </form>
      </SlideOver>

      <SlideOver open={open === 'client'} onClose={() => setOpen(null)} title="Add Client">
        <form action={handleClientSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={labelStyle} htmlFor="client-name">
              Name
            </label>
            <input
              id="client-name"
              name="full_name"
              required
              maxLength={200}
              placeholder="Full name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="client-email">
              Email (optional)
            </label>
            <input
              id="client-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              style={inputStyle}
            />
          </div>
          {error ? (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {isPending ? 'Saving…' : 'Add client'}
          </button>
        </form>
      </SlideOver>
    </>
  );
}
