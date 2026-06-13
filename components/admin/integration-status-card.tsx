'use client';

import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

type IntegrationStatus = 'ok' | 'not_configured' | 'permission_denied' | 'no_data' | 'error' | 'loading';

type IntegrationStatusCardProps = {
  label: string;
  status: IntegrationStatus;
  detail?: string;
};

const STATUS_CONFIG: Record<IntegrationStatus, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  ok: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5 border-success/20' },
  not_configured: { icon: XCircle, color: 'text-text-muted', bg: 'bg-surface-alt border-border/30' },
  permission_denied: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/5 border-warning/20' },
  no_data: { icon: AlertTriangle, color: 'text-text-muted', bg: 'bg-surface-alt border-border/30' },
  error: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/5 border-danger/20' },
  loading: { icon: Loader2, color: 'text-text-muted', bg: 'bg-surface-alt border-border/30' },
};

export function IntegrationStatusCard({ label, status, detail }: IntegrationStatusCardProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.bg} p-3 flex items-start gap-3`}>
      <div className={`mt-0.5 ${config.color}`}>
        <Icon size={16} className={status === 'loading' ? 'animate-spin' : ''} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-text">{label}</p>
        {detail && <p className="text-xxs text-text-muted mt-0.5 line-clamp-2">{detail}</p>}
      </div>
    </div>
  );
}
