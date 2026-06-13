'use client';

import { useCallback, useState } from 'react';
import {
  LayoutPanelTop, Type, Image, MousePointerClick, Scale,
  ChevronDown, ChevronRight, Search,
} from 'lucide-react';
import { cn } from '@/lib/ui';
import {
  getComponentsByCategory,
  CATEGORY_LABELS,
  type EditorComponentDef,
  type ComponentCategory,
} from '@/lib/visual-editor/components';

const CATEGORY_ICONS: Record<ComponentCategory, React.ComponentType<{ size?: number }>> = {
  layout: LayoutPanelTop,
  content: Type,
  media: Image,
  interactive: MousePointerClick,
  legal: Scale,
};

interface ComponentPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onInsertComponent: (component: EditorComponentDef) => void;
}

export function ComponentPanel({ isOpen, onToggle, onInsertComponent }: ComponentPanelProps) {
  const grouped = getComponentsByCategory();
  const categories = Object.keys(grouped) as ComponentCategory[];
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(categories.map(c => [c, true]))
  );
  const [search, setSearch] = useState('');

  const toggleCategory = (cat: string) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleDragStart = useCallback((e: React.DragEvent, component: EditorComponentDef) => {
    e.dataTransfer.setData('text/plain', component.id);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  if (!isOpen) return null;

  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-border-light flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-light bg-surface-alt/30">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <LayoutPanelTop size={13} />
          Componentes
        </h3>
        <button type="button" onClick={onToggle}
          className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors" title="Cerrar">
          <span className="text-xs">✕</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-border-light">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar componente..."
            className="w-full pl-7 pr-2 py-1 text-xxs rounded border border-border-light bg-surface outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {categories.map((cat) => {
          const catComponents = grouped[cat];
          const CatIcon = CATEGORY_ICONS[cat];
          const isExpanded = expanded[cat];
          const filtered = search
            ? catComponents.filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.description.toLowerCase().includes(search.toLowerCase()))
            : catComponents;
          if (filtered.length === 0 && search) return null;

          return (
            <div key={cat} className="border-b border-border-light last:border-b-0">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt/20 hover:bg-surface-alt/40 transition-colors"
              >
                {isExpanded ? <ChevronDown size={12} className="text-text-muted" /> : <ChevronRight size={12} className="text-text-muted" />}
                <CatIcon size={12} />
                <span className="text-xxs font-bold text-text-muted uppercase tracking-wider flex-1 text-left">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-xxs text-text-muted">{filtered.length}</span>
              </button>
              {isExpanded && (
                <div className="p-1.5 space-y-0.5">
                  {filtered.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, comp)}
                      onClick={() => onInsertComponent(comp)}
                      className={cn(
                        'w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md',
                        'text-xs text-text-secondary hover:bg-accent/10 hover:text-primary',
                        'transition-colors border border-transparent hover:border-accent/20',
                        'cursor-grab active:cursor-grabbing'
                      )}
                      title={`${comp.description}`}
                    >
                      <span className="w-5 h-5 rounded bg-surface-alt flex items-center justify-center text-xs flex-shrink-0">
                        {comp.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate leading-tight">{comp.name}</div>
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-xxs text-text-muted px-2 py-1">Sin resultados</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3 py-1.5 border-t border-border-light text-xxs text-text-muted bg-surface-alt/20">
        Arrastrá o hacé clic para insertar
      </div>
    </div>
  );
}
