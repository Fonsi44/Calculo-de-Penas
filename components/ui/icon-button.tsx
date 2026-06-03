import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/ui';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'solid' | 'subtle' | 'ghost';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const VARIANT: Record<NonNullable<IconButtonProps['variant']>, string> = {
  solid: 'bg-white/15 text-white hover:bg-white/25',
  subtle: 'bg-surface-alt text-text-secondary hover:text-text hover:bg-border-light',
  ghost: 'text-text-muted hover:text-text hover:bg-surface-alt',
};

const SIZE: Record<NonNullable<IconButtonProps['size']>, string> = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
};

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
