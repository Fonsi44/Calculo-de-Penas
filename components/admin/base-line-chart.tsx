'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type LineConfig = { key: string; color: string; label: string };

type BaseLineChartProps = {
  data: { date: string; [key: string]: number | string }[];
  lines: LineConfig[];
  height?: number;
};

export function BaseLineChart({ data, lines, height = 200 }: BaseLineChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DED6" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => {
          const date = new Date(d);
          return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
        }} />
        <YAxis tick={{ fontSize: 10 }} width={35} />
        <Tooltip />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} name={l.label} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
