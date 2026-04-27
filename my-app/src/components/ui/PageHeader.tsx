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
      className="app-page-header"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          className="app-page-title"
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
      {actions ? (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>
      ) : null}
    </header>
  );
}
