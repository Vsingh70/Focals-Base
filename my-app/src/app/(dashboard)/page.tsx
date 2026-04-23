import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/queries/dashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ProjectStatusChart } from '@/components/dashboard/ProjectStatusChart';
import { UpcomingShootsStrip } from '@/components/dashboard/UpcomingShootsStrip';
import { RecentProjectsList } from '@/components/dashboard/RecentProjectsList';
import { QuickActions } from '@/components/dashboard/QuickActions';

export const metadata = {
  title: `Dashboard · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

function ChartSkeleton() {
  return <Skeleton height={260} />;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { kpis, revenueSeries, projectStatus, upcomingShoots, recentProjects } =
    await getDashboardData(user.id);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader title="Dashboard" subtitle="Your business at a glance." />

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <KpiCard
          label="Revenue this month"
          value={kpis.revenueMtd}
          currentNumericValue={kpis.revenueMtd}
          prevValue={kpis.revenuePriorMonth}
          format="currency"
          href="/finances"
        />
        <KpiCard label="Active projects" value={kpis.activeProjects} href="/projects" />
        <KpiCard label="Upcoming shoots" value={kpis.upcomingShoots} href="/shoots" />
        <KpiCard
          label="Pending payments"
          value={kpis.pendingPayments}
          format="currency"
          href="/projects"
        />
      </div>

      {/* Charts row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Revenue · last 6 months</CardTitle>
          </CardHeader>
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart data={revenueSeries} />
          </Suspense>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projects by status</CardTitle>
          </CardHeader>
          <Suspense fallback={<ChartSkeleton />}>
            <ProjectStatusChart data={projectStatus} />
          </Suspense>
        </Card>
      </div>

      {/* Upcoming shoots strip */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>Upcoming shoots · next 7 days</CardTitle>
        </CardHeader>
        <UpcomingShootsStrip shoots={upcomingShoots} />
      </Card>

      {/* Recent projects + quick actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
          gap: '1rem',
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent projects</CardTitle>
          </CardHeader>
          <RecentProjectsList projects={recentProjects} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <QuickActions />
        </Card>
      </div>
    </div>
  );
}
