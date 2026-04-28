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

type ToastTone = 'success' | 'danger' | 'info';

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++idRef.current;
    setToasts((current) => [...current, { id, tone, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op when used outside the provider — avoids crashes during SSR
    // or in unit-test contexts that mount components in isolation.
    return { show: () => {} };
  }
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none',
        width: 'min(420px, calc(100vw - 2rem))',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const accent = toneColor(toast.tone);

  return (
    <div
      role="status"
      style={{
        pointerEvents: 'auto',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 0.875rem',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.875rem',
        lineHeight: 1.4,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        transform: entered ? 'translateY(0)' : 'translateY(8px)',
        opacity: entered ? 1 : 0,
        transition: 'transform 0.18s ease, opacity 0.18s ease',
      }}
    >
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-tertiary)',
          padding: 0,
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function toneColor(tone: ToastTone): string {
  switch (tone) {
    case 'success':
      return 'var(--color-success)';
    case 'danger':
      return 'var(--color-danger)';
    case 'info':
      return 'var(--color-accent)';
  }
}
