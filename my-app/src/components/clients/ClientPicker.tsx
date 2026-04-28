'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/actions/clients';
import { useToast } from '@/components/ui/Toast';

type ClientLite = { id: string; full_name: string };

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
  fontSize: '0.75rem',
  color: 'var(--color-text-tertiary)',
  marginBottom: '0.25rem',
};

/**
 * Client selector with inline "Add new client" capability. The select binds to
 * `name` so existing form-action callers continue to read `formData.get(name)`.
 * A hidden input mirrors the local state so the value survives across the
 * select / inline-form transitions.
 */
export function ClientPicker({
  name,
  defaultValue,
  clients: initialClients,
}: {
  name: string;
  defaultValue?: string | null;
  clients: ClientLite[];
}) {
  const [clients, setClients] = useState<ClientLite[]>(initialClients);
  const [selectedId, setSelectedId] = useState<string>(defaultValue ?? '');
  const [mode, setMode] = useState<'select' | 'inline-create'>('select');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();

  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === '__new__') {
      setMode('inline-create');
      return;
    }
    setSelectedId(value);
  }

  function cancelInline() {
    setMode('select');
    setError(null);
    setDraftName('');
    setDraftEmail('');
    setDraftPhone('');
  }

  function commitInline() {
    if (!draftName.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createClient({
        full_name: draftName.trim(),
        email: draftEmail.trim() || null,
        phone: draftPhone.trim() || null,
        source: 'manual',
      });
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      const created = res.data;
      // Add to local list and select it. The parent form's revalidatePath will
      // refresh the list of clients on next render.
      setClients((current) => [...current, { id: created.id, full_name: created.full_name }]);
      setSelectedId(created.id);
      cancelInline();
      show(`Added ${created.full_name}`, 'success');
    });
  }

  if (mode === 'inline-create') {
    return (
      <div
        style={{
          display: 'grid',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <input type="hidden" name={name} value={selectedId} />
        <div>
          <label style={labelStyle}>Full name</label>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            style={inputStyle}
            autoFocus
            maxLength={200}
            disabled={isPending}
          />
        </div>
        <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="optional"
              style={inputStyle}
              disabled={isPending}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              value={draftPhone}
              onChange={(e) => setDraftPhone(e.target.value)}
              placeholder="optional"
              style={inputStyle}
              disabled={isPending}
              maxLength={60}
            />
          </div>
        </div>
        {error ? (
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</p>
        ) : null}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={cancelInline}
            disabled={isPending}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commitInline}
            disabled={isPending}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Adding…' : 'Add client'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <select
      name={name}
      value={selectedId}
      onChange={handleSelectChange}
      style={{ ...inputStyle, appearance: 'auto' }}
    >
      <option value="">—</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.full_name}
        </option>
      ))}
      <option value="__new__">+ Add new client…</option>
    </select>
  );
}
