'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export type ChartPoint = { month: string; income: number; expense: number };

function formatMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

function formatDollars(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export function FinancesChart({ data }: { data: ChartPoint[] }) {
  const chartData = data.map((d) => ({ ...d, monthLabel: formatMonth(d.month) }));

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            stroke="var(--color-text-tertiary)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--color-text-tertiary)"
            fontSize={12}
            tickFormatter={formatDollars}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.8125rem',
            }}
            formatter={(v: number) => formatDollars(v)}
            labelStyle={{ color: 'var(--color-text-secondary)' }}
            cursor={{ fill: 'var(--color-bg-tertiary)', opacity: 0.5 }}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}
            iconType="circle"
          />
          <Bar dataKey="income" fill="var(--color-success)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="expense" fill="var(--color-danger)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
