'use client';

import { useCallback } from 'react';
import {
  LayoutPanelTop, Type, Image, MousePointerClick, Scale,
} from 'lucide-react';
import { cn } from '@/lib/ui';
import {
  ALL_COMPONENTS,
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
        <button
          type="button"
          onClick={onToggle}
          className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
          title="Cerrar panel"
        >
          <span className="text-xs">✕</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {categories.map((cat) => {
          const catComponents = grouped[cat];
          const CatIcon = CATEGORY_ICONS[cat];
          return (
            <div key={cat} className="border-b border-border-light last:border-b-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt/20">
                <CatIcon size={12} />
                <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-xxs text-text-muted ml-auto">{catComponents.length}</span>
              </div>
              <div className="p-1.5 space-y-1">
                {catComponents.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, comp)}
                    onClick={() => onInsertComponent(comp)}
                    className={cn(
                      'w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-md',
                      'text-xs text-text-secondary hover:bg-accent/10 hover:text-primary',
                      'transition-colors border border-transparent hover:border-accent/20',
                      'cursor-grab active:cursor-grabbing'
                    )}
                    title={`${comp.description} — Arrastrá o hacé clic para insertar`}
                  >
                    <span className="w-6 h-6 rounded bg-surface-alt flex items-center justify-center text-xs flex-shrink-0">
                      {comp.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{comp.name}</div>
                      <div className="text-xxs text-text-muted truncate">{comp.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-2 border-t border-border-light text-xxs text-text-muted bg-surface-alt/20">
        Arrastrá un componente al área de edición o hacé clic para insertarlo
      </div>
    </div>
  );
}
