import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/ui';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'accent'
  | 'success'
  | 'mitigation'
  | 'danger'
  | 'aggravation'
  | 'warning'
  | 'exemption'
  | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: 'soft' | 'outline' | 'solid';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const TONE: Record<BadgeTone, { soft: string; outline: string; solid: string }> = {
  neutral: {
    soft: 'bg-surface-alt text-text-secondary',
    outline: 'border-border text-text-secondary',
    solid: 'bg-text-secondary text-white',
  },
  primary: {
    soft: 'bg-primary/10 text-primary',
    outline: 'border-primary text-primary',
    solid: 'bg-primary text-white',
  },
  accent: {
    soft: 'bg-accent/15 text-accent-dark',
    outline: 'border-accent text-accent-dark',
    solid: 'bg-accent text-primary',
  },
  success: {
    soft: 'bg-success-bg text-success',
    outline: 'border-success text-success',
    solid: 'bg-success text-white',
  },
  mitigation: {
    soft: 'bg-mitigation-bg text-mitigation',
    outline: 'border-mitigation text-mitigation',
    solid: 'bg-mitigation text-white',
  },
  danger: {
    soft: 'bg-danger-bg text-danger',
    outline: 'border-danger text-danger',
    solid: 'bg-danger text-white',
  },
  aggravation: {
    soft: 'bg-aggravation-bg text-aggravation',
    outline: 'border-aggravation text-aggravation',
    solid: 'bg-aggravation text-white',
  },
  warning: {
    soft: 'bg-warning-bg text-warning',
    outline: 'border-warning text-warning',
    solid: 'bg-warning text-white',
  },
  exemption: {
    soft: 'bg-exemption-bg text-exemption',
    outline: 'border-exemption text-exemption',
    solid: 'bg-exemption text-white',
  },
  info: {
    soft: 'bg-info-bg text-info',
    outline: 'border-info text-info',
    solid: 'bg-info text-white',
  },
};

const SIZE = {
  sm: 'text-[11px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'sm',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
        variant === 'outline' && 'border',
        TONE[tone][variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
