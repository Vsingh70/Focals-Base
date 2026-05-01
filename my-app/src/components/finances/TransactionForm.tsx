'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/actions/finances';
import {
  FINANCE_CATEGORIES,
  PAYMENT_METHODS,
  type TransactionType,
} from '@/lib/validations/finances';
import type { Database } from '@/lib/supabase/types';

type Transaction = Database['public']['Tables']['finances']['Row'];
type ProjectLite = { id: string; title: string };

export type TransactionFormMode =
  | { kind: 'create'; defaultType: TransactionType }
  | { kind: 'edit'; transaction: Transaction };

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

export function TransactionForm({
  mode,
  onClose,
  projects,
}: {
  mode: TransactionFormMode | null;
  onClose: () => void;
  projects: ProjectLite[];
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
  const t = isEdit ? mode.transaction : null;
  const defaultType: TransactionType = isEdit
    ? (mode.transaction.type as TransactionType)
    : mode.defaultType;
  const title = isEdit
    ? `Edit ${t!.type}`
    : defaultType === 'income'
      ? 'Log income'
      : 'Log expense';

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const amountRaw = formData.get('amount');
    const payload = {
      type: defaultType,
      amount: amountRaw && amountRaw !== '' ? Number(amountRaw) : 0,
      date: String(formData.get('date') ?? ''),
      category: (formData.get('category') as string) || null,
      description: (formData.get('description') as string) || null,
      payment_method: (formData.get('payment_method') as string) || null,
      project_id: (formData.get('project_id') as string) || null,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateTransaction({ id: t!.id, ...payload })
        : await createTransaction(payload);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      showToast(isEdit ? 'Transaction updated' : 'Transaction logged', 'success');
      onClose();
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!t) return;
    const confirmed = await confirm({
      title: 'Delete transaction?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete transaction',
      destructive: true,
    });
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteTransaction(t.id);
      if (res.error !== null) {
        setError(res.error);
        showToast(res.error, 'danger');
        return;
      }
      showToast('Transaction deleted', 'success');
      onClose();
      router.refresh();
    });
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const formId = 'transaction-form';
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
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Save'}
        </button>
      </div>
    </div>
  );

  return (
    <SlideOver open={mode !== null} onClose={onClose} title={title} footer={footer}>
      <form id={formId} key={formKey} action={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="tx-amount">
              Amount ($)
            </label>
            <input
              id="tx-amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={t?.amount ?? ''}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="tx-date">
              Date
            </label>
            <input
              id="tx-date"
              name="date"
              type="date"
              required
              defaultValue={t?.date ?? todayStr}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="tx-category">
            Category
          </label>
          <select
            id="tx-category"
            name="category"
            defaultValue={t?.category ?? ''}
            style={{ ...inputStyle, appearance: 'auto' }}
          >
            <option value="">—</option>
            {FINANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle} htmlFor="tx-method">
              Payment method
            </label>
            <select
              id="tx-method"
              name="payment_method"
              defaultValue={t?.payment_method ?? ''}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="">—</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="tx-project">
              Project
            </label>
            <select
              id="tx-project"
              name="project_id"
              defaultValue={t?.project_id ?? ''}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="tx-description">
            Description
          </label>
          <textarea
            id="tx-description"
            name="description"
            rows={2}
            defaultValue={t?.description ?? ''}
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
