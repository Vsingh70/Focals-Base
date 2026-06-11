'use client';

/**
 * Scrollytelling — a pinned section that swaps between chapters as the user
 * scrolls. One sticky "stage" stays fixed in the viewport while a tall "track"
 * scrolls past underneath; the active chapter is derived from scroll progress.
 *
 * Drop-in for Next.js App Router (Client Component). Layout-critical styles are
 * INLINE so a missing/og-overridden CSS file can never break the sticky
 * mechanic. Responsive + cosmetic styles live in scrollytelling.css.
 *
 * Usage:
 *   <Scrollytelling
 *     side="right"
 *     deviceWidth={300}
 *     chapters={[
 *       { eyebrow: 'Projects', title: 'Your pipeline, grouped.',
 *         body: '…', render: () => <ProjectsMock /> },
 *       … 
 *     ]}
 *   />
 */
import { useRef, type ReactNode } from 'react';
import { useScrollProgress } from './useScrollProgress';

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
  deviceWidth?: number;    // px width of the device column
  /** vh of scroll distance PER chapter. Higher = slower swaps. Default 90. */
  vhPerChapter?: number;
};

export function Scrollytelling({
  chapters,
  side = 'right',
  deviceWidth = 300,
  vhPerChapter = 90,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const p = useScrollProgress(trackRef);
  const n = chapters.length;
  const active = Math.max(0, Math.min(n - 1, Math.floor(p * n)));

  return (
    // 1) TRACK — tall + relative. Height defines how long the effect lasts.
    <div ref={trackRef} className="scrolly-track" style={{ position: 'relative', height: `${n * vhPerChapter}vh` }}>
      {/* 2) STAGE — sticky + exactly one viewport tall. This is what "pins". */}
      <div className="scrolly-stage" style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div className="scrolly-inner" style={{ flexDirection: side === 'left' ? 'row-reverse' : 'row' }}>
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
                    {c.points.map((pt) => <li key={pt}>{pt}</li>)}
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
