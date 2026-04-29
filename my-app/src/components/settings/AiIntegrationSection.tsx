'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  setAnthropicKey,
  removeAnthropicKey,
  type IntegrationStatus,
} from '@/lib/actions/integrations';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9375rem',
  fontFamily: 'var(--font-mono, ui-monospace), monospace',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem',
};

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

const ghostButton: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const dangerButton: React.CSSProperties = {
  ...ghostButton,
  color: 'var(--color-danger)',
  borderColor: 'rgba(232, 80, 64, 0.3)',
};

export function AiIntegrationSection({ initial }: { initial: IntegrationStatus }) {
  const [status, setStatus] = useState<IntegrationStatus>(initial);
  const [isEditing, setIsEditing] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { show: showToast } = useToast();
  const confirm = useConfirm();

  function handleSave() {
    setError(null);
    if (!keyInput.trim()) {
      setError('Paste your Anthropic API key.');
      return;
    }
    startTransition(async () => {
      const res = await setAnthropicKey({ key: keyInput });
      if (res.error !== null) {
        setError(res.error);
        showToast(res.error, 'danger');
        return;
      }
      setStatus(res.data);
      setKeyInput('');
      setIsEditing(false);
      showToast('AI file import connected', 'success');
      router.refresh();
    });
  }

  async function handleRemove() {
    const confirmed = await confirm({
      title: 'Disconnect AI file import?',
      message: 'Your stored Anthropic key will be deleted. Re-add it any time.',
      confirmLabel: 'Disconnect',
      destructive: true,
    });
    if (!confirmed) return;
    startTransition(async () => {
      const res = await removeAnthropicKey();
      if (res.error !== null) {
        showToast(res.error, 'danger');
        return;
      }
      setStatus({ provider: 'anthropic', connected: false, keyHint: null, lastUsedAt: null });
      showToast('Disconnected', 'success');
      router.refresh();
    });
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: status.connected || isEditing ? '0.875rem' : 0,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            AI file import
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.125rem',
              lineHeight: 1.4,
            }}
          >
            Drop a PDF, CSV, XLSX, DOCX, image, or text file on the Projects page
            and Claude will extract project details. Your Anthropic API key is
            encrypted at rest and used only for files you upload.
          </div>
        </div>
        <Badge tone={status.connected ? 'success' : 'neutral'}>
          {status.connected ? 'Connected' : 'Not connected'}
        </Badge>
      </div>

      {status.connected && !isEditing ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            padding: '0.75rem 0.875rem',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono, ui-monospace), monospace',
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
                wordBreak: 'break-all',
              }}
            >
              {status.keyHint}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-tertiary)',
                marginTop: '0.125rem',
              }}
            >
              {status.lastUsedAt
                ? `Last used ${new Date(status.lastUsedAt).toLocaleDateString()}`
                : 'Not used yet'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              style={ghostButton}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              style={dangerButton}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : null}

      {!status.connected || isEditing ? (
        <div
          style={{
            display: 'grid',
            gap: '0.625rem',
            padding: '0.875rem',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <label style={labelStyle} htmlFor="anthropic-key">
              Anthropic API key
            </label>
            <input
              id="anthropic-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-api03-…"
              style={inputStyle}
              autoComplete="off"
              disabled={isPending}
            />
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-tertiary)',
                margin: '0.375rem 0 0',
              }}
            >
              Generate one at{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                console.anthropic.com
              </a>
              . You'll be billed by Anthropic for usage; we never see the key in plaintext.
            </p>
          </div>
          {error ? (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
              {error}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
            {isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setKeyInput('');
                  setError(null);
                }}
                disabled={isPending}
                style={ghostButton}
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Validating…' : status.connected ? 'Replace key' : 'Connect'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
