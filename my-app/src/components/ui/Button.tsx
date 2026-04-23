import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
  textDecoration: 'none',
  lineHeight: 1,
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '0.5rem 0.875rem', fontSize: '0.8125rem' },
  md: { padding: '0.75rem 1.25rem', fontSize: '0.9375rem' },
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-accent)',
    color: 'var(--color-bg)',
    border: '1px solid var(--color-accent)',
  },
  secondary: {
    background: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-secondary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
};

function resolveStyle(variant: Variant, size: Size, style?: React.CSSProperties) {
  return { ...base, ...sizeStyles[size], ...variantStyles[variant], ...style };
}

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'primary',
  size = 'md',
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button style={resolveStyle(variant, size, style)} {...props}>
      {children}
    </button>
  );
}

type LinkButtonProps = {
  variant?: Variant;
  size?: Size;
  href: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

export function LinkButton({
  variant = 'primary',
  size = 'md',
  style,
  href,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link href={href} style={resolveStyle(variant, size, style)} {...props}>
      {children}
    </Link>
  );
}
