import { CSSProperties } from 'react';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Lenslate';

type WordmarkProps = {
  /** Display size, e.g. '1.125rem' (sidebar) or '2.25rem' (login). */
  fontSize?: string;
  /** Tighter tracking reads better at large sizes. */
  letterSpacing?: string;
  color?: string;
  style?: CSSProperties;
};

/**
 * Lenslate wordmark — name in the display serif (Canela) followed by a
 * bone "lens dot". Temporary identity; the dot is the only mark for now.
 */
export function Wordmark({
  fontSize = '1.125rem',
  letterSpacing = '-0.01em',
  color = 'var(--color-text-primary)',
  style,
}: WordmarkProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        fontFamily: 'var(--font-display)',
        fontSize,
        fontWeight: 500,
        letterSpacing,
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {APP_NAME}
      <span
        aria-hidden="true"
        style={{
          width: '0.16em',
          height: '0.16em',
          borderRadius: '50%',
          background: 'var(--color-accent)',
          marginLeft: '0.12em',
          marginBottom: '0.14em',
          flex: '0 0 auto',
        }}
      />
    </span>
  );
}
