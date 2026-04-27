import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureDefaultTemplate } from '@/lib/actions/contract_templates';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { TemplatesList } from '@/components/contracts/TemplatesList';

export const metadata = {
  title: `Contract templates · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function ContractTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await ensureDefaultTemplate();

  const { data: templates } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Contract templates"
        subtitle="Reusable base text with merge tags that auto-fill from project and client data."
        actions={
          <LinkButton variant="secondary" size="sm" href="/contracts">
            ← Contracts
          </LinkButton>
        }
      />
      <TemplatesList templates={templates ?? []} />
    </div>
  );
}
