import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'flat' | 'elevated';
  premium?: boolean;
}

const PAD: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 md:p-7',
};

export function Card({
  children,
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

  return (
    <div className={cn('rounded-lg', variantCls, PAD[padding], premium && 'premium-bar', className)} {...rest}>
      {children}
    </div>
  );
}
