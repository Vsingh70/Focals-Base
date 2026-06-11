'use client';

/**
 * Scrollytelling — a pinned section that swaps between chapters as the user
 * scrolls. One sticky "stage" stays fixed in the viewport while a tall "track"
 * scrolls past underneath; the active chapter is derived from scroll progress.
 *
 * Drop-in from tasks/design_handoff_lenslate_scrollytelling. Layout-critical
 * styles are INLINE so a missing/overridden CSS file can never break the
 * sticky mechanic. Responsive + cosmetic styles live in scrollytelling.css
 * (imported by the (marketing) layout).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useScrollProgress } from '@/lib/useScrollProgress';

export type ScrollyChapter = {
  eyebrow: string;
  title: string;
  body: string;
  points?: string[];
  render: () => ReactNode; // the device/screen visual for this chapter
};

type Props = {
  chapters: ScrollyChapter[];
  side?: 'left' | 'right'; // which side the device sits on
  /** Width of the device column — px number or any CSS width. */
  deviceWidth?: number | string;
  /** vh of scroll distance PER chapter. Higher = slower swaps. Default 90. */
  vhPerChapter?: number;
  /** Device width in the unpinned mobile stack. Keep small enough that
      copy + device fit a phone viewport together. */
  mobileDeviceWidth?: string;
};

export function Scrollytelling({
  chapters,
  side = 'right',
  deviceWidth = 300,
  vhPerChapter = 90,
  mobileDeviceWidth = 'min(68vw, 260px)',
}: Props) {
  // The pin only works when copy + device fit a 100svh stage together.
  // Below 1024px (stacked layout, portrait phone mock) they don't — so we
  // drop the pin and flow the chapters as a normal vertical stack.
  const [pinned, setPinned] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setPinned(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const p = useScrollProgress(trackRef, pinned);
  const n = chapters.length;
  const active = Math.max(0, Math.min(n - 1, Math.floor(p * n)));

  if (!pinned) {
    // Mobile: plain flowing stack — no track, no sticky, no scroll driver.
    // Everything static and fully visible; the device renders below its copy.
    return (
      <div className="scrolly-flow">
        {chapters.map((c, i) => (
          <section key={i} className="scrolly-flow-chapter">
            <div className="scrolly-eyebrow">{c.eyebrow}</div>
            <h2 className="scrolly-title">{c.title}</h2>
            <p className="scrolly-body">{c.body}</p>
            {c.points && (
              <ul className="scrolly-points">
                {c.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            )}
            <div className="scrolly-flow-device" style={{ width: mobileDeviceWidth }}>
              {c.render()}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    // 1) TRACK — tall + relative. Height defines how long the effect lasts.
    <div
      ref={trackRef}
      className="scrolly-track"
      style={{ position: 'relative', height: `${n * vhPerChapter}vh` }}
    >
      {/* 2) STAGE — sticky + exactly one viewport tall. This is what "pins". */}
      <div
        className="scrolly-stage"
        style={{
          position: 'sticky',
          top: 0,
          // svh: the small-viewport unit, so collapsing mobile browser
          // chrome at intermediate widths can never clip the stage.
          height: '100svh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          className="scrolly-inner"
          style={{ flexDirection: side === 'left' ? 'row-reverse' : 'row' }}
        >
          {/* COPY column — chapters overlaid (absolute), opacity-swapped */}
          <div className="scrolly-copy">
            {chapters.map((c, i) => (
              <div
                key={i}
                className={`scrolly-chapter${active === i ? ' is-active' : ''}`}
                // first chapter is relative so the column has height; rest overlay it
                style={{ position: i === 0 ? 'relative' : 'absolute', inset: i === 0 ? 'auto' : 0 }}
                aria-hidden={active !== i}
              >
                <div className="scrolly-eyebrow">{c.eyebrow}</div>
                <h2 className="scrolly-title">{c.title}</h2>
                <p className="scrolly-body">{c.body}</p>
                {c.points && (
                  <ul className="scrolly-points">
                    {c.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* DEVICE column — screens overlaid, opacity + scale swapped */}
          <div className="scrolly-device" style={{ width: deviceWidth, maxWidth: '88vw' }}>
            {chapters.map((c, i) => (
              <div
                key={i}
                className={`scrolly-screen${active === i ? ' is-active' : ''}`}
                style={{ position: i === 0 ? 'relative' : 'absolute', inset: i === 0 ? 'auto' : 0 }}
              >
                {c.render()}
              </div>
            ))}
          </div>
        </div>

        {/* progress dots — pure feedback */}
        <div className="scrolly-dots">
          {chapters.map((_, i) => (
            <span key={i} className={active === i ? 'is-active' : ''} />
          ))}
        </div>
      </div>
    </div>
  );
}
