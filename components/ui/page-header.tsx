import type { ReactNode } from 'react';
import { cn } from '@/lib/ui';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  metadata?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, metadata, actions, icon, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-primary leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          {metadata && <p className="text-xxs text-text-muted mt-0.5">{metadata}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
