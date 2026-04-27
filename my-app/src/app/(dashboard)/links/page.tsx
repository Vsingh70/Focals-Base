import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinksGrid } from '@/components/links/LinksGrid';
import { TourGate } from '@/components/tour/TourGate';
import { linksTour } from '@/components/tour/tours';

export const metadata = {
  title: `Links · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function LinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="app-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader title="Links" subtitle="Saved bookmarks for inspiration, references, tools." />
      <LinksGrid links={links ?? []} />
      <TourGate tourId="links" steps={linksTour.steps} helpHref="/help/links" />
    </div>
  );
}
