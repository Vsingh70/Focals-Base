import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { ClientDetailActions } from '@/components/clients/ClientDetailActions';

type Props = { params: Promise<{ id: string }> };

const fieldLabel: React.CSSProperties = {
  fontSize: '0.6875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-text-tertiary)',
  marginBottom: '0.125rem',
};

const fieldValue: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-primary)',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [clientRes, projectsRes, shootsRes, inquiriesRes, contractsRes] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('projects')
      .select('id, title, status, shoot_date, package_price, payment_status')
      .eq('client_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('shoots')
      .select('id, title, scheduled_at, location, status')
      .eq('client_id', id)
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('inquiries')
      .select('id, source, status, created_at, message')
      .eq('converted_client_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contracts')
      .select('id, title, status, created_at, sent_at, signed_at')
      .eq('client_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (!clientRes.data) notFound();
  const client = clientRes.data;
  const projects = projectsRes.data ?? [];
  const shoots = shootsRes.data ?? [];
  const inquiries = inquiriesRes.data ?? [];
  const contracts = contractsRes.data ?? [];

  return (
    <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title={client.full_name}
        subtitle={client.source ? `Source: ${client.source}` : undefined}
        actions={
          <>
            <LinkButton variant="secondary" size="sm" href="/clients">
              ← Clients
            </LinkButton>
            <ClientDetailActions client={client} />
          </>
        }
      />

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            {client.source ? <Badge tone="neutral">{client.source}</Badge> : null}
          </CardHeader>
          <dl
            className="app-stack-mobile"
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
            }}
          >
            <div>
              <div style={fieldLabel}>Email</div>
              <div style={fieldValue}>{client.email ?? '—'}</div>
            </div>
            <div>
              <div style={fieldLabel}>Phone</div>
              <div style={fieldValue}>{client.phone ?? '—'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabel}>Notes</div>
              <div style={{ ...fieldValue, whiteSpace: 'pre-wrap' }}>{client.notes ?? '—'}</div>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects ({projects.length})</CardTitle>
          </CardHeader>
          {projects.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
              No projects with this client.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects?focus=${p.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.title}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-tertiary)',
                          marginTop: '0.125rem',
                        }}
                      >
                        {formatDate(p.shoot_date)} · {formatCurrency(p.package_price)}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shoots ({shoots.length})</CardTitle>
          </CardHeader>
          {shoots.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
              No shoots with this client.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {shoots.map((s) => (
                <li
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{s.title}</div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                        marginTop: '0.125rem',
                      }}
                    >
                      {new Date(s.scheduled_at).toLocaleString()}
                      {s.location ? ` · ${s.location}` : ''}
                    </div>
                  </div>
                  {s.status ? <Badge tone="neutral">{s.status}</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {inquiries.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Inquiry history ({inquiries.length})</CardTitle>
            </CardHeader>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {inquiries.map((inq) => (
                <li
                  key={inq.id}
                  style={{
                    padding: '0.625rem 0.875rem',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <Badge tone="neutral">{inq.source}</Badge>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {formatDate(inq.created_at)}
                    </span>
                  </div>
                  {inq.message ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {inq.message}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Contracts ({contracts.length})</CardTitle>
          </CardHeader>
          {contracts.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
              No contracts with this client.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {contracts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contracts/${c.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.title}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-tertiary)',
                          marginTop: '0.125rem',
                        }}
                      >
                        Created {formatDate(c.created_at)}
                        {c.sent_at ? ` · Sent ${formatDate(c.sent_at)}` : ''}
                        {c.signed_at ? ` · Signed ${formatDate(c.signed_at)}` : ''}
                      </div>
                    </div>
                    <ContractStatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
