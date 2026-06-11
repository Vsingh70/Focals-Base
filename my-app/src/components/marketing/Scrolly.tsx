'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Eyebrow } from './primitives';
import { LT } from './tokens';

export type ScrollyChapter = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

type ScrollyProps = {
  chapters: ScrollyChapter[];
  /** One framed device screen per chapter (same order as `chapters`). */
  devices: ReactNode[];
  /** Which side the sticky device sits on (desktop). */
  side?: 'left' | 'right';
  /** CSS width of the sticky device column content. */
  deviceWidth?: string;
  /** Sticky offset from the top of the viewport. */
  stickyTop?: string;
};

/**
 * Scrollytelling section — sticky device on one side, chapters of copy on
 * the other; the device screen crossfades as the active chapter changes.
 * Below 860px the sticky column hides and each chapter shows its device
 * inline (see marketing.css).
 *
 * Reimplementation: the prototype's landing-scrolly.jsx was not included
 * in the design handoff, so this rebuilds the pattern from the pages'
 * usage (chapters + renderDevice + side + deviceWidth).
 */
export function Scrolly({
  chapters,
  devices,
  side = 'right',
  deviceWidth = '320px',
  stickyTop = '16vh',
}: ScrollyProps) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(Number((e.target as HTMLElement).dataset.index ?? 0));
          }
        }
      },
      // A thin band around the viewport's vertical center decides the
      // active chapter.
      { rootMargin: '-45% 0px -45% 0px' }
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [chapters.length]);

  const deviceCol = (
    <div className="lp-scrolly-device" style={{ minWidth: 0 }}>
      <div style={{ position: 'sticky', top: stickyTop }}>
        <div style={{ position: 'relative', width: deviceWidth, maxWidth: '100%', margin: '0 auto' }}>
          {devices.map((d, i) => (
            <div
              key={i}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                inset: i === 0 ? undefined : 0,
                opacity: active === i ? 1 : 0,
                transition: 'opacity .45s ease',
                pointerEvents: active === i ? 'auto' : 'none',
              }}
              aria-hidden={active !== i}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const textCol = (
    <div style={{ minWidth: 0 }}>
      {chapters.map((c, i) => (
        <div
          key={c.title}
          ref={(el) => {
            refs.current[i] = el;
          }}
          data-index={i}
          className={`lp-scrolly-chapter${active === i ? ' is-active' : ''}`}
          style={{
            minHeight: '74vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '6vh 0',
          }}
        >
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h3
            style={{
              fontFamily: LT.serif,
              fontWeight: 500,
              fontSize: 'clamp(26px, 3.4vw, 40px)',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: LT.text,
              margin: '16px 0 0',
              maxWidth: 440,
              textWrap: 'balance',
            }}
          >
            {c.title}
          </h3>
          <p
            style={{
              fontFamily: LT.ui,
              fontSize: 16.5,
              lineHeight: 1.6,
              color: LT.text2,
              margin: '16px 0 0',
              maxWidth: 440,
              textWrap: 'pretty',
            }}
          >
            {c.body}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {c.points.map((p) => (
              <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <span style={{ color: LT.accent, display: 'inline-flex', marginTop: 2 }}>
                  <Check size={15} />
                </span>
                <span style={{ fontFamily: LT.ui, fontSize: 14.5, lineHeight: 1.5, color: LT.text2 }}>
                  {p}
                </span>
              </div>
            ))}
          </div>
          {/* Mobile-only inline device for this chapter */}
          <div className="lp-scrolly-inline">{devices[i]}</div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="lp-section" style={{ paddingTop: 20, paddingBottom: 20 }}>
      <div
        className="lp-scrolly"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
          gap: 'clamp(32px, 5vw, 72px)',
          alignItems: 'start',
        }}
      >
        {side === 'left' ? (
          <>
            {deviceCol}
            {textCol}
          </>
        ) : (
          <>
            {textCol}
            {deviceCol}
          </>
        )}
      </div>
    </section>
  );
}
