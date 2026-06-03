import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZE = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-10 w-10 border-4',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div role="status" aria-live="polite" className={cn('inline-flex items-center gap-2', className)}>
      <Loader2
        className={cn(
          'rounded-full border-primary border-t-transparent animate-spin',
          SIZE[size],
        )}
      />
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </div>
  );
}

export function CenteredSpinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background p-8">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto" />
        <p className="text-sm text-text-secondary mt-3">{label}</p>
      </div>
    </div>
  );
}
