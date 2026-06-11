import type { ReactNode } from 'react';
import { Wordmark } from '@/components/brand/Wordmark';
import { LT } from './tokens';

const COLS = [
  { h: 'Product', items: ['Projects', 'Clients', 'Finances', 'Contracts', 'Calendar', 'Gear'] },
  { h: 'Company', items: ['About', 'Careers', 'Press', 'Contact'] },
  { h: 'Resources', items: ['Help center', 'Guides', 'Status', 'Changelog'] },
  { h: 'Legal', items: ['Privacy', 'Terms', 'Security', 'Licenses'] },
];

/** Marketing footer. `other` is the cross-platform CTA slot. */
export function Footer({ other }: { other?: ReactNode }) {
  return (
    <footer
      style={{ borderTop: `0.5px solid ${LT.border}`, background: LT.bg, padding: '64px 24px 40px' }}
    >
      <div style={{ maxWidth: LT.maxW, margin: '0 auto' }}>
        <div
          className="lp-footgrid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr repeat(4, 1fr)',
            gap: 32,
            paddingBottom: 48,
          }}
        >
          <div>
            <Wordmark fontSize="24px" />
            <p
              style={{
                fontFamily: LT.ui,
                fontSize: 13.5,
                lineHeight: 1.55,
                color: LT.text2,
                maxWidth: 260,
                marginTop: 14,
                marginBottom: 0,
              }}
            >
              The studio operating system for photographers, videographers, and media teams.
            </p>
            <div style={{ marginTop: 18 }}>{other}</div>
          </div>
          {COLS.map((c) => (
            <div key={c.h}>
              <div
                style={{
                  fontFamily: LT.ui,
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: LT.text3,
                  marginBottom: 14,
                }}
              >
                {c.h}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.items.map((it) => (
                  <a key={it} href="#" className="lp-link" style={{ fontFamily: LT.ui, fontSize: 14 }}>
                    {it}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 26,
            borderTop: `0.5px solid ${LT.border}`,
          }}
        >
          <span style={{ fontFamily: LT.ui, fontSize: 13, color: LT.text3 }}>
            © 2026 Lenslate Studio, Inc. All rights reserved.
          </span>
          <span style={{ fontFamily: LT.ui, fontSize: 13, color: LT.text3 }}>
            Made for people behind the lens.
          </span>
        </div>
      </div>
    </footer>
  );
}
