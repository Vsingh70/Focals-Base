import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { TourGate } from '@/components/tour/TourGate';
import { projectsTour } from '@/components/tour/tours';
import { getIntegrationStatus } from '@/lib/actions/integrations';

export const metadata = {
  title: `Projects · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [projectsRes, clientsRes, integrationRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('user_id', user.id)
      .order('full_name', { ascending: true }),
    getIntegrationStatus(),
  ]);

  return (
    <div className="app-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Projects"
        subtitle="Pipeline view of all bookings, in-progress work, and deliveries."
      />
      <ProjectsTable
        projects={projectsRes.data ?? []}
        clients={clientsRes.data ?? []}
        hasAiKey={integrationRes.data?.connected ?? false}
      />
      <TourGate tourId="projects" steps={projectsTour.steps} helpHref="/help/projects" />
    </div>
  );
}
