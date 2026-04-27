import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShootsList } from '@/components/shoots/ShootsList';
import { TourGate } from '@/components/tour/TourGate';
import { shootsTour } from '@/components/tour/tours';

export const metadata = {
  title: `Shoots · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function ShootsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [shootsRes, clientsRes, projectsRes] = await Promise.all([
    supabase
      .from('shoots')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('user_id', user.id)
      .order('full_name', { ascending: true }),
    supabase
      .from('projects')
      .select('id, title')
      .eq('user_id', user.id)
      .order('title', { ascending: true }),
  ]);

  return (
    <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader title="Shoots" subtitle="Scheduled sessions, ordered chronologically." />
      <ShootsList
        shoots={shootsRes.data ?? []}
        clients={clientsRes.data ?? []}
        projects={projectsRes.data ?? []}
      />
      <TourGate tourId="shoots" steps={shootsTour.steps} helpHref="/help/shoots" />
    </div>
  );
}
