import type { CSSProperties } from 'react';

export function Skeleton({
  height = '1rem',
  width = '100%',
  style,
}: {
  height?: string | number;
  width?: string | number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        height,
        width,
        background: 'var(--color-bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        animation: 'skeleton-pulse 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}
