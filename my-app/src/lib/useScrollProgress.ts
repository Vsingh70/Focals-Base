'use client';

/**
 * useScrollProgress — returns a 0..1 value for how far `ref` has travelled
 * through the viewport. Drives scroll-pinned ("scrollytelling") sections.
 *
 * Works against the WINDOW scroll (document flow). The element you pass must be
 * the tall TRACK (e.g. height: N*90vh) that contains a sticky stage.
 *
 * 'use client' is required — this reads window/DOM and runs effects, so the
 * component that uses it must be a Client Component.
 */
import { useEffect, useState, type RefObject } from 'react';

export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const measure = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height - vh; // scrollable distance while pinned
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const passed = -r.top; // how far the track top is above the viewport top
      setProgress(Math.max(0, Math.min(1, passed / total)));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    measure(); // initial state

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);

  return progress;
}
