'use client';

import { useEffect, useState, useTransition } from 'react';
import { regenerateCalendarToken, type CalendarFeed } from '@/lib/actions/calendar';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

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
  justifyContent: 'center',
  gap: '0.375rem',
};

const buttonStackedMobile: React.CSSProperties = {
  ...buttonSecondary,
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
};

export function CalendarSync({ feed }: { feed: CalendarFeed }) {
  const [current, setCurrent] = useState(feed);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { show: showToast } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    setMounted(true);
    const update = () => setIsMobile(window.innerWidth <= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard access denied');
    }
  };

  const handleRegenerate = async () => {
    const confirmed = await confirm({
      title: 'Regenerate calendar token?',
      message:
        'Your existing calendar subscriptions will stop syncing. You’ll need to re-subscribe with the new URL.',
      confirmLabel: 'Regenerate',
      destructive: true,
    });
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const res = await regenerateCalendarToken();
      if (res.error !== null) {
        setError(res.error);
        showToast(res.error, 'danger');
        return;
      }
      setCurrent(res.data);
      showToast('Calendar token regenerated', 'success');
    });
  };

  // Don't render until mounted to avoid hydration mismatch on the conditional.
  // Render desktop layout while waiting (it's the more complete one).
  const renderMobile = mounted && isMobile;

  return (
    <div
      style={{
        display: 'grid',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
        Subscribe to this feed from Apple Calendar, Google Calendar, Outlook, or any other
        calendar app.
      </div>

      {renderMobile ? (
        // Mobile: stacked buttons only. URL never displayed (Copy hands it off via clipboard).
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <a href={current.webcalUrl} style={buttonStackedMobile}>
            Add to Apple Calendar
          </a>
          <a
            href={current.googleAddUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={buttonStackedMobile}
          >
            Add to Google Calendar
          </a>
          <button type="button" onClick={handleCopy} style={buttonStackedMobile}>
            {copied ? 'URL copied' : 'Copy feed URL'}
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isPending}
            style={{
              ...buttonStackedMobile,
              color: 'var(--color-text-secondary)',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Regenerating…' : 'Regenerate URL'}
          </button>
        </div>
      ) : (
        // Desktop: URL inline + buttons row.
        <>
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
                flex: '1 1 200px',
                minWidth: 0,
                display: 'block',
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
              style={{
                ...buttonSecondary,
                opacity: isPending ? 0.6 : 1,
                marginLeft: 'auto',
              }}
            >
              {isPending ? 'Regenerating…' : 'Regenerate URL'}
            </button>
          </div>
        </>
      )}

      {error ? (
        <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
