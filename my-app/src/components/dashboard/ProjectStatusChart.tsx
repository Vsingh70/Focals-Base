'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

function formatStatus(s: string) {
  return s.replace(/_/g, ' ');
}

export function ProjectStatusChart({ data }: { data: StatusCount[] }) {
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
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="var(--color-bg-secondary)"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? 'var(--color-border-secondary)'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.8125rem',
            }}
            formatter={(value: number, name: string) => [value, formatStatus(name)]}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}
            iconType="circle"
            formatter={(value) => formatStatus(value as string)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
