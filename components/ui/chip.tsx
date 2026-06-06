import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/ui';

export type ChipTone = 'neutral' | 'mitigation' | 'aggravation' | 'exemption' | 'accent' | 'primary' | 'danger';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: ChipTone;
  size?: 'sm' | 'md';
  children: ReactNode;
}

const TONE: Record<ChipTone, { idle: string; selected: string }> = {
  neutral: {
    idle: 'bg-surface border-border text-text-secondary hover:border-border-strong',
    selected: 'bg-primary/10 border-primary text-primary',
  },
  mitigation: {
    idle: 'bg-surface border-border text-text-secondary hover:border-mitigation',
    selected: 'bg-mitigation-bg border-mitigation text-mitigation',
  },
  aggravation: {
    idle: 'bg-surface border-border text-text-secondary hover:border-aggravation',
    selected: 'bg-aggravation-bg border-aggravation text-aggravation',
  },
  exemption: {
    idle: 'bg-surface border-border text-text-secondary hover:border-exemption',
    selected: 'bg-exemption-bg border-exemption text-exemption',
  },
  accent: {
    idle: 'bg-surface border-border text-text-secondary hover:border-accent',
    selected: 'bg-accent/15 border-accent text-accent-dark',
  },
  primary: {
    idle: 'bg-surface border-border text-text-secondary hover:border-primary',
    selected: 'bg-primary/10 border-primary text-primary',
  },
  danger: {
    idle: 'bg-surface border-border text-text-secondary hover:border-danger',
    selected: 'bg-danger-bg border-danger text-danger',
  },
};

const SIZE = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3 text-sm',
};

export function Chip({
  selected = false,
  tone = 'neutral',
  size = 'sm',
  className,
  type = 'button',
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      role="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors',
        'focus-visible:outline-none disabled:opacity-50',
        SIZE[size],
        selected ? TONE[tone].selected : TONE[tone].idle,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
