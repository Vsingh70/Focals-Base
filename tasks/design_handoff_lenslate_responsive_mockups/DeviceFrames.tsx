'use client';

/**
 * DeviceFrames — PhoneFrame + BrowserFrame, both built on <ScaledCanvas>.
 *
 * Put your real app mock (or a screenshot) inside. It renders at a fixed design
 * size and scales to fit — so the SAME frame looks right in a wide hero, a
 * narrow scrollytelling column, and on mobile, with zero reflow.
 *
 *   <PhoneFrame designWidth={356}><ProjectsScreen /></PhoneFrame>
 *   <BrowserFrame designWidth={920} designHeight={440}><Dashboard /></BrowserFrame>
 *
 * Your app mock should fill its box: root element height: 100%, and let inner
 * scroll regions use overflow: hidden so nothing spills past designHeight.
 */
import type { ReactNode } from 'react';
import { ScaledCanvas } from './ScaledCanvas';

const ACCENT = '#e8e0d0';
const BORDER = '#222';
const BORDER2 = '#2a2a2a';
const BG = '#0a0a0a';
const BG2 = '#111';
const BG3 = '#1a1a1a';
const TEXT = '#f0f0f0';
const TEXT2 = '#888';
const TEXT3 = '#555';

/* ── Phone ───────────────────────────────────────────────────
   designWidth defaults to 356; height derives from the iPhone aspect.
   maxScale=1 so it never upscales past its design size on desktop;
   it only shrinks (and never overflows) on mobile.                 */
export function PhoneFrame({
  children,
  designWidth = 356,
  glow = true,
}: {
  children: ReactNode;
  designWidth?: number;
  glow?: boolean;
}) {
  const w = designWidth;
  const h = Math.round(w * (844 / 390));
  return (
    <ScaledCanvas designWidth={w} designHeight={h} maxScale={1} maxWidth={w} style={{ overflow: 'visible' }}>
      <div style={{ position: 'relative', width: w, height: h }}>
        {glow && (
          <div
            style={{
              position: 'absolute',
              inset: '-12% -18%',
              background: `radial-gradient(60% 50% at 50% 38%, ${ACCENT}22, transparent 70%)`,
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: w * 0.135,
            background: '#000',
            padding: w * 0.028,
            boxShadow: `0 1px 0 1px #1d1d1d, 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px ${BORDER2}`,
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.11, overflow: 'hidden', background: BG }}>
            <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'relative', zIndex: 5, background: BG }}>
              <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 12, fontWeight: 600, color: TEXT }}>9:41</span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <svg width="15" height="10" viewBox="0 0 19 12"><rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={TEXT} /><rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={TEXT} /><rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={TEXT} /><rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={TEXT} /></svg>
                <svg width="22" height="11" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={TEXT} strokeOpacity="0.4" fill="none" /><rect x="2" y="2" width="18" height="9" rx="2" fill={TEXT} /></svg>
              </span>
              <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: w * 0.32, height: 19, background: '#000', borderRadius: 12 }} />
            </div>
            <div style={{ position: 'absolute', top: 30, left: 0, right: 0, bottom: 0 }}>{children}</div>
            <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: w * 0.34, height: 4, borderRadius: 999, background: TEXT2, opacity: 0.5, zIndex: 6 }} />
          </div>
        </div>
      </div>
    </ScaledCanvas>
  );
}

/* ── Browser ─────────────────────────────────────────────────
   The app content renders at designWidth×designHeight and scales like a
   screenshot. maxScale > 1 lets it fill a large hero crisply; the parent
   (hero container max-width, or scrolly column width) controls actual size. */
export function BrowserFrame({
  children,
  designWidth = 920,
  designHeight = 440,
  maxScale = 1.45,
  maxWidth,
  url = 'app.lenslate.com/projects',
  glow = true,
}: {
  children: ReactNode;
  designWidth?: number;
  designHeight?: number;
  maxScale?: number;
  maxWidth?: number;
  url?: string;
  glow?: boolean;
}) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: maxWidth ?? 'none', margin: '0 auto' }}>
      {glow && (
        <div style={{ position: 'absolute', inset: '-8% -6% -14%', background: `radial-gradient(50% 60% at 50% 30%, ${ACCENT}1c, transparent 70%)`, filter: 'blur(10px)', pointerEvents: 'none' }} />
      )}
      <div style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', border: `0.5px solid ${BORDER2}`, background: BG2, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 42, padding: '0 14px', borderBottom: `0.5px solid ${BORDER}`, background: BG2 }}>
          <div style={{ display: 'flex', gap: 7 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c, opacity: 0.9 }} />)}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 26, padding: '0 14px', borderRadius: 7, background: BG3, border: `0.5px solid ${BORDER}`, maxWidth: 340 }}>
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke={TEXT3} strokeWidth="1.8"><rect x="4" y="9" width="12" height="8" rx="1.5" /><path d="M7 9V6.5a3 3 0 0 1 6 0V9" /></svg>
              <span style={{ fontSize: 12.5, color: TEXT2 }}>{url}</span>
            </div>
          </div>
          <div style={{ width: 52 }} />
        </div>
        <ScaledCanvas designWidth={designWidth} designHeight={designHeight} maxScale={maxScale} maxWidth={9999}>
          {children}
        </ScaledCanvas>
      </div>
    </div>
  );
}
