import type { CSSProperties, ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'article';
  padding?: 'sm' | 'md' | 'lg';
};

const padMap = {
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
};

export function Card({ children, style, as: Tag = 'section', padding = 'md' }: CardProps) {
  return (
    <Tag
      className="app-card"
      data-pad={padding}
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: padMap[padding],
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        ...style,
      }}
    >
      {children}
    </header>
  );
}

export function CardTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.125rem',
        fontWeight: 500,
        color: 'var(--color-text-primary)',
        margin: 0,
        letterSpacing: '-0.01em',
        ...style,
      }}
    >
      {children}
    </h2>
  );
}
