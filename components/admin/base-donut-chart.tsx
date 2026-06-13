'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#D4AF37', '#0F1D3A', '#8A8F95', '#5F6368', '#E2DED6'];

type BaseDonutChartProps = {
  data: { name: string; value: number }[];
  height?: number;
};

export function BaseDonutChart({ data, height = 180 }: BaseDonutChartProps) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={height} height={height}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-text-secondary">{d.name}</span>
            <span className="font-bold text-text">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
