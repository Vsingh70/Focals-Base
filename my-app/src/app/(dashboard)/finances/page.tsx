import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { FinancesView } from '@/components/finances/FinancesView';
import { TourGate } from '@/components/tour/TourGate';
import { financesTour } from '@/components/tour/tours';

export const metadata = {
  title: `Finances · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function FinancesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [transactionsRes, projectsRes] = await Promise.all([
    supabase
      .from('finances')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('projects')
      .select('id, title')
      .eq('user_id', user.id)
      .order('title', { ascending: true }),
  ]);

  return (
    <div className="app-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader title="Finances" subtitle="Income, expenses, and net profit by period." />
      <FinancesView
        transactions={transactionsRes.data ?? []}
        projects={projectsRes.data ?? []}
      />
      <TourGate tourId="finances" steps={financesTour.steps} helpHref="/help/finances" />
    </div>
  );
}
