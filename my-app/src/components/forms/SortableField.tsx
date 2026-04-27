'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FIELD_TYPES, type CustomField } from '@/lib/validations/forms';

const inputStyle: React.CSSProperties = {
  padding: '0.375rem 0.5rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

export function SortableField({
  field,
  onChange,
  onRemove,
  hoverPreviewDisabled,
}: {
  field: CustomField;
  onChange: (patch: Partial<CustomField>) => void;
  onRemove: () => void;
  hoverPreviewDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr 130px auto auto auto',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.625rem 0.75rem',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border-secondary)',
        borderRadius: 'var(--radius-md)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <button
        type="button"
        className="app-tap-skip"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-tertiary)',
          cursor: 'grab',
          fontSize: '1rem',
          padding: '0.25rem 0.375rem',
          lineHeight: 1,
        }}
      >
        ⋮⋮
      </button>
      <input
        value={field.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Field label"
        maxLength={100}
        style={inputStyle}
      />
      <select
        value={field.type}
        onChange={(e) => onChange({ type: e.target.value as CustomField['type'] })}
        style={{ ...inputStyle, appearance: 'auto' }}
      >
        {FIELD_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
        }}
        title="Field is required"
      >
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
        Required
      </label>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.75rem',
          color: hoverPreviewDisabled
            ? 'var(--color-text-tertiary)'
            : 'var(--color-text-secondary)',
          cursor: hoverPreviewDisabled && !field.hover_preview ? 'not-allowed' : 'pointer',
        }}
        title="Show in row hover preview (max 3)"
      >
        <input
          type="checkbox"
          checked={field.hover_preview}
          onChange={(e) => onChange({ hover_preview: e.target.checked })}
          disabled={hoverPreviewDisabled && !field.hover_preview}
        />
        Preview
      </label>
      <button
        type="button"
        className="app-tap-skip"
        onClick={onRemove}
        aria-label="Remove field"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-danger)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          padding: '0.25rem 0.5rem',
        }}
      >
        ×
      </button>
    </div>
  );
}
