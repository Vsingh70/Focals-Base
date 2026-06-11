import type { CSSProperties, ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  /** Animation delay in ms. */
  delay?: number;
  /** Entrance rise distance in px. */
  y?: number;
  style?: CSSProperties;
};

/**
 * Entrance reveal — pure CSS (`.lp-reveal` in marketing.css), animates on
 * mount with a reduced-motion fallback, exactly like the prototype's
 * guaranteed-visible variant. No client JS required.
 */
export function Reveal({ children, delay = 0, y = 22, style }: RevealProps) {
  return (
    <div
      className="lp-reveal"
      style={{ '--lp-ry': `${y}px`, animationDelay: `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}
