import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { HELP_ENTRIES } from '@/lib/help/content';

export const metadata = {
  title: `Help · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function HelpIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="app-page" style={{ maxWidth: 880, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Help"
        subtitle="Per-module guides covering features and best practices."
      />

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {HELP_ENTRIES.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/help/${entry.slug}`}
              style={{
                display: 'block',
                padding: '1rem 1.125rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                color: 'inherit',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.0625rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {entry.title}
              </div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {entry.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
