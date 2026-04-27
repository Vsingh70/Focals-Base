import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureDefaultTemplate } from '@/lib/actions/contract_templates';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { TourGate } from '@/components/tour/TourGate';
import { contractsTour } from '@/components/tour/tours';

export const metadata = {
  title: `Contracts · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

type ContractRow = {
  id: string;
  title: string;
  status: string | null;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  clients: { full_name: string | null } | { full_name: string | null }[] | null;
  projects: { title: string | null } | { title: string | null }[] | null;
};

function firstOrSelf<T>(v: T | T[] | null): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ContractsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Seed the starter template on first use. Safe to call every visit.
  await ensureDefaultTemplate();

  const { data: contracts } = await supabase
    .from('contracts')
    .select(
      'id, title, status, created_at, sent_at, signed_at, clients(full_name), projects(title)'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (contracts ?? []) as ContractRow[];

  return (
    <div className="app-page" style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Contracts"
        subtitle="Send, track, and export signed agreements."
        actions={
          <span data-tour="contracts-actions" style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <LinkButton variant="secondary" size="sm" href="/contracts/templates">
              Templates
            </LinkButton>
            <LinkButton size="sm" href="/contracts/new">
              + New contract
            </LinkButton>
          </span>
        }
      />

      {rows.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.9375rem',
              margin: '0 0 1rem',
            }}
          >
            No contracts yet. Your default template is ready to go.
          </p>
          <LinkButton href="/contracts/new">Create your first contract</LinkButton>
        </div>
      ) : (
        <>
        <div
          className="app-desktop-only"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <Th>Contract</Th>
                <Th>Client</Th>
                <Th>Project</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const client = firstOrSelf(c.clients);
                const project = firstOrSelf(c.projects);
                return (
                  <tr
                    key={c.id}
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <Td>
                      <Link
                        href={`/contracts/${c.id}`}
                        style={{
                          color: 'var(--color-text-primary)',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        {c.title}
                      </Link>
                    </Td>
                    <Td>{client?.full_name ?? '—'}</Td>
                    <Td>{project?.title ?? '—'}</Td>
                    <Td>
                      <ContractStatusBadge status={c.status} />
                    </Td>
                    <Td>{formatDate(c.created_at)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <ul
          className="app-mobile-only"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: '0.5rem',
          }}
        >
          {rows.map((c) => {
            const client = firstOrSelf(c.clients);
            const project = firstOrSelf(c.projects);
            return (
              <li key={c.id}>
                <Link
                  href={`/contracts/${c.id}`}
                  style={{
                    display: 'block',
                    padding: '0.875rem 1rem',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {c.title}
                    </span>
                    <ContractStatusBadge status={c.status} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {client?.full_name ?? '—'}
                    {project?.title ? ` · ${project.title}` : ''}
                    {' · '}
                    {formatDate(c.created_at)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        </>
      )}

      <TourGate tourId="contracts" steps={contractsTour.steps} helpHref="/help/contracts" />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '0.75rem 1rem',
        fontWeight: 500,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: '0.75rem 1rem',
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </td>
  );
}
