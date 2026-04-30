'use client';

import { useEffect, useState } from 'react';

/**
 * The dashboard's UpcomingProjectsStrip is rendered as a server component on
 * Vercel, which runs in UTC. If we let the server format `shoot_date`
 * directly, the displayed time and day are off by the user's UTC offset
 * (the symptom: every project shows "12:00 PM" because shoot_date values
 * are stored at noon UTC). Pulling the formatting into a client component
 * lets us render in the user's actual timezone.
 *
 * We render a deterministic UTC string for SSR + first paint, then swap to
 * the local timezone on `useEffect`. SSR HTML and the first client render
 * match exactly, so React doesn't trip the hydration mismatch warning.
 */

/** Top-of-card month + day badge. */
export function LocalDateBadge({ iso }: { iso: string }) {
  const [parts, setParts] = useState(() => formatParts(iso, 'UTC'));
  useEffect(() => {
    setParts(formatParts(iso, undefined));
  }, [iso]);

  return (
    <div
      style={{
        flex: '0 0 auto',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border-secondary)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.375rem 0.625rem',
        textAlign: 'center',
        minWidth: '3rem',
      }}
    >
      <div
        style={{
          fontSize: '0.625rem',
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.08em',
        }}
      >
        {parts.month}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          color: 'var(--color-text-primary)',
          lineHeight: 1,
          marginTop: '0.125rem',
        }}
      >
        {parts.day}
      </div>
    </div>
  );
}

/** Inline "h:mm AM/PM" string. */
export function LocalTime({ iso }: { iso: string }) {
  const [time, setTime] = useState(() => formatTime(iso, 'UTC'));
  useEffect(() => {
    setTime(formatTime(iso, undefined));
  }, [iso]);
  return <>{time}</>;
}

function formatParts(iso: string, timeZone: string | undefined) {
  const d = new Date(iso);
  return {
    month: d
      .toLocaleDateString('en-US', { month: 'short', timeZone })
      .toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: 'numeric', timeZone }),
  };
}

function formatTime(iso: string, timeZone: string | undefined) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}
