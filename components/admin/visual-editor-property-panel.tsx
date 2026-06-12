'use client';

import { useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Type, X, Eye, EyeOff, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export interface SelectedElement {
  page: string;
  section: string;
  field: string;
  content: string;
  isRichtext: boolean;
  tagName: string;
  className: string;
}

interface PropertyPanelProps {
  selected: SelectedElement | null;
  onUpdateContent: (section: string, field: string, content: string) => void;
  onStyle: (style: Record<string, string | boolean>) => void;
  onClose: () => void;
}

export function PropertyPanel({
  selected,
  onUpdateContent,
  onStyle,
  onClose,
}: PropertyPanelProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [editContent, setEditContent] = useState(selected?.content ?? '');

  const sectionLabel = selected?.section.replace(/_/g, ' ') ?? '';
  const fieldLabel = selected?.field.replace(/_/g, ' ') ?? '';

  const handleApply = useCallback(() => {
    if (!selected) return;
    onUpdateContent(selected.section, selected.field, editContent);
  }, [selected, editContent, onUpdateContent]);

  if (!selected) {
    return (
      <div className="p-4 text-center text-text-secondary text-xs">
        <Type size={24} className="mx-auto mb-2 opacity-30" />
        <p>Selecciona un elemento en la página para editar sus propiedades</p>
      </div>
    );
  }

  const selectionId = `${selected.section}.${selected.field}`;

  const toolButtons = [
    { icon: Bold, label: 'Negrita', action: () => onStyle({ bold: true }) },
    { icon: Italic, label: 'Cursiva', action: () => onStyle({ italic: true }) },
    { icon: Underline, label: 'Subrayado', action: () => onStyle({ underline: true }) },
    { icon: AlignLeft, label: 'Izquierda', action: () => onStyle({ textAlign: 'left' }) },
    { icon: AlignCenter, label: 'Centro', action: () => onStyle({ textAlign: 'center' }) },
    { icon: AlignRight, label: 'Derecha', action: () => onStyle({ textAlign: 'right' }) },
  ];

  return (
    <div className="h-full flex flex-col bg-surface border-l border-border-light" key={selectionId}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-light bg-white">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
          Propiedades
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
            title={previewMode ? 'Desactivar vista previa' : 'Vista previa de publicación'}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
            title="Cerrar panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="flex-1 p-4 overflow-auto">
          <div className="rounded-md border border-border-light bg-white p-4 shadow-sm">
            <div className="text-xxs font-bold uppercase tracking-wider text-text-muted mb-1">
              {sectionLabel}
            </div>
            <div className="text-xs text-text-secondary mb-3">
              {fieldLabel}
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: editContent }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border-light">
            <div className="text-xxs font-bold uppercase tracking-wider text-accent-dark">
              {sectionLabel}
            </div>
            <div className="text-xs font-semibold text-text mt-0.5">
              {fieldLabel}
            </div>
            <div className="text-xxs text-text-muted mt-0.5">
              <code className="bg-surface-alt px-1 rounded">&lt;{selected.tagName}&gt;</code>
              {selected.isRichtext && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-accent/10 text-accent-dark text-xxs">
                  HTML enriquecido
                </span>
              )}
            </div>
          </div>

          <div className="px-3 py-2 flex items-center gap-1 border-b border-border-light flex-wrap">
            {toolButtons.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                className="p-1.5 rounded hover:bg-accent/15 text-text-secondary hover:text-primary transition-colors"
                title={btn.label}
              >
                <btn.icon size={14} />
              </button>
            ))}
            <span className="w-px h-4 bg-border-light mx-1" />
            <button
              type="button"
              onClick={() => onStyle({ fontSize: '' })}
              className="p-1.5 rounded hover:bg-accent/15 text-text-secondary hover:text-primary transition-colors text-xxs font-bold"
              title="Restaurar tamaño"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {selected.isRichtext ? (
              <div className="space-y-2">
                <label className="text-xxs font-semibold text-text-secondary">
                  Contenido HTML
                </label>
                <RichTextEditor
                  content={editContent}
                  onChange={setEditContent}
                  minHeight={180}
                />
                <button
                  type="button"
                  onClick={() => setShowHtml(!showHtml)}
                  className="text-xxs text-accent-dark hover:text-primary transition-colors font-medium"
                >
                  {showHtml ? 'Ocultar HTML' : 'Editar HTML directo'}
                </button>
                {showHtml && (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full font-mono text-xxs p-2 rounded-md border border-border-light bg-surface-alt text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
                    rows={6}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xxs font-semibold text-text-secondary">
                  Contenido
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[100px] p-2 rounded-md border border-border-light bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
                />
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border-light bg-white">
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              className="w-full"
            >
              Aplicar cambio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
