'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      setPending((current) => {
        current?.resolve(result);
        return null;
      });
    },
    []
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending ? <ConfirmDialog pending={pending} onResult={close} /> : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback to native confirm so the app still functions if a caller
    // mounts outside the provider (e.g. tests).
    return ({ title, message }: ConfirmOptions) =>
      Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return ctx;
}

function ConfirmDialog({
  pending,
  onResult,
}: {
  pending: Pending;
  onResult: (ok: boolean) => void;
}) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    confirmBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onResult(false);
      if (e.key === 'Enter') onResult(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResult]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.6)',
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
      onClick={(e) => {
        // backdrop click cancels
        if (e.target === e.currentTarget) onResult(false);
      }}
    >
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.25rem 1rem',
          maxWidth: 420,
          width: '100%',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          transform: entered ? 'scale(1)' : 'scale(0.96)',
          transition: 'transform 0.18s ease',
        }}
      >
        <h2
          id="confirm-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 500,
            margin: '0 0 0.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          {pending.title}
        </h2>
        {pending.message ? (
          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color: 'var(--color-text-secondary)',
              margin: '0 0 1rem',
            }}
          >
            {pending.message}
          </p>
        ) : null}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          <button
            type="button"
            onClick={() => onResult(false)}
            style={{
              padding: '0.5rem 0.875rem',
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {pending.cancelLabel ?? 'Cancel'}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onResult(true)}
            style={{
              padding: '0.5rem 0.875rem',
              background: pending.destructive ? 'var(--color-danger)' : 'var(--color-accent)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {pending.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
