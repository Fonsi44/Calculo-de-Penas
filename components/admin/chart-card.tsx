'use client';

import type { ReactNode } from 'react';
import { EmptyState } from './empty-state';

type ChartCardProps = {
  title: string;
  children: ReactNode;
  status?: 'ok' | 'not_configured' | 'permission_denied' | 'no_data' | 'error';
  message?: string;
  loading?: boolean;
  lastUpdated?: string;
};

export function ChartCard({ title, children, status, message, loading, lastUpdated }: ChartCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border/30 bg-surface p-4 animate-pulse">
        <div className="h-4 w-32 bg-border/40 rounded mb-3" />
        <div className="h-40 bg-border/40 rounded" />
      </div>
    );
  }

  if (status && status !== 'ok') {
    return (
      <div className="rounded-lg border border-border/30 bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">{title}</p>
        <EmptyState type={status === 'no_data' ? 'empty' : status} message={message} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/30 bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{title}</p>
        {lastUpdated && <span className="text-xxs text-text-muted">{lastUpdated}</span>}
      </div>
      {children}
    </div>
  );
}
