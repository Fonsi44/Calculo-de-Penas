import type { ReactNode } from 'react';
import { cn } from '@/lib/ui';

interface StatItem {
  value: string | number;
  label: string;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
}

interface StatCardsProps {
  items: StatItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const TONE_CLASSES: Record<string, string> = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  accent: 'text-accent-dark',
};

const COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

export function StatCards({ items, columns = 4, className }: StatCardsProps) {
  return (
    <div className={cn('grid gap-2', COLUMNS[columns], className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-surface-alt rounded-lg p-3 text-center border border-border-light/50"
        >
          {item.icon && <div className="flex justify-center mb-1.5 text-text-muted">{item.icon}</div>}
          <p className={cn('font-extrabold text-lg tabular-nums leading-none', TONE_CLASSES[item.tone ?? 'default'])}>
            {item.value}
          </p>
          <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
