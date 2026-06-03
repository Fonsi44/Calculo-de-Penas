import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/ui';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'danger' | 'warning';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const TONE: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-surface border-border-light',
  accent: 'bg-surface border-accent/30',
  success: 'bg-surface border-success/30',
  danger: 'bg-surface border-danger/30',
  warning: 'bg-surface border-warning/30',
};

const PAD: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({
  children,
  tone = 'default',
  padding = 'md',
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border shadow-sm',
        TONE[tone],
        PAD[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-3 pb-3 border-b border-border-light', className)}>
      <div className="min-w-0">
        <h3 className="font-bold text-sm text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
