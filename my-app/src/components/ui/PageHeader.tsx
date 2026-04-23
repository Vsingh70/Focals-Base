import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '2rem',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              margin: '0.5rem 0 0',
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div> : null}
    </header>
  );
}
