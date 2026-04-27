import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { GearGrid } from '@/components/gear/GearGrid';
import { TourGate } from '@/components/tour/TourGate';
import { gearTour } from '@/components/tour/tours';

export const metadata = {
  title: `Gear · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function GearPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: gear } = await supabase
    .from('gear')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="app-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader title="Gear" subtitle="Camera bodies, lenses, lighting, and everything in your kit." />
      <GearGrid gear={gear ?? []} />
      <TourGate tourId="gear" steps={gearTour.steps} helpHref="/help/gear" />
    </div>
  );
}
