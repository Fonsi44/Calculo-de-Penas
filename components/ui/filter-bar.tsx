import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/ui';

interface FilterSelect {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterSelect[];
  extraActions?: ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  extraActions,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">
          <Search size={14} />
        </span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-9 pl-9 pr-8 rounded-md border border-border bg-surface text-sm text-text outline-none transition-all placeholder:text-text-muted hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {filters?.map((filter, i) => (
        <select
          key={i}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {extraActions}
    </div>
  );
}
