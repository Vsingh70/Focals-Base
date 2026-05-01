'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { LinkForm, type LinkFormMode } from './LinkForm';
import { LINK_CATEGORIES } from '@/lib/validations/links';
import type { Database } from '@/lib/supabase/types';

type LinkRow = Database['public']['Tables']['links']['Row'];
type ProjectLite = { id: string; title: string };

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

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.75rem',
    background: active ? 'var(--color-bg-tertiary)' : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    border: '1px solid',
    borderColor: active ? 'var(--color-border-secondary)' : 'transparent',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
}

function faviconUrl(rawUrl: string) {
  try {
    const u = new URL(rawUrl);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

function hostname(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

export function LinksGrid({
  links,
  projects = [],
}: {
  links: LinkRow[];
  projects?: ProjectLite[];
}) {
  const [filter, setFilter] = useState<string>('all');
  const [mode, setMode] = useState<LinkFormMode | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return links;
    return links.filter((l) => l.category === filter);
  }, [links, filter]);

  const projectTitleById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.title])),
    [projects]
  );

  return (
    <>
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
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setFilter('all')} style={chipStyle(filter === 'all')}>
            All
          </button>
          {LINK_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              style={chipStyle(filter === c)}
            >
              {c}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setMode({ kind: 'create' })} style={primaryButton}>
          + Add link
        </button>
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {links.length === 0
            ? 'No links yet. Click "Add link" to bookmark your first.'
            : `No links in ${filter}.`}
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {filtered.map((l) => {
            const fav = faviconUrl(l.url);
            return (
              <li
                key={l.id}
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {fav ? (
                    <img
                      src={fav}
                      alt=""
                      width={20}
                      height={20}
                      style={{
                        flex: '0 0 auto',
                        borderRadius: '4px',
                        marginTop: '2px',
                      }}
                    />
                  ) : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {l.title}
                    </a>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '0.125rem',
                      }}
                    >
                      {hostname(l.url)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode({ kind: 'edit', link: l })}
                    aria-label="Edit"
                    style={{
                      flex: '0 0 auto',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-tertiary)',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                  >
                    ⋯
                  </button>
                </div>

                {l.notes ? (
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                      margin: '0.625rem 0 0',
                      lineHeight: 1.45,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {l.notes}
                  </p>
                ) : null}

                {l.category || (l.project_id && projectTitleById.has(l.project_id)) ? (
                  <div
                    style={{
                      marginTop: '0.625rem',
                      display: 'flex',
                      gap: '0.375rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {l.category ? <Badge tone="neutral">{l.category}</Badge> : null}
                    {l.project_id && projectTitleById.has(l.project_id) ? (
                      <Badge tone="accent">
                        {projectTitleById.get(l.project_id)}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <LinkForm mode={mode} onClose={() => setMode(null)} projects={projects} />
    </>
  );
}
