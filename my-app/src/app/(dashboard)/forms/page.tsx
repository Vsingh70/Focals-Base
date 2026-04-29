import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { FormsList } from '@/components/forms/FormsList';
import { TourGate } from '@/components/tour/TourGate';
import { formsTour } from '@/components/tour/tours';

export const metadata = {
  title: `Forms · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function FormsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: forms } = await supabase
    .from('forms')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Forms"
        subtitle="Define custom fields for projects, clients, and finances. System fields are always present."
      />
      <FormsList forms={forms ?? []} />
      <TourGate tourId="forms" steps={formsTour.steps} helpHref="/help/forms" />
    </div>
  );
}
