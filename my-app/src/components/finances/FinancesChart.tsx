'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export type ChartPoint = { month: string; income: number; expense: number };

function formatMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

function formatDollars(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function tokenColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export default function FinancesChart({ data }: { data: ChartPoint[] }) {
  const option = useMemo<EChartsOption>(() => {
    const success = tokenColor('--color-success', '#4caf7d');
    const danger = tokenColor('--color-danger', '#e85040');
    const border = tokenColor('--color-border', '#3a3a3a');
    const textTertiary = tokenColor('--color-text-tertiary', '#888');
    const textSecondary = tokenColor('--color-text-secondary', '#aaa');
    const textPrimary = tokenColor('--color-text-primary', '#eaeaea');
    const bgSecondary = tokenColor('--color-bg-secondary', '#1a1a1a');
    const bgTertiary = tokenColor('--color-bg-tertiary', '#222');

    const months = data.map((d) => formatMonth(d.month));

    return {
      animation: true,
      animationDuration: 300,
      grid: { top: 24, right: 16, bottom: 32, left: 56, containLabel: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: bgTertiary, opacity: 0.5 } },
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
          type: 'bar',
          itemStyle: { color: success, borderRadius: [2, 2, 0, 0] },
          emphasis: { focus: 'series' },
          data: data.map((d) => d.income),
        },
        {
          name: 'expense',
          type: 'bar',
          itemStyle: { color: danger, borderRadius: [2, 2, 0, 0] },
          emphasis: { focus: 'series' },
          data: data.map((d) => d.expense),
        },
      ],
    };
  }, [data]);

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: 240 }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  );
}
