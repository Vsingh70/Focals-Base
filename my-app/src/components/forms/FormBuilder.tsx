'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SlideOver } from '@/components/ui/SlideOver';
import { SortableField } from './SortableField';
import { createForm, updateForm, deleteForm } from '@/lib/actions/forms';
import {
  SYSTEM_FIELDS,
  MAX_HOVER_PREVIEWS,
  type CustomField,
} from '@/lib/validations/forms';
import type { Database } from '@/lib/supabase/types';

type FormRow = Database['public']['Tables']['forms']['Row'];

export type FormBuilderMode = { kind: 'create' } | { kind: 'edit'; form: FormRow };

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem',
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

function parseFields(raw: unknown): CustomField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (f): f is CustomField =>
        typeof f === 'object' && f !== null && 'id' in f && 'label' in f && 'type' in f
    )
    .map((f) => ({
      id: String(f.id),
      label: String(f.label),
      type: f.type,
      required: Boolean(f.required),
      hover_preview: Boolean(f.hover_preview),
    }));
}

function newFieldId() {
  return `f_${Math.random().toString(36).slice(2, 10)}`;
}

export function FormBuilder({
  mode,
  onClose,
}: {
  mode: FormBuilderMode | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [fields, setFields] = useState<CustomField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset state when mode changes
  useEffect(() => {
    setError(null);
    if (mode?.kind === 'edit') {
      setName(mode.form.name);
      setFields(parseFields(mode.form.fields));
    } else {
      setName('');
      setFields([]);
    }
  }, [mode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!mode) return null;
  const isEdit = mode.kind === 'edit';

  const hoverPreviewCount = fields.filter((f) => f.hover_preview).length;
  const previewLimitReached = hoverPreviewCount >= MAX_HOVER_PREVIEWS;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((items) => {
      const oldIndex = items.findIndex((f) => f.id === active.id);
      const newIndex = items.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const addField = () => {
    if (fields.length >= 10) {
      setError('Maximum 10 custom fields.');
      return;
    }
    setError(null);
    setFields((f) => [
      ...f,
      {
        id: newFieldId(),
        label: '',
        type: 'text',
        required: false,
        hover_preview: false,
      },
    ]);
  };

  const updateField = (id: string, patch: Partial<CustomField>) => {
    setFields((f) => f.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const removeField = (id: string) => {
    setFields((f) => f.filter((field) => field.id !== id));
  };

  const handleSave = () => {
    setError(null);
    if (!name.trim()) {
      setError('Form name is required.');
      return;
    }
    if (fields.some((f) => !f.label.trim())) {
      setError('All custom fields need a label.');
      return;
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateForm({ id: mode.form.id, name: name.trim(), fields })
        : await createForm({ name: name.trim(), fields });
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
    if (!confirm('Delete this form? Submissions linked to it are kept.')) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteForm(mode.form.id);
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <SlideOver open={mode !== null} onClose={onClose} title={isEdit ? 'Edit form' : 'New form'}>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <label style={labelStyle} htmlFor="form-name">
            Form name
          </label>
          <input
            id="form-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            placeholder="e.g. Wedding intake"
            style={inputStyle}
          />
        </div>

        {/* System fields */}
        <div>
          <p style={labelStyle}>System fields (always present)</p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: '0.375rem',
            }}
          >
            {SYSTEM_FIELDS.map((sf) => (
              <li
                key={sf.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--color-bg)',
                  border: '1px dashed var(--color-border-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {sf.label}{' '}
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                    · {sf.type}
                    {sf.required ? ' · required' : ''}
                  </span>
                </span>
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                  Locked
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Custom fields */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <p style={{ ...labelStyle, marginBottom: 0 }}>
              Custom fields ({fields.length}/10)
            </p>
            <span
              style={{
                fontSize: '0.6875rem',
                color: previewLimitReached
                  ? 'var(--color-warning)'
                  : 'var(--color-text-tertiary)',
              }}
            >
              {hoverPreviewCount}/{MAX_HOVER_PREVIEWS} hover previews
            </span>
          </div>
          {fields.length === 0 ? (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-tertiary)',
                margin: '0 0 0.5rem',
              }}
            >
              No custom fields yet. Add up to 10. Drag the handle to reorder.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: 'grid', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  {fields.map((f) => (
                    <SortableField
                      key={f.id}
                      field={f}
                      onChange={(patch) => updateField(f.id, patch)}
                      onRemove={() => removeField(f.id)}
                      hoverPreviewDisabled={previewLimitReached}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <button
            type="button"
            onClick={addField}
            disabled={fields.length >= 10}
            style={{
              ...secondaryButton,
              opacity: fields.length >= 10 ? 0.5 : 1,
              cursor: fields.length >= 10 ? 'not-allowed' : 'pointer',
            }}
          >
            + Add custom field
          </button>
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
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {isEdit ? (
            <button type="button" onClick={handleDelete} disabled={isPending} style={dangerButton}>
              Delete
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} disabled={isPending} style={secondaryButton}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create form'}
            </button>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
