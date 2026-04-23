'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/SlideOver';
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/lib/actions/contract_templates';
import {
  MERGE_TAG_KEYS,
  MERGE_TAG_DESCRIPTIONS,
  extractTags,
} from '@/lib/contracts/mergeTags';
import type { Database } from '@/lib/supabase/types';

type Template = Database['public']['Tables']['contract_templates']['Row'];

type Mode = { kind: 'create' } | { kind: 'edit'; template: Template };

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
  minHeight: '22rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.8125rem',
  lineHeight: 1.55,
  resize: 'vertical',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem',
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.25rem 0.5rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.6875rem',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
};

const primaryButton: React.CSSProperties = {
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

const secondaryButton: React.CSSProperties = {
  padding: '0.625rem 1rem',
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const dangerButton: React.CSSProperties = {
  padding: '0.625rem 1rem',
  background: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid rgba(232, 80, 64, 0.3)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

export function TemplateEditor({
  mode,
  onClose,
}: {
  mode: Mode | null;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState(
    mode?.kind === 'edit' ? mode.template.body : ''
  );
  const [name, setName] = useState(
    mode?.kind === 'edit' ? mode.template.name : ''
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!mode) return null;

  const isEdit = mode.kind === 'edit';

  const insertTag = (tag: string) => {
    const el = textareaRef.current;
    const token = `{{${tag}}}`;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    // Restore cursor to after inserted token
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updateTemplate({ id: mode.template.id, name, body })
        : await createTemplate({ name, body });
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!isEdit) return;
    if (!confirm('Delete this template? Existing contracts created from it are unaffected.')) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteTemplate(mode.template.id);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  const tagsInBody = extractTags(body);

  return (
    <SlideOver
      open={mode !== null}
      onClose={onClose}
      title={isEdit ? 'Edit template' : 'New template'}
    >
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <label style={labelStyle} htmlFor="template-name">
            Name
          </label>
          <input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Portrait session agreement"
            maxLength={200}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Insert merge tag</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {MERGE_TAG_KEYS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertTag(tag)}
                title={MERGE_TAG_DESCRIPTIONS[tag]}
                style={chipStyle}
              >
                {`{{${tag}}}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="template-body">
            Body
          </label>
          <textarea
            id="template-body"
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your contract template here. Use {{merge_tags}} for dynamic values."
            style={textareaStyle}
          />
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-tertiary)',
              margin: '0.375rem 0 0',
            }}
          >
            {tagsInBody.length === 0
              ? 'No merge tags in this template.'
              : `Uses ${tagsInBody.length} tag${tagsInBody.length === 1 ? '' : 's'}: ${tagsInBody.join(', ')}`}
          </p>
        </div>

        {error ? (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>
            {error}
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              style={dangerButton}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={secondaryButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !name.trim() || !body.trim()}
              style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create template'}
            </button>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
