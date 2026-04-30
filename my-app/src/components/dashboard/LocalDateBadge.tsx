/**
 * shoot_date is wall-clock: the digits stored on the row are the digits the
 * photographer typed, anchored at UTC purely so Postgres has a valid
 * timestamptz to store. Every renderer formats with timeZone: 'UTC' so the
 * value round-trips unchanged through any viewer locale — Vercel server,
 * EDT browser, Tokyo browser, all show the same number.
 */

/** Top-of-card month + day badge. */
export function LocalDateBadge({ iso }: { iso: string }) {
  const parts = formatParts(iso);

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
  return <>{formatTime(iso)}</>;
}

function formatParts(iso: string) {
  const d = new Date(iso);
  return {
    month: d
      .toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
      .toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' }),
  };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}
