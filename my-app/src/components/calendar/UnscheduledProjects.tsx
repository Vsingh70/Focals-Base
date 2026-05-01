'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { suggestProjectSlots, type SlotSuggestion } from '@/lib/actions/scheduling';
import { updateProject } from '@/lib/actions/projects';

type UnscheduledProject = {
  id: string;
  title: string;
  category: string | null;
  client_name: string | null;
};

/**
 * Sidebar widget on /calendar that lists projects without a shoot_date and
 * offers AI-suggested slots inline. Clicking a suggestion saves it directly
 * — no SlideOver hop. Same suggestion engine + LLM as the ProjectForm
 * "Suggest a time" button, just with the project pre-selected.
 */
export function UnscheduledProjects({
  projects,
}: {
  projects: UnscheduledProject[];
}) {
  if (projects.length === 0) return null;
  return (
    <section
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.5rem',
          letterSpacing: '-0.01em',
        }}
      >
        Schedule unscheduled projects
      </h2>
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          margin: '0 0 1rem',
        }}
      >
        {projects.length} project{projects.length === 1 ? '' : 's'} without a
        date. Tap to get AI-suggested slots.
      </p>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: '0.625rem',
        }}
      >
        {projects.map((p) => (
          <UnscheduledRow key={p.id} project={p} />
        ))}
      </ul>
    </section>
  );
}

function UnscheduledRow({ project }: { project: UnscheduledProject }) {
  const router = useRouter();
  const { show: showToast } = useToast();
  const [suggestions, setSuggestions] = useState<SlotSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const fetchSuggestions = () => {
    setError(null);
    setSuggestions(null);
    startLoading(async () => {
      const res = await suggestProjectSlots({
        category: project.category,
        context: project.title,
      });
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      setSuggestions(res.data);
    });
  };

  const apply = (s: SlotSuggestion) => {
    startSaving(async () => {
      const res = await updateProject({
        id: project.id,
        shoot_date: s.start,
      });
      if (res.error !== null) {
        showToast(res.error, 'danger');
        return;
      }
      showToast(`${project.title} scheduled.`, 'success');
      setSuggestions(null);
      router.refresh();
    });
  };

  return (
    <li
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 0.875rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.title}
          </div>
          {project.client_name || project.category ? (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                marginTop: '0.125rem',
              }}
            >
              {[project.client_name, project.category].filter(Boolean).join(' · ')}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={isLoading || isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.375rem 0.625rem',
            background: 'transparent',
            color: 'var(--color-accent)',
            border: '1px solid rgba(232, 224, 208, 0.25)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: isLoading || isSaving ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: isLoading || isSaving ? 0.6 : 1,
          }}
        >
          <Sparkles size={12} strokeWidth={1.75} />
          {isLoading ? 'Finding…' : 'Suggest'}
        </button>
      </div>
      {error ? (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-danger)',
            margin: '0.5rem 0 0',
          }}
        >
          {error}
        </p>
      ) : null}
      {suggestions && suggestions.length > 0 ? (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0.625rem 0 0',
            display: 'grid',
            gap: '0.375rem',
          }}
        >
          {suggestions.map((s) => (
            <li key={s.start}>
              <button
                type="button"
                onClick={() => apply(s)}
                disabled={isSaving}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.625rem',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isSaving ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--color-text-primary)',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                  {formatSuggestion(s.start)}
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
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function formatSuggestion(iso: string): string {
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
