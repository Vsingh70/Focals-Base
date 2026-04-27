'use client';

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { markTourSeen } from '@/lib/actions/tutorial';
import type { TourId } from '@/lib/tour/ids';
import type { TourStep } from './types';

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;
const DIALOG_WIDTH = 340;
const DIALOG_GAP = 12;
const DIALOG_FALLBACK_HEIGHT = 240;

function rectOf(el: Element | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
  };
}

function computeDialogPosition(
  target: Rect | null,
  placement: TourStep['placement'] = 'auto',
  dialogHeight: number = DIALOG_FALLBACK_HEIGHT,
  vw = typeof window !== 'undefined' ? window.innerWidth : 1280,
  vh = typeof window !== 'undefined' ? window.innerHeight : 720,
  scrollY = typeof window !== 'undefined' ? window.scrollY : 0,
  scrollX = typeof window !== 'undefined' ? window.scrollX : 0
): { top: number; left: number } {
  if (!target || placement === 'center') {
    return {
      top: scrollY + Math.max(16, vh / 2 - dialogHeight / 2),
      left: scrollX + vw / 2 - DIALOG_WIDTH / 2,
    };
  }

  // For 'auto' pick the side with the most room. We reuse this for any
  // explicit placement that doesn't actually fit, so the dialog falls back
  // to the largest open side rather than landing offscreen.
  const spaceBelow = vh - (target.top - scrollY + target.height) - DIALOG_GAP;
  const spaceAbove = target.top - scrollY - DIALOG_GAP;
  const spaceRight = vw - (target.left - scrollX + target.width) - DIALOG_GAP;
  const spaceLeft = target.left - scrollX - DIALOG_GAP;

  function pickBestSide() {
    const maxSpace = Math.max(spaceBelow, spaceAbove, spaceRight, spaceLeft);
    if (maxSpace === spaceBelow) return 'bottom' as const;
    if (maxSpace === spaceAbove) return 'top' as const;
    if (maxSpace === spaceRight) return 'right' as const;
    return 'left' as const;
  }

  let actual: 'top' | 'bottom' | 'left' | 'right' =
    placement === 'auto' ? pickBestSide() : (placement as 'top' | 'bottom' | 'left' | 'right');

  // If the explicit placement clearly doesn't fit, fall back to the best side.
  // Threshold is dialogHeight for vertical sides, DIALOG_WIDTH for horizontal.
  if (placement !== 'auto') {
    const fits =
      (actual === 'bottom' && spaceBelow >= dialogHeight) ||
      (actual === 'top' && spaceAbove >= dialogHeight) ||
      (actual === 'right' && spaceRight >= DIALOG_WIDTH) ||
      (actual === 'left' && spaceLeft >= DIALOG_WIDTH);
    if (!fits) actual = pickBestSide();
  }

  let top = 0;
  let left = 0;
  switch (actual) {
    case 'bottom':
      top = target.top + target.height + DIALOG_GAP;
      left = target.left + target.width / 2 - DIALOG_WIDTH / 2;
      break;
    case 'top':
      top = target.top - DIALOG_GAP - dialogHeight;
      left = target.left + target.width / 2 - DIALOG_WIDTH / 2;
      break;
    case 'right':
      top = target.top + target.height / 2 - dialogHeight / 2;
      left = target.left + target.width + DIALOG_GAP;
      break;
    case 'left':
      top = target.top + target.height / 2 - dialogHeight / 2;
      left = target.left - DIALOG_WIDTH - DIALOG_GAP;
      break;
  }

  // Clamp into viewport horizontally.
  const minLeft = scrollX + 16;
  const maxLeft = scrollX + vw - DIALOG_WIDTH - 16;
  left = Math.max(minLeft, Math.min(maxLeft, left));
  // Clamp into viewport vertically — this was the bug: top was floored but
  // never ceilinged, so a `placement: 'bottom'` step on a target near the
  // bottom of the viewport could push the dialog completely offscreen.
  const minTop = scrollY + 16;
  const maxTop = scrollY + vh - dialogHeight - 16;
  top = Math.max(minTop, Math.min(Math.max(minTop, maxTop), top));

  return { top, left };
}

