import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { LT } from './tokens';

// ── Buttons ──────────────────────────────────────────────────

type BtnProps = {
  children: ReactNode;
  kind?: 'primary' | 'ghost' | 'quiet';
  href?: string;
  size?: 'md' | 'lg';
  icon?: ReactNode;
};

export function Btn({ children, kind = 'primary', href = '#', size = 'md', icon }: BtnProps) {
  const styles: Record<NonNullable<BtnProps['kind']>, CSSProperties> = {
    primary: { background: LT.accent, color: '#0a0a0a', border: `1px solid ${LT.accent}` },
    ghost: { background: 'transparent', color: LT.text, border: `1px solid ${LT.border2}` },
    quiet: { background: LT.bg2, color: LT.text, border: `1px solid ${LT.border}` },
  };
  return (
    <Link
      href={href}
      className="lp-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        height: size === 'lg' ? 52 : 44,
        padding: size === 'lg' ? '0 22px' : '0 16px',
        borderRadius: 11,
        textDecoration: 'none',
        fontFamily: LT.ui,
        fontSize: size === 'lg' ? 16 : 15,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        ...styles[kind],
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

// App Store badge (drawn, not an image). The app isn't shipped yet, so it
// keeps the prototype's "#download" anchor.
export function AppStoreBadge({ size = 'lg' }: { size?: 'md' | 'lg' }) {
  return (
    <a
      href="#download"
      className="lp-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 11,
        height: size === 'lg' ? 52 : 46,
        padding: '0 18px 0 16px',
        borderRadius: 11,
        background: LT.text,
        color: '#0a0a0a',
        textDecoration: 'none',
        border: `1px solid ${LT.text}`,
      }}
    >
      <svg width="22" height="26" viewBox="0 0 22 26" fill="#0a0a0a" aria-hidden="true">
        <path d="M17.6 13.8c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9s-2.1-.9-3.4-.9c-1.8 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6.7-1 1-1.5 1.5-2.6-3.9-1.5-3.4-5-.4-5.1zM15 4.2c.7-.9 1.2-2.1 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3.1-1.4z" />
      </svg>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, fontFamily: LT.ui }}>
        <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.7 }}>Download on the</span>
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>App Store</span>
      </span>
    </a>
  );
}

// ── Section primitives ───────────────────────────────────────

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: LT.ui,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: LT.accent,
      }}
    >
      <span style={{ width: 18, height: 1, background: LT.accent, opacity: 0.6 }} />
      {children}
    </div>
  );
}

export function SectionTitle({ children, max = 620 }: { children: ReactNode; max?: number }) {
  return (
    <h2
      style={{
        fontFamily: LT.serif,
        fontWeight: 500,
        fontSize: 'clamp(30px, 4.4vw, 50px)',
        lineHeight: 1.06,
        letterSpacing: '-0.02em',
        color: LT.text,
        margin: 0,
        maxWidth: max,
        textWrap: 'balance',
      }}
    >
      {children}
    </h2>
  );
}

export function Lead({ children, max = 560 }: { children: ReactNode; max?: number }) {
  return (
    <p
      style={{
        fontFamily: LT.ui,
        fontSize: 'clamp(16px, 1.7vw, 19px)',
        lineHeight: 1.55,
        color: LT.text2,
        margin: 0,
        maxWidth: max,
        textWrap: 'pretty',
      }}
    >
      {children}
    </p>
  );
}
