'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { RevenuePoint } from '@/lib/queries/dashboard';

function formatMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

function formatDollars(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

// CSS variables can't be passed straight to canvas; resolve them once at
// render time. Falls back to sensible defaults if the variable isn't set
// (e.g. during SSR snapshot, though the chart only renders client-side).
function tokenColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const option = useMemo<EChartsOption>(() => {
    const success = tokenColor('--color-success', '#4caf7d');
    const danger = tokenColor('--color-danger', '#e85040');
    const border = tokenColor('--color-border', '#3a3a3a');
    const textTertiary = tokenColor('--color-text-tertiary', '#888');
    const textSecondary = tokenColor('--color-text-secondary', '#aaa');
    const textPrimary = tokenColor('--color-text-primary', '#eaeaea');
    const bgSecondary = tokenColor('--color-bg-secondary', '#1a1a1a');

    const months = data.map((d) => formatMonth(d.month));

    return {
      animation: true,
      animationDuration: 300,
      grid: { top: 24, right: 16, bottom: 32, left: 56, containLabel: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: border } },
        backgroundColor: bgSecondary,
        borderColor: border,
        borderWidth: 1,
        textStyle: { color: textPrimary, fontSize: 13 },
        valueFormatter: (v) => formatDollars(Number(v)),
      },
      legend: {
        bottom: 0,
        textStyle: { color: textSecondary, fontSize: 12 },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textTertiary, fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: border, type: 'dashed' } },
        axisLabel: { color: textTertiary, fontSize: 12, formatter: (v: number) => formatDollars(v) },
      },
      series: [
        {
          name: 'income',
          type: 'line',
          smooth: true,
          showSymbol: false,
          emphasis: { focus: 'series' },
          lineStyle: { color: success, width: 2 },
          itemStyle: { color: success },
          data: data.map((d) => d.income),
        },
        {
          name: 'expense',
          type: 'line',
          smooth: true,
          showSymbol: false,
          emphasis: { focus: 'series' },
          lineStyle: { color: danger, width: 2 },
          itemStyle: { color: danger },
          data: data.map((d) => d.expense),
        },
      ],
    };
  }, [data]);

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: 260 }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  );
}
