'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Wordmark } from '@/components/brand/Wordmark';
import { LT } from './tokens';

type TopNavProps = {
  links: { label: string; href: string }[];
  cta?: ReactNode;
  /** Small chip next to the wordmark, e.g. "Web" or "iOS". */
  platform?: string;
};

/** Fixed marketing nav — transparent at the top, frosted once scrolled. */
export function TopNav({ links, cta, platform }: TopNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', f, { passive: true });
    f();
    return () => window.removeEventListener('scroll', f);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(10,10,10,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(140%) blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(16px)' : 'none',
        borderBottom: `0.5px solid ${scrolled ? LT.border : 'transparent'}`,
        transition: 'background .3s, border-color .3s, backdrop-filter .3s',
      }}
    >
      <div
        style={{
          maxWidth: LT.maxW,
          margin: '0 auto',
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <a href="#top" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Wordmark fontSize="21px" />
          {platform && (
            <span
              style={{
                fontFamily: LT.ui,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: LT.text2,
                border: `1px solid ${LT.border2}`,
                borderRadius: 6,
                padding: '3px 6px',
              }}
            >
              {platform}
            </span>
          )}
        </a>
        <div style={{ flex: 1 }} />
        <div className="lp-navlinks" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="lp-link"
              style={{ fontFamily: LT.ui, fontSize: 14, fontWeight: 500 }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ marginLeft: 6 }}>{cta}</div>
      </div>
    </div>
  );
}
