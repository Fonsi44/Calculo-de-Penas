import type { ReactNode } from 'react';
import { cn } from '@/lib/ui';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-12 px-4', className)}>
      {icon && <div className="text-text-muted opacity-50 mb-3">{icon}</div>}
      <p className="text-base font-bold text-text">{title}</p>
      {description && <p className="text-sm text-text-secondary mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo salió mal',
  description = 'No pudimos completar la operación.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-12 px-4', className)}>
      <p className="text-base font-bold text-danger">{title}</p>
      <p className="text-sm text-text-secondary mt-1 max-w-md">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 h-9 px-4 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-light"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