export function Tour({
  tourId,
  steps,
  helpHref,
}: {
  tourId: TourId;
  steps: TourStep[];
  helpHref?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [dialogHeight, setDialogHeight] = useState<number>(DIALOG_FALLBACK_HEIGHT);
  const [isMobile, setIsMobile] = useState(false);
  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const step = steps[stepIndex];

  // Defer all rendering to the client. The tour reads window dimensions
  // and DOM measurements that don't exist during SSR; rendering it on
  // both sides causes a hydration mismatch.
  useEffect(() => {
    setMounted(true);
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 1024);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Recompute target position when step changes / on resize / on scroll.
  useLayoutEffect(() => {
    if (!active || !step) return;

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    function readRect() {
      if (!step.target) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(step.target);
      if (!el) {
        setTargetRect(null);
        return;
      }
      setTargetRect(rectOf(el));
    }

    function update() {
      if (!step.target) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(step.target);
      if (!el) {
        setTargetRect(null);
        return;
      }
      // Bring the target into view, then read its rect after the smooth
      // scroll settles. Reading immediately captures a stale position and
      // the dialog ends up anchored to the wrong place.
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTargetRect(rectOf(el));
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(readRect, 400);
    }

    update();
    window.addEventListener('resize', readRect);
    window.addEventListener('scroll', readRect, { passive: true });
    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener('resize', readRect);
      window.removeEventListener('scroll', readRect);
    };
  }, [active, step]);

  // Measure the dialog so we can clamp its computed position with the
  // real height instead of a 240px guess. Without this, tall dialogs
  // (longer body copy, multi-line title, or `helpHref` link) overflow
  // the viewport when placed near the bottom edge.
  useLayoutEffect(() => {
    if (!mounted || !active || isMobile) return;
    const el = dialogRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setDialogHeight(h);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted, active, isMobile, stepIndex]);

  // Esc to skip.
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  function finish() {
    setActive(false);
    startTransition(() => {
      // Fire and forget — don't block the UI on the network call.
      markTourSeen(tourId).catch(() => {
        /* swallow */
      });
    });
  }

  function next() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  function prev() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (!mounted || !active || !step) return null;

  const dialogPos = computeDialogPosition(targetRect, step.placement, dialogHeight);
  const isLast = stepIndex === steps.length - 1;

  // Spotlight uses a box-shadow trick: the highlight rect itself has
  // a transparent fill and a 9999px box-shadow that darkens everything else.
  const highlight: React.CSSProperties | null = targetRect
    ? {
        position: 'absolute',
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
        borderRadius: 'var(--radius-md)',
        boxShadow:
          '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 0 2px var(--color-accent), 0 0 0 6px rgba(232, 224, 208, 0.15)',
        pointerEvents: 'none',
        transition: 'all 0.25s ease',
      }
    : null;

  return (
    <div
      role="dialog"
      aria-label="Tutorial"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: targetRect ? 'none' : 'auto',
      }}
    >
      {/* Backdrop when there's no target (intro/outro steps) */}
      {!targetRect ? (
        <div
          onClick={finish}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            animation: 'fade-in 0.2s ease',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <div style={highlight!} />
        </div>
      )}

      {/* Step dialog — bottom sheet on mobile, floating on desktop. */}
      <div
        ref={dialogRef}
        style={
          isMobile
            ? {
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '70vh',
                overflowY: 'auto',
                background: 'var(--color-bg-secondary)',
                borderTop: '1px solid var(--color-border)',
                borderTopLeftRadius: 'var(--radius-lg)',
                borderTopRightRadius: 'var(--radius-lg)',
                padding: '1rem 1.125rem calc(1rem + env(safe-area-inset-bottom, 0px))',
                boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'auto',
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-primary)',
                animation: 'slide-up 0.2s ease',
              }
            : {
                position: 'absolute',
                top: dialogPos.top,
                left: dialogPos.left,
                width: DIALOG_WIDTH,
                maxWidth: 'calc(100vw - 32px)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.125rem',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'auto',
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-primary)',
                animation: 'fade-in 0.2s ease',
              }
        }
      >
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.375rem',
          }}
        >
          Step {stepIndex + 1} of {steps.length}
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.0625rem',
            fontWeight: 500,
            margin: '0 0 0.5rem',
            letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            lineHeight: 1.55,
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          {step.body}
        </p>

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={finish}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: '0.75rem',
              padding: '0.375rem 0.5rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Skip
          </button>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={prev}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              style={{
                padding: '0.375rem 0.875rem',
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>

        {helpHref ? (
          <div
            style={{
              marginTop: '0.625rem',
              paddingTop: '0.625rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.75rem',
              color: 'var(--color-text-tertiary)',
            }}
          >
            <Link
              href={helpHref}
              style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
            >
              Open the full guide →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
