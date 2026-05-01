'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { SlideOver } from '@/components/ui/SlideOver';
import { SourceBadge, InquiryStatusBadge } from './SourceBadge';
import {
  createManualInquiry,
  updateInquiryStatus,
  convertInquiry,
} from '@/lib/actions/inquiries';
import { suggestProjectSlots, type SlotSuggestion } from '@/lib/actions/scheduling';
import type { Database } from '@/lib/supabase/types';

type Inquiry = Database['public']['Tables']['inquiries']['Row'];

type FilterStatus = 'all' | 'new' | 'read' | 'replied' | 'converted' | 'archived';

const filters: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'read', label: 'Read' },
  { key: 'replied', label: 'Replied' },
  { key: 'converted', label: 'Converted' },
  { key: 'archived', label: 'Archived' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9375rem',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '5rem',
  fontFamily: 'var(--font-sans)',
  resize: 'vertical',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.625rem 1rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Wall-clock-aware slot label, e.g. "Sat, May 10 · 3:00 PM". */
function formatSlot(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${day} · ${time}`;
}

export function InboxClient({ inquiries }: { inquiries: Inquiry[] }) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // AI slot suggestions for the current inquiry. `chosenSlot` is the slot
  // the user picked — if set, it's passed as shootDateOverride into
  // convertInquiry. Reset whenever the panel closes or another inquiry is
  // opened.
  const [suggestions, setSuggestions] = useState<SlotSuggestion[] | null>(null);
  const [chosenSlot, setChosenSlot] = useState<SlotSuggestion | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [isSuggesting, startSuggesting] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setSuggestions(null);
    setChosenSlot(null);
    setSuggestError(null);
  }, [selected?.id]);

  const newCount = useMemo(
    () => inquiries.filter((i) => i.status === 'new').length,
    [inquiries]
  );

  const visible = useMemo(
    () => (filter === 'all' ? inquiries : inquiries.filter((i) => i.status === filter)),
    [inquiries, filter]
  );

  const handleSelect = (inquiry: Inquiry) => {
    setSelected(inquiry);
    setError(null);
    // Mark as read if currently new
    if (inquiry.status === 'new') {
      startTransition(async () => {
        await updateInquiryStatus({ id: inquiry.id, status: 'read' });
        router.refresh();
      });
    }
  };

  const handleStatusChange = (status: 'replied' | 'archived' | 'read') => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await updateInquiryStatus({ id: selected.id, status });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSelected(null);
      router.refresh();
    });
  };

  const handleConvert = (withProject: boolean, projectTitle?: string) => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await convertInquiry({
        id: selected.id,
        createProject: withProject,
        projectTitle,
        shootDateOverride: withProject ? chosenSlot?.start ?? null : null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSelected(null);
      router.refresh();
    });
  };

  const handleSuggestForInquiry = () => {
    if (!selected) return;
    setSuggestError(null);
    setSuggestions(null);
    startSuggesting(async () => {
      const res = await suggestProjectSlots({
        category: selected.shoot_type,
        anchor: selected.preferred_date,
        context: selected.message,
      });
      if (res.error !== null) {
        setSuggestError(res.error);
        return;
      }
      setSuggestions(res.data);
    });
  };

  const handleManualSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createManualInquiry({
        name: String(formData.get('name') ?? ''),
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        shoot_type: (formData.get('shoot_type') as string) || null,
        preferred_date: (formData.get('preferred_date') as string) || null,
        message: (formData.get('message') as string) || null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setManualOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      {/* Filter tabs + new-count pill + manual entry */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div data-tour="inbox-filters" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '0.5rem 0.875rem',
                  background: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  border: '1px solid',
                  borderColor: active ? 'var(--color-border-secondary)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                {f.label}
                {f.key === 'new' && newCount > 0 ? (
                  <span
                    style={{
                      background: 'var(--color-accent)',
                      color: 'var(--color-bg)',
                      fontSize: '0.6875rem',
                      padding: '0.0625rem 0.375rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 500,
                    }}
                  >
                    {newCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          data-tour="inbox-manual"
          style={primaryButtonStyle}
        >
          + Manual Entry
        </button>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {inquiries.length === 0
            ? 'No inquiries yet. Create one manually or configure an inquiry source in settings.'
            : `No ${filter} inquiries.`}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
          {visible.map((inq) => (
            <li key={inq.id}>
              <button
                type="button"
                onClick={() => handleSelect(inq)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background:
                    inq.status === 'new'
                      ? 'var(--color-bg-tertiary)'
                      : 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  color: 'inherit',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      inq.status === 'new' ? 'var(--color-accent)' : 'transparent',
                    marginTop: '0.375rem',
                    flex: '0 0 auto',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: inq.status === 'new' ? 600 : 500,
                        color: 'var(--color-text-primary)',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {inq.name}
                    </span>
                    <SourceBadge source={inq.source} />
                    <InquiryStatusBadge status={inq.status ?? 'new'} />
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {timeAgo(inq.created_at)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                      marginTop: '0.375rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {[inq.shoot_type, inq.preferred_date, inq.message]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Detail panel */}
      <SlideOver
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Inquiry'}
      >
        {selected ? (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              <SourceBadge source={selected.source} />
              <InquiryStatusBadge status={selected.status ?? 'new'} />
            </div>

            <dl style={{ margin: 0, display: 'grid', gap: '0.75rem' }}>
              {selected.email ? (
                <Field label="Email" value={selected.email} />
              ) : null}
              {selected.phone ? <Field label="Phone" value={selected.phone} /> : null}
              {selected.shoot_type ? (
                <Field label="Shoot type" value={selected.shoot_type} />
              ) : null}
              {selected.preferred_date ? (
                <Field
                  label="Preferred date"
                  value={new Date(selected.preferred_date).toLocaleDateString()}
                />
              ) : null}
              {selected.source_handle ? (
                <Field label="Source" value={selected.source_handle} />
              ) : null}
              <Field label="Received" value={new Date(selected.created_at).toLocaleString()} />
            </dl>

            {selected.message ? (
              <div>
                <div style={labelStyle}>Message</div>
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border-secondary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selected.message}
                </div>
              </div>
            ) : null}

            {error ? (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
                {error}
              </p>
            ) : null}

            {/* Status actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleStatusChange('replied')}
                disabled={isPending || selected.status === 'replied'}
                style={secondaryButtonStyle}
              >
                Mark replied
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('archived')}
                disabled={isPending}
                style={secondaryButtonStyle}
              >
                Archive
              </button>
            </div>

            {/* Convert actions — only if not already converted */}
            {selected.status !== 'converted' ? (
              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '1rem',
                  display: 'grid',
                  gap: '0.5rem',
                }}
              >
                <div style={labelStyle}>Convert inquiry</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    {chosenSlot
                      ? `Project will be scheduled for ${formatSlot(chosenSlot.start)}.`
                      : selected.preferred_date
                        ? `Project will use the inquiry's preferred date.`
                        : `Project will be created without a date.`}
                  </span>
                  <button
                    type="button"
                    onClick={handleSuggestForInquiry}
                    disabled={isSuggesting || isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: 0,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-accent)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: isSuggesting ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                      opacity: isSuggesting ? 0.6 : 1,
                    }}
                  >
                    <Sparkles size={12} strokeWidth={1.75} />
                    {isSuggesting ? 'Finding…' : 'Suggest a time'}
                  </button>
                </div>
                {suggestError ? (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-danger)',
                      margin: 0,
                    }}
                  >
                    {suggestError}
                  </p>
                ) : null}
                {suggestions && suggestions.length > 0 ? (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'grid',
                      gap: '0.375rem',
                    }}
                  >
                    {suggestions.map((s) => {
                      const isChosen = chosenSlot?.start === s.start;
                      return (
                        <li key={s.start}>
                          <button
                            type="button"
                            onClick={() => setChosenSlot(isChosen ? null : s)}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.5rem 0.625rem',
                              background: isChosen
                                ? 'var(--color-accent-muted)'
                                : 'var(--color-bg-tertiary)',
                              border: `1px solid ${
                                isChosen
                                  ? 'var(--color-accent)'
                                  : 'var(--color-border-secondary)'
                              }`,
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                              {formatSlot(s.start)}
                            </div>
                            <div
                              style={{
                                fontSize: '0.6875rem',
                                color: 'var(--color-text-tertiary)',
                                marginTop: '0.125rem',
                              }}
                            >
                              {s.reason}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleConvert(false)}
                  disabled={isPending}
                  style={{ ...primaryButtonStyle, opacity: isPending ? 0.6 : 1 }}
                >
                  Convert to Client
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleConvert(
                      true,
                      selected.shoot_type ?? `Project for ${selected.name}`
                    )
                  }
                  disabled={isPending}
                  style={{ ...secondaryButtonStyle, opacity: isPending ? 0.6 : 1 }}
                >
                  Convert to Client + Project
                </button>
              </div>
            ) : (
              <p
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontSize: '0.8125rem',
                  margin: 0,
                }}
              >
                Already converted.
              </p>
            )}
          </div>
        ) : null}
      </SlideOver>

      {/* Manual entry */}
      <SlideOver
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="New inquiry"
      >
        <form action={handleManualSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={labelStyle} htmlFor="inq-name">
              Name
            </label>
            <input
              id="inq-name"
              name="name"
              required
              maxLength={200}
              placeholder="Client name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="inq-email">
              Email
            </label>
            <input
              id="inq-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="inq-phone">
              Phone
            </label>
            <input id="inq-phone" name="phone" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="inq-shoot-type">
              Shoot type
            </label>
            <input
              id="inq-shoot-type"
              name="shoot_type"
              placeholder="Portrait, wedding, editorial…"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="inq-date">
              Preferred date
            </label>
            <input id="inq-date" name="preferred_date" type="date" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="inq-message">
              Message
            </label>
            <textarea
              id="inq-message"
              name="message"
              style={textareaStyle}
              placeholder="Anything the client said…"
            />
          </div>
          {error ? (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            style={{ ...primaryButtonStyle, opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Saving…' : 'Save inquiry'}
          </button>
        </form>
      </SlideOver>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-tertiary)',
          marginBottom: '0.125rem',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}
