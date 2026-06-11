'use client';

import { useEffect, useState } from 'react';
import { LT } from './tokens';

type RotatingWordProps = {
  words: string[];
  color?: string;
  interval?: number;
};

/** Rotating audience word in the hero headline (italic, accent). */
export function RotatingWord({ words, color, interval = 2200 }: RotatingWordProps) {
  const [i, setI] = useState(0);
  const [on, setOn] = useState(true);

  useEffect(() => {
    // Respect reduced motion — keep the first word static.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      setOn(false);
      setTimeout(() => {
        setI((x) => (x + 1) % words.length);
        setOn(true);
      }, 320);
    }, interval);
    return () => clearInterval(t);
  }, [interval, words.length]);

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        color: color || LT.accent,
        fontStyle: 'italic',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          opacity: on ? 1 : 0,
          transform: on ? 'translateY(0)' : 'translateY(0.25em)',
          transition: 'opacity .32s ease, transform .32s ease',
        }}
      >
        {words[i]}
      </span>
    </span>
  );
}
