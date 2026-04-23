import type { CSSProperties, ReactNode } from 'react';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const toneStyles: Record<BadgeTone, CSSProperties> = {
  neutral: {
    background: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-secondary)',
    borderColor: 'var(--color-border-secondary)',
  },
  success: {
    background: 'rgba(76, 175, 125, 0.12)',
    color: 'var(--color-success)',
    borderColor: 'rgba(76, 175, 125, 0.3)',
  },
  warning: {
    background: 'rgba(232, 160, 32, 0.12)',
    color: 'var(--color-warning)',
    borderColor: 'rgba(232, 160, 32, 0.3)',
  },
  danger: {
    background: 'rgba(232, 80, 64, 0.12)',
    color: 'var(--color-danger)',
    borderColor: 'rgba(232, 80, 64, 0.3)',
  },
  accent: {
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    borderColor: 'var(--color-accent-muted)',
  },
};

export function Badge({
  children,
  tone = 'neutral',
  style,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        border: '1px solid',
        borderRadius: 'var(--radius-sm)',
        whiteSpace: 'nowrap',
        ...toneStyles[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

const projectStatusToneMap: Record<string, BadgeTone> = {
  inquiry: 'neutral',
  booked: 'accent',
  in_progress: 'warning',
  editing: 'warning',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = projectStatusToneMap[status] ?? 'neutral';
  const label = status.replace(/_/g, ' ');
  return <Badge tone={tone}>{label}</Badge>;
}

const paymentStatusToneMap: Record<string, BadgeTone> = {
  unpaid: 'danger',
  partial: 'warning',
  paid: 'success',
};

export function PaymentBadge({ status }: { status: string }) {
  const tone = paymentStatusToneMap[status] ?? 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}
