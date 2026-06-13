import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/ui';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  label?: string;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  total,
  label = 'registros',
  onPrev,
  onNext,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between p-3 border-t border-border-light', className)}>
      <p className="text-xs text-text-secondary">
        Página {page} de {totalPages} · {total} {label}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
