'use client';

// Thin client-component shim around the dynamic import. Splits the ~150KB
// ECharts bundle out of the dashboard's initial JS payload — the chart
// chunk only loads when the dashboard route renders. SSR off because
// ReactECharts mounts a canvas, which doesn't server-render usefully.
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import type { RevenuePoint } from '@/lib/queries/dashboard';

const RevenueChart = dynamic(() => import('./RevenueChart'), {
  ssr: false,
  loading: () => <Skeleton height={260} />,
});

export function LazyRevenueChart({ data }: { data: RevenuePoint[] }) {
  return <RevenueChart data={data} />;
}
