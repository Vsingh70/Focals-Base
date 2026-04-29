'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import type { StatusCount } from '@/lib/queries/dashboard';

const ProjectStatusChart = dynamic(() => import('./ProjectStatusChart'), {
  ssr: false,
  loading: () => <Skeleton height={260} />,
});

export function LazyProjectStatusChart({ data }: { data: StatusCount[] }) {
  return <ProjectStatusChart data={data} />;
}
