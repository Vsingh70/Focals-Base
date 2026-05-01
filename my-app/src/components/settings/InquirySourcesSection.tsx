'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import {
  createInquirySource,
  setInquirySourceActive,
  deleteInquirySource,
} from '@/lib/actions/inquiry_sources';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import type { Database } from '@/lib/supabase/types';

type InquirySource = Database['public']['Tables']['inquiry_sources']['Row'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

const primaryButton: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const secondaryButton: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

function getToken(source: InquirySource): string | null {
  const cfg = source.config as Record<string, unknown> | null;
  if (cfg && typeof cfg === 'object' && typeof cfg.token === 'string') {
    return cfg.token;
  }
  return null;
}

function buildSnippet(source: InquirySource, token: string, siteUrl: string): string {
  const labelLine = source.label
    ? `\n    sourceLabel: ${JSON.stringify(source.label)},`
    : '';
  return `<!-- Drop in where you want the contact form to appear -->
<div id="app-name-inquiry"></div>
<script>
  window.APP_NAME_CONFIG = {
    token: ${JSON.stringify(token)},
    apiBase: ${JSON.stringify(siteUrl)},${labelLine}
  };
</script>
<script src="${siteUrl}/widget/inquiry.js" async></script>`;
}

function buildCurlSnippet(token: string, siteUrl: string): string {
  return `curl -X POST ${siteUrl}/api/inquiry \\
  -H "Content-Type: application/json" \\
  -H "X-Inquiry-Token: ${token}" \\
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'`;
}

// Webhook URL with token in query param. Used for integrations whose UI
// only lets you paste a URL (Resend inbound-parse, Typeform, Tally,
// most low-code form builders). The endpoint accepts the token in either
// the X-Inquiry-Token header OR ?token= query.
function buildWebhookUrl(token: string, siteUrl: string): string {
  return `${siteUrl}/api/inquiry?token=${encodeURIComponent(token)}`;
}

export function InquirySourcesSection({
  sources,
  siteUrl,
}: {
  sources: InquirySource[];
  siteUrl: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<'website' | 'email' | 'instagram' | 'custom'>('website');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: string, label: string) => {
    const confirmed = await confirm({
      title: 'Delete this inquiry source?',
      message: `"${label}" will stop accepting submissions. Anything already in your inbox stays.`,
      confirmLabel: 'Delete source',
      destructive: true,
    });
    if (!confirmed) return;
    startTransition(async () => {
      await deleteInquirySource(id);
      router.refresh();
    });
  };

  const handleCreate = () => {
    setError(null);
    if (!label.trim()) {
      setError('Label is required.');
      return;
    }
    startTransition(async () => {
      const res = await createInquirySource({ type, label: label.trim() });
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      setLabel('');
      setShowCreate(false);
      // Auto-reveal the new source's token
      setRevealed((r) => ({ ...r, [res.data.id]: true }));
      router.refresh();
    });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    startTransition(async () => {
      await setInquirySourceActive(id, isActive);
      router.refresh();
    });
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard denied */
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {sources.length === 0 ? (
        <p
          style={{
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          No inquiry sources yet. Add one to start receiving inquiries from your website.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
          {sources.map((s) => {
            const token = getToken(s);
            const isRevealed = revealed[s.id] ?? false;
            const tokenDisplay = token
              ? isRevealed
                ? token
                : '•'.repeat(Math.min(token.length, 32))
              : '—';
            const endpointUrl = `${siteUrl}/api/inquiry`;
            const snippet = token ? buildSnippet(s, token, siteUrl) : null;
            const curlSnippet = token ? buildCurlSnippet(token, siteUrl) : null;
            const webhookUrl = token ? buildWebhookUrl(token, siteUrl) : null;

            return (
              <li
                key={s.id}
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem 1rem',
                  display: 'grid',
                  gap: '0.625rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span
                      style={{
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {s.label}
                    </span>
                    <Badge tone="neutral">{s.type}</Badge>
                    {!s.is_active ? <Badge tone="danger">inactive</Badge> : null}
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(s.id, !s.is_active)}
                      disabled={isPending}
                      style={secondaryButton}
                    >
                      {s.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id, s.label)}
                      disabled={isPending}
                      style={{
                        ...secondaryButton,
                        color: 'var(--color-danger)',
                        borderColor: 'rgba(232, 80, 64, 0.3)',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div
                  className="app-stack-mobile"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-tertiary)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Endpoint
                  </span>
                  <code
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      display: 'block',
                    }}
                  >
                    {endpointUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(endpointUrl, `${s.id}-url`)}
                    style={secondaryButton}
                  >
                    {copiedId === `${s.id}-url` ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {token ? (
                  <div
                    className="app-stack-mobile"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr auto auto',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-tertiary)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Token
                    </span>
                    <code
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        display: 'block',
                      }}
                    >
                      {tokenDisplay}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed((r) => ({ ...r, [s.id]: !r[s.id] }))
                      }
                      style={secondaryButton}
                    >
                      {isRevealed ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(token, `${s.id}-token`)}
                      style={secondaryButton}
                    >
                      {copiedId === `${s.id}-token` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ) : null}

                {snippet ? (
                  <details>
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Embed widget snippet
                    </summary>
                    <p
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-tertiary)',
                        margin: '0.375rem 0 0.5rem',
                      }}
                    >
                      Paste into any HTML page where you want a contact form to render.
                    </p>
                    <div style={{ position: 'relative' }}>
                      <pre
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border-secondary)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                          paddingRight: '4rem',
                          overflow: 'auto',
                          margin: 0,
                          fontSize: '0.75rem',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: 'var(--color-text-secondary)',
                          maxHeight: '12rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                        }}
                      >
                        {snippet}
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy(snippet, `${s.id}-snippet`)}
                        style={{
                          ...secondaryButton,
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                        }}
                      >
                        {copiedId === `${s.id}-snippet` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </details>
                ) : null}

                {curlSnippet ? (
                  <details>
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Test with curl
                    </summary>
                    <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                      <pre
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border-secondary)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                          paddingRight: '4rem',
                          overflow: 'auto',
                          margin: 0,
                          fontSize: '0.75rem',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: 'var(--color-text-secondary)',
                          maxHeight: '8rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                        }}
                      >
                        {curlSnippet}
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy(curlSnippet, `${s.id}-curl`)}
                        style={{
                          ...secondaryButton,
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                        }}
                      >
                        {copiedId === `${s.id}-curl` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </details>
                ) : null}

                {webhookUrl ? (
                  <details>
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Webhook URL (Resend, Zapier, Typeform, Tally…)
                    </summary>
                    <p
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-tertiary)',
                        margin: '0.375rem 0 0.5rem',
                        lineHeight: 1.5,
                      }}
                    >
                      Paste this URL into any integration that POSTs JSON. The endpoint
                      accepts the embeddable widget shape, Resend inbound-parse payloads
                      (<code>from</code>/<code>subject</code>/<code>text</code>), or
                      generic JSON with <code>name</code>/<code>email</code>/<code>message</code>{' '}
                      fields. The token is in the URL since most webhook UIs only
                      let you paste a URL, not custom headers.
                    </p>
                    <div style={{ position: 'relative' }}>
                      <pre
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border-secondary)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                          overflow: 'auto',
                          margin: 0,
                          fontSize: '0.75rem',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: 'var(--color-text-secondary)',
                          maxHeight: '6rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {webhookUrl}
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy(webhookUrl, `${s.id}-webhook`)}
                        style={{
                          ...secondaryButton,
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                        }}
                      >
                        {copiedId === `${s.id}-webhook` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {showCreate ? (
        <div
          style={{
            display: 'grid',
            gap: '0.5rem',
            padding: '1rem',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem' }}>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as 'website' | 'email' | 'instagram' | 'custom')
              }
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="website">Website</option>
              <option value="email">Email</option>
              <option value="instagram">Instagram</option>
              <option value="custom">Custom</option>
            </select>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. vflics.com Contact Form)"
              maxLength={200}
              style={inputStyle}
            />
          </div>
          {error ? (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
              {error}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setLabel('');
                setError(null);
              }}
              disabled={isPending}
              style={secondaryButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Creating…' : 'Create source'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.375rem' }}>
          <button type="button" onClick={() => setShowCreate(true)} style={primaryButton}>
            + New inquiry source
          </button>
          {sources.length > 0 ? (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-tertiary)',
                margin: 0,
              }}
            >
              You can add more than one source of the same type — e.g. one website form
              for your portfolio and another for a partner site.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
