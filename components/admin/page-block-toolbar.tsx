'use client';

import {
  GripVertical, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/ui';

interface BlockToolbarProps {
  sectionKey: string;
  sectionLabel: string;
  isVisible: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function BlockToolbar({
  sectionKey,
  sectionLabel,
  isVisible,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onDuplicate,
  onDelete,
}: BlockToolbarProps) {
  const btnCls =
    'p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed';

  return (
    <div
      className="ve-block-toolbar"
      data-block={sectionKey}
      role="toolbar"
      aria-label={`Bloque: ${sectionLabel}`}
    >
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-primary/90 backdrop-blur-sm rounded-t-md shadow-sm border-b border-white/10">
        <span className="flex items-center gap-1 text-xxs font-semibold text-white/90 min-w-0 mr-1">
          <GripVertical size={10} className="opacity-50 flex-shrink-0" />
          <span className="truncate max-w-[120px]">{sectionLabel}</span>
        </span>

        <span className="w-px h-3 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className={btnCls}
          title="Mover arriba"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className={btnCls}
          title="Mover abajo"
        >
          <ChevronDown size={12} />
        </button>

        <span className="w-px h-3 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={onToggleVisibility}
          className={btnCls}
          title={isVisible ? 'Ocultar bloque' : 'Mostrar bloque'}
        >
          {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className={btnCls}
          title="Duplicar bloque"
        >
          <Copy size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(btnCls, 'hover:!bg-danger/70 hover:!text-white')}
          title="Eliminar bloque"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
