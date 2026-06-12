import { Check } from 'lucide-react';
import { cn } from '@/lib/ui';

export interface StepperStep {
  num: number;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  current: number;
  variant?: 'horizontal' | 'vertical';
  className?: string;
  onSelect?: (num: number) => void;
}

export function Stepper({ steps, current, variant = 'horizontal', className, onSelect }: StepperProps) {
  if (variant === 'vertical') {
    return (
      <nav aria-label="Pasos" className={cn('flex flex-col gap-1.5', className)}>
        {steps.map(s => {
          const active = s.num === current;
          const done = s.num < current;
          const interactive = Boolean(onSelect) && (done || active);
          const Tag = interactive ? 'button' : 'div';
          return (
            <Tag
              key={s.num}
              type={interactive ? 'button' : undefined}
              onClick={interactive ? () => onSelect?.(s.num) : undefined}
              className={cn(
                'flex items-center gap-2 py-1.5 px-1 rounded text-left w-full',
                interactive && 'hover:bg-white/5 focus-visible:outline-none',
              )}
              aria-current={active ? 'step' : undefined}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                  active && 'bg-accent text-primary',
                  done && 'bg-accent/70 text-primary',
                  !active && !done && 'bg-white/15 text-text-inverse',
                )}
              >
                {done ? <Check size={14} /> : s.num}
              </div>
              <span
                className={cn(
                  'text-sm',
                  active && 'text-accent font-bold',
                  done && 'text-accent/80',
                  !active && !done && 'text-text-inverse/80',
                )}
              >
                {s.label}
              </span>
            </Tag>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Pasos"
      className={cn('flex gap-1 overflow-x-auto scrollbar-none', className)}
    >
      {steps.map(s => {
        const active = s.num === current;
        const done = s.num < current;
        return (
          <div
            key={s.num}
            className="flex items-center flex-shrink-0"
            aria-current={active ? 'step' : undefined}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xxs font-bold transition-colors',
                active && 'bg-accent text-primary',
                done && 'bg-accent/70 text-primary',
                !active && !done && 'bg-white/15 text-text-inverse',
              )}
            >
              {done ? <Check size={12} /> : s.num}
            </div>
            {s.num < steps.length && (
              <div
                className={cn(
                  'w-3 h-0.5 mx-0.5',
                  done ? 'bg-accent/70' : 'bg-white/15',
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
