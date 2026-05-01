'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import { deleteAccount } from '@/lib/actions/profile';
import { resetTours } from '@/lib/actions/tutorial';

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
  background: 'var(--color-danger)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

export function AccountSection() {
  const router = useRouter();
  const [signingOut, startSigningOut] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [resetting, startResetting] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const handleSignOut = () => {
    startSigningOut(async () => {
      await signOut();
    });
  };

  const handleResetTours = () => {
    setError(null);
    setResetConfirmed(false);
    startResetting(async () => {
      const res = await resetTours();
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      setResetConfirmed(true);
      router.refresh();
    });
  };

  const handleDelete = () => {
    setError(null);
    startDeleting(async () => {
      const res = await deleteAccount(confirmText);
      // If the action fails it returns; if it succeeds it redirects.
      if (res && res.error !== null) {
        setError(res.error);
      }
    });
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Sign out
          </p>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              margin: '0.25rem 0 0',
            }}
          >
            Sign out of this device. You can sign back in with Google.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          style={secondaryButton}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '0.625rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Replay tutorials
            </p>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                margin: '0.25rem 0 0',
              }}
            >
              Reset the in-app tours so they show again next time you visit each page.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetTours}
            disabled={resetting}
            style={secondaryButton}
          >
            {resetting ? 'Resetting…' : 'Replay tutorials'}
          </button>
        </div>

        {/* The tour itself only mounts on tour-eligible pages (Dashboard,
            Projects, Calendar, etc.) — clicking "Replay tutorials" while
            on /settings has no visible effect on this page. Surface that
            with an inline notice so the user knows where to look. */}
        {resetConfirmed ? (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              background: 'rgba(76, 175, 125, 0.08)',
              border: '1px solid rgba(76, 175, 125, 0.3)',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              Tutorials reset. Open the Dashboard to replay them.
            </span>
            <button
              type="button"
              onClick={() => router.push('/')}
              style={{
                ...secondaryButton,
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                borderColor: 'transparent',
              }}
            >
              Open Dashboard
            </button>
          </div>
        ) : null}
      </div>

      <div
        style={{
          padding: '1rem',
          background: 'rgba(232, 80, 64, 0.05)',
          border: '1px solid rgba(232, 80, 64, 0.3)',
          borderRadius: 'var(--radius-md)',
          display: 'grid',
          gap: '0.75rem',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--color-danger)',
              margin: 0,
            }}
          >
            Delete account
          </p>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              margin: '0.25rem 0 0',
              lineHeight: 1.5,
            }}
          >
            Permanently deletes your account and ALL associated data: projects, clients, shoots,
            finances, gear, inquiries, contracts, links, forms. This cannot be undone.
          </p>
        </div>

        {!showDelete ? (
          <div>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              style={{
                ...secondaryButton,
                color: 'var(--color-danger)',
                borderColor: 'rgba(232, 80, 64, 0.3)',
              }}
            >
              I understand, continue
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', margin: 0 }}>
              Type <code style={{ fontFamily: 'ui-monospace, monospace' }}>DELETE</code> to
              confirm:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              style={inputStyle}
            />
            {error ? (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
                {error}
              </p>
            ) : null}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmText('');
                  setError(null);
                }}
                disabled={deleting}
                style={secondaryButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || confirmText !== 'DELETE'}
                style={{
                  ...dangerButton,
                  opacity: deleting || confirmText !== 'DELETE' ? 0.5 : 1,
                  cursor:
                    deleting || confirmText !== 'DELETE' ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete account permanently'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
