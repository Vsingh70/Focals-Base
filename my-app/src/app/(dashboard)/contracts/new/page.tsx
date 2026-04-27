import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureDefaultTemplate } from '@/lib/actions/contract_templates';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { NewContractForm } from '@/components/contracts/NewContractForm';

export const metadata = {
  title: `New contract · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function NewContractPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await ensureDefaultTemplate();

  const [templatesRes, projectsRes, clientsRes] = await Promise.all([
    supabase
      .from('contract_templates')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('user_id', user.id)
      .order('full_name', { ascending: true }),
  ]);

  const templates = templatesRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const clients = clientsRes.data ?? [];

  return (
    <div className="app-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="New contract"
        subtitle="Choose a template and link it to a project + client. The body auto-fills from merge tags."
        actions={
          <LinkButton variant="secondary" size="sm" href="/contracts">
            ← Contracts
          </LinkButton>
        }
      />

      {projects.length === 0 || clients.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.75rem' }}>
            {projects.length === 0 && clients.length === 0
              ? 'You need at least one project and one client before creating a contract.'
              : projects.length === 0
                ? 'You need at least one project before creating a contract.'
                : 'You need at least one client before creating a contract.'}
          </p>
          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
            {clients.length === 0 ? (
              <LinkButton variant="secondary" size="sm" href="/">
                Add a client
              </LinkButton>
            ) : null}
            {projects.length === 0 ? (
              <LinkButton variant="secondary" size="sm" href="/">
                Add a project
              </LinkButton>
            ) : null}
          </div>
        </div>
      ) : (
        <NewContractForm templates={templates} projects={projects} clients={clients} />
      )}
    </div>
  );
}
