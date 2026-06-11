'use client';

/**
 * ScaledCanvas — render a fixed-size design and scale it to fit its container.
 *
 * THE problem this solves: an app UI (a dashboard, a phone screen) is designed
 * for ONE width. If you drop it into a narrower marketing frame and let it
 * reflow, columns cram, paddings look huge, and on mobile it overflows. Instead,
 * render it ONCE at its true design size and scale the whole thing like a
 * screenshot — spacing/proportions stay perfect at every size, and it can never
 * overflow (width is capped at 100% of the parent).
 *
 * It measures its own width (ResizeObserver + resize), computes
 * scale = min(maxScale, containerWidth / designWidth), applies a CSS transform,
 * and reserves the correct scaled height so surrounding layout doesn't jump.
 * Transformed DOM text stays crisp when scaled up OR down (vector re-raster).
 */
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

type Props = {
  /** Intrinsic width the children are designed for, in px. */
  designWidth: number;
  /** Intrinsic height the children are designed for, in px. */
  designHeight: number;
  /** Cap the scale. 1 = never upscale (phones). >1 lets it fill a larger frame crisply. */
  maxScale?: number;
  /** Optional px cap on the rendered width (defaults to designWidth * maxScale). */
  maxWidth?: number;
  children: ReactNode;
  style?: CSSProperties;
};

export function ScaledCanvas({ designWidth, designHeight, maxScale = 1, maxWidth, children, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0); // 0 until measured

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(maxScale, w / designWidth));
    };
    measure();
    const raf = requestAnimationFrame(measure); // catch post-layout width
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [designWidth, maxScale]);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        maxWidth: maxWidth ?? designWidth * maxScale,
        margin: '0 auto',
        // reserve the scaled height so the page doesn't reflow when scale resolves
        height: scale ? Math.round(designHeight * scale) : undefined,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale || 1})`,
          transformOrigin: 'top left',
          visibility: scale ? 'visible' : 'hidden', // avoid an unscaled flash
        }}
      >
        {children}
      </div>
    </div>
  );
}
