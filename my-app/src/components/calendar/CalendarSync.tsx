'use client';

import { useState, useTransition } from 'react';
import { regenerateCalendarToken, type CalendarFeed } from '@/lib/actions/calendar';

const buttonSecondary: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
};

export function CalendarSync({ feed }: { feed: CalendarFeed }) {
  const [current, setCurrent] = useState(feed);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard access denied');
    }
  };

  const handleRegenerate = () => {
    if (!confirm('Regenerating the token invalidates your current calendar subscriptions. Continue?')) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await regenerateCalendarToken();
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      setCurrent(res.data);
    });
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
        Subscribe to this feed from Apple Calendar, Google Calendar, Outlook, or any other
        calendar app.
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.375rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <code
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.5rem 0.75rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          {current.httpsUrl}
        </code>
        <button type="button" onClick={handleCopy} style={buttonSecondary}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <a href={current.webcalUrl} style={buttonSecondary}>
          Add to Apple Calendar
        </a>
        <a
          href={current.googleAddUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonSecondary}
        >
          Add to Google Calendar
        </a>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isPending}
          style={{ ...buttonSecondary, opacity: isPending ? 0.6 : 1, marginLeft: 'auto' }}
        >
          {isPending ? 'Regenerating…' : 'Regenerate URL'}
        </button>
      </div>

      {error ? (
        <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
