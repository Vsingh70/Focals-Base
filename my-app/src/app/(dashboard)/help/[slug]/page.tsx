import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { getHelpEntry, HELP_ENTRIES } from '@/lib/help/content';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return HELP_ENTRIES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const entry = getHelpEntry(slug);
  if (!entry) return { title: `Help · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}` };
  return { title: `${entry.title} · Help · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}` };
}

const moduleHref: Record<string, string> = {
  dashboard: '/',
  inbox: '/inbox',
  calendar: '/calendar',
  projects: '/projects',
  clients: '/clients',
  shoots: '/shoots',
  finances: '/finances',
  contracts: '/contracts',
  gear: '/gear',
  links: '/links',
  forms: '/forms',
  settings: '/settings',
};

export default async function HelpEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = getHelpEntry(slug);
  if (!entry) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const moduleUrl = moduleHref[entry.slug] ?? '/';

  return (
    <div className="app-page" style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title={entry.title}
        subtitle={entry.summary}
        actions={
          <span style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <LinkButton variant="secondary" size="sm" href="/help">
              ← All guides
            </LinkButton>
            <LinkButton size="sm" href={moduleUrl}>
              Open {entry.title}
            </LinkButton>
          </span>
        }
      />

      <article style={{ display: 'grid', gap: '2rem' }}>
        {entry.sections.map((section) => (
          <section key={section.heading}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.0625rem',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                margin: '0 0 0.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              {section.heading}
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.65,
                color: 'var(--color-text-secondary)',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {section.body}
            </p>
          </section>
        ))}
      </article>

      <nav
        style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          href="/help"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
          }}
        >
          ← All guides
        </Link>
        <Link
          href={moduleUrl}
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-accent)',
            textDecoration: 'none',
          }}
        >
          Try it in {entry.title.toLowerCase()} →
        </Link>
      </nav>
    </div>
  );
}
