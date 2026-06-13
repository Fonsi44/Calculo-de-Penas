'use client';

import { useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Type, X, Eye, EyeOff, RotateCcw, Trash2, Eye as EyeIcon,
  ArrowUp, ArrowDown, Copy, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useConfirm } from '@/components/ui/confirm';

export interface SelectedElement {
  page: string;
  section: string;
  field: string;
  content: string;
  isRichtext: boolean;
  tagName: string;
  className: string;
}

interface BreadcrumbItem {
  tag: string;
  section: string;
}

interface PropertyPanelProps {
  selected: SelectedElement | null;
  breadcrumbs: BreadcrumbItem[];
  onUpdateContent: (section: string, field: string, content: string) => void;
  onStyle: (style: Record<string, string | boolean>) => void;
  onClose: () => void;
  onRemove: (section: string) => void;
  onHide: (section: string) => void;
  onMoveUp: (section: string) => void;
  onMoveDown: (section: string) => void;
  onDuplicate: (section: string) => void;
  onSelectAncestor?: () => void;
  onSelectDescendant?: () => void;
}

export function PropertyPanel({
  selected, breadcrumbs, onUpdateContent, onStyle, onClose,
  onRemove, onHide, onMoveUp, onMoveDown, onDuplicate,
  onSelectAncestor, onSelectDescendant,
}: PropertyPanelProps) {
  const confirm = useConfirm();
  const [previewMode, setPreviewMode] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [editContent, setEditContent] = useState(selected?.content ?? '');

  const sectionLabel = selected?.section.replace(/_/g, ' ') || '';
  const fieldLabel = selected?.field.replace(/_/g, ' ') || '';

  const handleApply = useCallback(() => {
    if (!selected) return;
    onUpdateContent(selected.section, selected.field, editContent);
  }, [selected, editContent, onUpdateContent]);

  const handleRemoveClick = useCallback(async () => {
    if (!selected) return;
    if (await confirm({
      title: '¿Eliminar este bloque?',
      description: `Se eliminará la sección "${sectionLabel}". Podés guardar los cambios o descartarlos después.`,
      tone: 'danger',
    })) {
      onRemove(selected.section);
    }
  }, [selected, sectionLabel, confirm, onRemove]);

  const handleHideClick = useCallback(async () => {
    if (!selected) return;
    if (await confirm({
      title: '¿Ocultar este bloque?',
      description: 'El bloque quedará oculto en la página. Podés mostrarlo después.',
      tone: 'warning',
    })) {
      onHide(selected.section);
    }
  }, [selected, confirm, onHide]);

  if (!selected) {
    return (
      <div className="p-4 text-center text-text-secondary text-xs space-y-3">
        <Type size={24} className="mx-auto mb-2 opacity-30" />
        <p>Seleccioná un elemento en la página para editar sus propiedades</p>
        <p className="text-xxs text-text-muted">
          Hacé clic en cualquier texto, botón o bloque editable
        </p>
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
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Propiedades</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPreviewMode(!previewMode)}
            className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
            title={previewMode ? 'Vista normal' : 'Vista previa'}>
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button type="button" onClick={onClose}
            className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors" title="Cerrar">
            <X size={14} />
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="flex-1 p-4 overflow-auto">
          <div className="rounded-md border border-border-light bg-white p-4 shadow-sm">
            <div className="text-xxs font-bold uppercase tracking-wider text-text-muted mb-1">{sectionLabel}</div>
            <div className="text-xs text-text-secondary mb-3">{fieldLabel}</div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: editContent }} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Info */}
          <div className="px-3 py-2 border-b border-border-light">
            <div className="text-xxs font-bold uppercase tracking-wider text-accent-dark">{sectionLabel}</div>
            <div className="text-xs font-semibold text-text mt-0.5">{fieldLabel}</div>
            <div className="text-xxs text-text-muted mt-0.5 flex items-center gap-2 flex-wrap">
              <code className="bg-surface-alt px-1 rounded">&lt;{selected.tagName}&gt;</code>
              {selected.isRichtext && <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent-dark text-xxs">HTML</span>}
            </div>
          </div>

          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <div className="px-3 py-1.5 border-b border-border-light bg-surface-alt/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xxs text-text-muted font-semibold uppercase tracking-wider">Jerarquía</span>
                <div className="flex gap-1">
                  {onSelectAncestor && (
                    <button onClick={onSelectAncestor}
                      className="p-0.5 rounded hover:bg-surface-alt text-text-muted hover:text-text"
                      title="Elemento padre"><ChevronUp size={12} /></button>
                  )}
                  {onSelectDescendant && (
                    <button onClick={onSelectDescendant}
                      className="p-0.5 rounded hover:bg-surface-alt text-text-muted hover:text-text"
                      title="Elemento hijo"><ChevronDown size={12} /></button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <code className="text-xxs bg-white px-1 rounded border border-border-light">{crumb.tag}</code>
                    {i < breadcrumbs.length - 1 && <span className="text-text-muted text-xxs">›</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Style toolbar */}
          <div className="px-3 py-2 flex items-center gap-1 border-b border-border-light flex-wrap">
            {toolButtons.map((btn) => (
              <button key={btn.label} type="button" onClick={btn.action}
                className="p-1.5 rounded hover:bg-accent/15 text-text-secondary hover:text-primary transition-colors" title={btn.label}>
                <btn.icon size={14} />
              </button>
            ))}
            <span className="w-px h-4 bg-border-light mx-1" />
            <button type="button" onClick={() => onStyle({ fontSize: '' })}
              className="p-1.5 rounded hover:bg-accent/15 text-text-secondary hover:text-primary transition-colors text-xxs font-bold" title="Restaurar">
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-auto p-3">
            {selected.isRichtext ? (
              <div className="space-y-2">
                <label className="text-xxs font-semibold text-text-secondary">Contenido HTML</label>
                <RichTextEditor content={editContent} onChange={setEditContent} minHeight={180} />
                <button type="button" onClick={() => setShowHtml(!showHtml)}
                  className="text-xxs text-accent-dark hover:text-primary transition-colors font-medium">
                  {showHtml ? 'Ocultar HTML' : 'Editar HTML directo'}
                </button>
                {showHtml && (
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    className="w-full font-mono text-xxs p-2 rounded-md border border-border-light bg-surface-alt text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
                    rows={6} />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xxs font-semibold text-text-secondary">Contenido</label>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[100px] p-2 rounded-md border border-border-light bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-border-light bg-white space-y-2">
            <div className="flex items-center gap-1">
              <button onClick={() => onMoveUp(selected.section)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xxs font-semibold text-text-secondary hover:bg-surface-alt transition-colors border border-border-light"
                title="Mover arriba"><ArrowUp size={12} /> Arriba</button>
              <button onClick={() => onMoveDown(selected.section)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xxs font-semibold text-text-secondary hover:bg-surface-alt transition-colors border border-border-light"
                title="Mover abajo"><ArrowDown size={12} /> Abajo</button>
              <button onClick={() => onDuplicate(selected.section)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xxs font-semibold text-text-secondary hover:bg-surface-alt transition-colors border border-border-light"
                title="Duplicar"><Copy size={12} /> Duplicar</button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleHideClick}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xxs font-semibold text-warning hover:bg-warning-bg transition-colors border border-warning/30"
                title="Ocultar"><EyeIcon size={12} /> Ocultar</button>
              <button onClick={handleRemoveClick}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xxs font-semibold text-danger hover:bg-danger-bg transition-colors border border-danger/30"
                title="Eliminar"><Trash2 size={12} /> Eliminar</button>
            </div>
            <div className="border-t border-border-light pt-2">
              <Button variant="primary" size="sm" onClick={handleApply} className="w-full">
                Aplicar cambio
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
