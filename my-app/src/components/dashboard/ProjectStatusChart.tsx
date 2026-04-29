'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StatusCount } from '@/lib/queries/dashboard';

const STATUS_COLORS: Record<string, string> = {
  inquiry: '#888888',
  booked: '#e8e0d0',
  in_progress: '#e8a020',
  editing: '#e8a020',
  delivered: '#4caf7d',
  completed: '#4caf7d',
  cancelled: '#e85040',
};

function humanize(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function tokenColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export default function ProjectStatusChart({ data }: { data: StatusCount[] }) {
  const option = useMemo<EChartsOption>(() => {
    const border = tokenColor('--color-border', '#3a3a3a');
    const textSecondary = tokenColor('--color-text-secondary', '#aaa');
    const textPrimary = tokenColor('--color-text-primary', '#eaeaea');
    const bgSecondary = tokenColor('--color-bg-secondary', '#1a1a1a');

    return {
      animation: true,
      animationDuration: 300,
      tooltip: {
        trigger: 'item',
        backgroundColor: bgSecondary,
        borderColor: border,
        borderWidth: 1,
        textStyle: { color: textPrimary, fontSize: 13 },
        formatter: (params) => {
          // params is a single point object for pie tooltip
          const p = params as { name: string; value: number; percent: number };
          return `${humanize(p.name)}<br/>${p.value} (${p.percent}%)`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: textSecondary, fontSize: 12 },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        formatter: (name: string) => humanize(name),
      },
      series: [
        {
          name: 'Projects by status',
          type: 'pie',
          radius: ['60%', '85%'],
          center: ['50%', '45%'],
          padAngle: 2,
          itemStyle: {
            borderColor: bgSecondary,
            borderWidth: 2,
          },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 4,
            label: { show: false },
          },
          data: data.map((entry) => ({
            value: entry.count,
            name: entry.status,
            itemStyle: {
              color: STATUS_COLORS[entry.status] ?? '#555',
            },
          })),
        },
      ],
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        style={{
          height: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: '0.875rem',
        }}
      >
        No projects yet
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: 260 }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  );
}
