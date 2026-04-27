import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClientsList } from '@/components/clients/ClientsList';
import { TourGate } from '@/components/tour/TourGate';
import { clientsTour } from '@/components/tour/tours';

export const metadata = {
  title: `Clients · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('full_name', { ascending: true });

  return (
    <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader title="Clients" subtitle="People you've worked with or are talking to." />
      <ClientsList clients={clients ?? []} />
      <TourGate tourId="clients" steps={clientsTour.steps} helpHref="/help/clients" />
    </div>
  );
}
