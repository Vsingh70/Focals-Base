import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { InboxClient } from '@/components/inbox/InboxClient';
import { TourGate } from '@/components/tour/TourGate';
import { inboxTour } from '@/components/tour/tours';

export const metadata = {
  title: `Inbox · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <PageHeader title="Inbox" />
        <p style={{ color: 'var(--color-danger)' }}>Error loading inbox: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Inbox"
        subtitle="Inquiries from your website, email, and manual entries."
      />
      <InboxClient inquiries={inquiries ?? []} />
      <TourGate tourId="inbox" steps={inboxTour.steps} helpHref="/help/inbox" />
    </div>
  );
}
