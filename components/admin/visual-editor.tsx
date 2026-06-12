'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Eye, EyeOff, Save, Undo2, Redo2, PanelRightOpen, PanelRightClose,
  RefreshCw, FileText, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { PropertyPanel, SelectedElement } from '@/components/admin/visual-editor-property-panel';

interface VisualEditorProps {
  page: string;
  pageLabel: string;
}

interface PendingChange {
  section: string;
  field: string;
  content: string;
  timestamp: number;
}

export function VisualEditor({ page, pageLabel }: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editorReady, setEditorReady] = useState(false);

  const [history, setHistory] = useState<PendingChange[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const proxyUrl = `/api/admin/visual-editor/proxy?page=${page}`;

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 've:ready') {
        setEditorReady(true);
        setLoading(false);
      }

      if (event.data?.type === 've:select') {
        setSelected({
          page: event.data.page,
          section: event.data.section,
          field: event.data.field,
          content: event.data.content,
          isRichtext: event.data.isRichtext,
          tagName: event.data.tagName,
          className: event.data.className,
        });
      }

      if (event.data?.type === 've:deselect') {
        setSelected(null);
      }

      if (event.data?.type === 've:update') {
        const change: PendingChange = {
          section: event.data.section,
          field: event.data.field,
          content: event.data.content,
          timestamp: Date.now(),
        };
        setPendingChanges((prev) => {
          const filtered = prev.filter(
            (c) => !(c.section === change.section && c.field === change.field)
          );
          return [...filtered, change];
        });
        setSaveStatus('idle');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!loading && editorReady && previewMode) {
      sendToIframe({ type: 've:refresh' });
    }
  }, [previewMode, loading, editorReady, sendToIframe]);

  const handleSave = useCallback(async () => {
    if (pendingChanges.length === 0) {
      toast.info('No hay cambios pendientes');
      return;
    }

    setSaving(true);
    setSaveStatus('saving');

    let success = 0;
    let error = 0;

    for (const change of pendingChanges) {
      try {
        const res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page,
            section: change.section,
            field: change.field,
            content: change.content,
          }),
        });
        if (res.ok) {
          success++;
        } else {
          error++;
        }
      } catch {
        error++;
      }
    }

    setSaving(false);

    if (error === 0) {
      setSaveStatus('saved');
      setPendingChanges([]);

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(pendingChanges);
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);

      const msg =
        success === 1
          ? 'Cambio guardado y publicado'
          : `${success} cambios guardados y publicados`;
      toast.success(msg);
    } else {
      setSaveStatus('error');
      toast.danger(`Guardado con ${error} errores (${success} correctos)`);
    }
  }, [pendingChanges, page, toast, historyIndex]);

  const handleUpdateContent = useCallback(
    (section: string, field: string, content: string) => {
      sendToIframe({
        type: 've:set-content',
        section,
        field,
        content,
        isHtml: true,
      });
    },
    [sendToIframe]
  );

  const handleStyle = useCallback(
    (style: Record<string, string | boolean>) => {
      sendToIframe({ type: 've:style', ...style });
    },
    [sendToIframe]
  );

  const handleClose = useCallback(() => {
    setSelected(null);
    sendToIframe({ type: 've:deselect' });
  }, [sendToIframe]);

  const handleUndo = useCallback(() => {
    setHistoryIndex((prev) => {
      const newIdx = Math.max(-1, prev - 1);
      return newIdx;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryIndex((prev) => {
      const newIdx = Math.min(history.length - 1, prev + 1);
      return newIdx;
    });
  }, [history.length]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setEditorReady(false);
    setSelected(null);
    setPendingChanges([]);
    if (iframeRef.current) {
      iframeRef.current.src = proxyUrl;
    }
  }, [proxyUrl]);

  const hasPending = pendingChanges.length > 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={48} className="text-danger mb-4" />
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-border-light rounded-t-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{pageLabel}</span>
          {hasPending && (
            <span className="flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full bg-accent/10 text-accent-dark font-medium">
              <FileText size={10} />
              {pendingChanges.length} cambio{pendingChanges.length !== 1 ? 's' : ''} pendiente{pendingChanges.length !== 1 ? 's' : ''}
            </span>
          )}
          {saveStatus === 'saved' && !hasPending && (
            <span className="flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
              <CheckCircle2 size={10} />
              Guardado
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex < 0}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors disabled:opacity-30"
            title="Deshacer"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors disabled:opacity-30"
            title="Rehacer"
          >
            <Redo2 size={14} />
          </button>
          <span className="w-px h-4 bg-border-light mx-1" />
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-1.5 rounded transition-colors ${
              previewMode
                ? 'bg-accent/15 text-accent-dark'
                : 'hover:bg-surface-alt text-text-muted hover:text-text'
            }`}
            title={previewMode ? 'Modo edición' : 'Vista previa'}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
            title="Recargar página"
          >
            <RefreshCw size={14} />
          </button>
          <span className="w-px h-4 bg-border-light mx-1" />
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className={`p-1.5 rounded transition-colors ${
              panelOpen
                ? 'bg-accent/15 text-accent-dark'
                : 'hover:bg-surface-alt text-text-muted hover:text-text'
            }`}
            title={panelOpen ? 'Cerrar panel' : 'Abrir panel'}
          >
            {panelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={!hasPending || saving}
            className="ml-2"
          >
            <Save size={14} className="mr-1" />
            Guardar todo
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 relative bg-[#f5f5f0] ${previewMode ? 'opacity-90' : ''}`}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <Spinner />
                <p className="text-xs text-text-secondary mt-2">Cargando editor visual...</p>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={proxyUrl}
            className="w-full h-full border-0"
            title={`Editor visual: ${pageLabel}`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            onLoad={() => {
              if (!editorReady) {
                setTimeout(() => {
                  if (!editorReady) {
                    setLoading(false);
                    setError('El editor no pudo inicializarse. Recarga la página.');
                  }
                }, 8000);
              }
            }}
            onError={() => {
              setLoading(false);
              setError('Error al cargar la página. Verifica que el servidor esté corriendo.');
            }}
          />

          {!loading && !editorReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center max-w-sm">
                <Spinner />
                <p className="text-xs text-text-secondary mt-2">Inicializando editor...</p>
              </div>
            </div>
          )}

          {previewMode && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xxs font-bold shadow-lg">
              VISTA PREVIA — Los cambios no son editables en este modo
            </div>
          )}
        </div>

        {panelOpen && (
          <div className="w-80 flex-shrink-0 overflow-hidden border-l border-border-light">
            <PropertyPanel
              selected={selected}
              onUpdateContent={handleUpdateContent}
              onStyle={handleStyle}
              onClose={handleClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
