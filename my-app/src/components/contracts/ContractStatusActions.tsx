'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateContractStatus, deleteContract } from '@/lib/actions/contracts';

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

const dangerButton: React.CSSProperties = {
  ...secondaryButton,
  color: 'var(--color-danger)',
  borderColor: 'rgba(232, 80, 64, 0.3)',
};

export function ContractStatusActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const setStatus = (status: 'sent' | 'signed' | 'void' | 'draft') => {
    setError(null);
    startTransition(async () => {
      const res = await updateContractStatus({ id, status });
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteContract(id);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      router.push('/contracts');
      router.refresh();
    });
  };

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {currentStatus !== 'sent' && currentStatus !== 'signed' && currentStatus !== 'void' ? (
          <button
            type="button"
            onClick={() => setStatus('sent')}
            disabled={isPending}
            style={secondaryButton}
          >
            Mark as sent
          </button>
        ) : null}
        {currentStatus !== 'signed' && currentStatus !== 'void' ? (
          <button
            type="button"
            onClick={() => setStatus('signed')}
            disabled={isPending}
            style={secondaryButton}
          >
            Mark as signed
          </button>
        ) : null}
        {currentStatus !== 'void' ? (
          <button
            type="button"
            onClick={() => setStatus('void')}
            disabled={isPending}
            style={dangerButton}
          >
            Void
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStatus('draft')}
            disabled={isPending}
            style={secondaryButton}
          >
            Restore to draft
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          style={{ ...dangerButton, marginLeft: 'auto' }}
        >
          Delete
        </button>
      </div>
      {error ? (
        <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
