import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/ui';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'danger' | 'warning';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Variante visual: por defecto 'default' usa card-premium (profundidad + halo al hover). */
  variant?: 'default' | 'flat' | 'elevated';
  /** Aplica la franja dorada superior al hacer hover (premium-bar). */
  premium?: boolean;
}

const TONE: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'border-border-light',
  accent: 'border-accent/30',
  success: 'border-success/30',
  danger: 'border-danger/30',
  warning: 'border-warning/30',
};

const PAD: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 md:p-7',
};

export function Card({
  children,
  tone = 'default',
  padding = 'md',
  variant = 'default',
  premium = false,
  className,
  ...rest
}: CardProps) {
  const variantCls =
    variant === 'flat'
      ? 'bg-surface border border-border-light shadow-xs'
      : variant === 'elevated'
        ? 'bg-surface border border-border-light shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200'
        : 'card-premium';
  // 'default' (card-premium) ya incluye su propio border y background.
  // 'flat' y 'elevated' usan TONE[tone] para colorear el borde.
  const toneCls = variant === 'default' ? '' : TONE[tone];
  return (
    <div
      className={cn(
        // Radius canónico de la web pública: rounded-lg.
        'rounded-lg',
        variantCls,
        toneCls,
        PAD[padding],
        premium && 'premium-bar',
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
