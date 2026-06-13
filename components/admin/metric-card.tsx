'use client';

import type { ReactNode } from 'react';
import { TrendBadge } from './trend-badge';

type MetricCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
  trend?: { direction: 'up' | 'down' | 'flat'; percentage: number };
  subtitle?: string;
  loading?: boolean;
};

export function MetricCard({ label, value, icon, trend, subtitle, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border/30 bg-surface p-4 animate-pulse">
        <div className="h-3 w-20 bg-border/40 rounded mb-3" />
        <div className="h-8 w-16 bg-border/40 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/30 bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
        {icon && <span className="text-accent-dark">{icon}</span>}
      </div>
      <p className="text-2xl font-extrabold text-text tabular-nums">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <TrendBadge direction={trend.direction} percentage={trend.percentage} />
          {subtitle && <span className="text-xxs text-text-muted ml-1">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
