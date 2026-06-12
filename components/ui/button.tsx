import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white border border-primary-light/40 shadow-btn-primary hover:bg-primary-light hover:shadow-btn-primary-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-btn-primary disabled:bg-primary/60 disabled:translate-y-0',
  secondary:
    'bg-surface text-text border border-border shadow-btn-secondary hover:border-accent/60 hover:bg-surface-2 hover:shadow-btn-secondary-hover hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0',
  tertiary:
    'bg-transparent text-text-secondary border border-transparent hover:bg-surface-alt hover:text-text hover:border-border-light disabled:opacity-50',
  danger:
    'bg-danger text-white border border-danger/40 shadow-btn-primary hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:translate-y-0',
  ghost:
    'bg-transparent text-text border border-transparent hover:bg-surface-alt disabled:opacity-50',
  accent:
    'bg-accent text-primary border border-accent-dark/40 shadow-btn-accent hover:bg-accent-light hover:shadow-btn-accent-hover hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:translate-y-0 font-bold',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}
