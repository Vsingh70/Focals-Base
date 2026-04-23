import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { ContractStatusActions } from '@/components/contracts/ContractStatusActions';

type Props = {
  params: Promise<{ id: string }>;
};

type ContractDetail = {
  id: string;
  title: string;
  body: string;
  status: string | null;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  custom_fields: Record<string, string> | null;
  clients: { full_name: string | null } | { full_name: string | null }[] | null;
  projects: { title: string | null } | { title: string | null }[] | null;
  contract_templates: { name: string | null } | { name: string | null }[] | null;
};

function firstOrSelf<T>(v: T | T[] | null): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function parseCustomFields(
  raw: unknown
): Array<{ key: string; value: string }> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string' && v.length > 0)
    .map(([key, value]) => ({ key, value: String(value) }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Contract · ${id.slice(0, 8)}` };
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(
      'id, title, body, status, created_at, sent_at, signed_at, custom_fields, clients(full_name), projects(title), contract_templates(name)'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <PageHeader title="Contract" />
        <p style={{ color: 'var(--color-danger)' }}>Error: {error.message}</p>
      </div>
    );
  }
  if (!contract) notFound();

  const row = contract as ContractDetail;
  const client = firstOrSelf(row.clients);
  const project = firstOrSelf(row.projects);
  const template = firstOrSelf(row.contract_templates);
  const customFields = parseCustomFields(row.custom_fields);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title={row.title}
        subtitle="Read-only rendered contract. Merge tags were resolved at creation time."
        actions={
          <>
            <LinkButton variant="secondary" size="sm" href="/contracts">
              ← Contracts
            </LinkButton>
            <LinkButton size="sm" href={`/api/contracts/${row.id}/pdf`}>
              Export PDF
            </LinkButton>
          </>
        }
      />

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <ContractStatusBadge status={row.status} />
          </CardHeader>
          <ContractStatusActions id={row.id} currentStatus={row.status} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <dl style={{ margin: 0, display: 'grid', gap: '0.75rem' }}>
            <DtDd label="Client" value={client?.full_name ?? '—'} />
            <DtDd label="Project" value={project?.title ?? '—'} />
            <DtDd label="Template" value={template?.name ?? '—'} />
            <DtDd label="Created" value={formatDateTime(row.created_at)} />
            <DtDd label="Sent" value={formatDateTime(row.sent_at)} />
            <DtDd label="Signed" value={formatDateTime(row.signed_at)} />
          </dl>
        </Card>

        {customFields.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Custom fields</CardTitle>
            </CardHeader>
            <dl style={{ margin: 0, display: 'grid', gap: '0.75rem' }}>
              {customFields.map((f) => (
                <DtDd key={f.key} label={f.key} value={f.value} />
              ))}
            </dl>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Body</CardTitle>
          </CardHeader>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
          >
            {row.body}
          </pre>
        </Card>
      </div>
    </div>
  );
}

function DtDd({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: '1rem',
        alignItems: 'baseline',
      }}
    >
      <dt
        style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-tertiary)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
        {value}
      </dd>
    </div>
  );
}
