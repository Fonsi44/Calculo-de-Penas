'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Eye, EyeOff, Save, Undo2, Redo2, PanelRightOpen, PanelRightClose,
  RefreshCw, FileText, CheckCircle2, AlertTriangle, ArrowLeft,
  Globe, LayoutDashboard, List, Layers, Plus,
  Download, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';
import { PageMetadataPanel, PageMetaFormData } from '@/components/admin/page-metadata-panel';
import { PropertyPanel, SelectedElement } from '@/components/admin/visual-editor-property-panel';

interface PageVisualEditorProps {
  page: string;
  pageLabel: string;
  publicRoute?: string;
  onBack?: () => void;
}

interface PendingChange {
  section: string;
  field: string;
  content: string;
  timestamp: number;
}

type EditorTab = 'visual' | 'metadata';

type PageStatus = 'published' | 'draft' | 'inactive';

const STATUS_META: Record<PageStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  published: { label: 'Publicado', tone: 'success' },
  draft: { label: 'Borrador', tone: 'warning' },
  inactive: { label: 'Inactivo', tone: 'danger' },
};

export function PageVisualEditor({ page, pageLabel, publicRoute, onBack }: PageVisualEditorProps) {
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
  const [editorTab, setEditorTab] = useState<EditorTab>('visual');
  const [pageStatus, setPageStatus] = useState<PageStatus>('draft');
  const [pageMeta, setPageMeta] = useState<Partial<PageMetaFormData> | undefined>(undefined);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const [history, setHistory] = useState<PendingChange[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const proxyUrl = `/api/admin/visual-editor/proxy?page=${page}`;

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  }, []);

  // Load status & metadata on mount
  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/pages?page=${page}`).then(r => r.json()),
    ])
      .then(([data]) => {
        if (data.grouped && data.grouped._meta) {
          const meta = data.grouped._meta;
          setPageStatus((meta.status as PageStatus) || 'draft');
          setPageMeta({
            metaTitle: meta.meta_title || '',
            metaDescription: meta.meta_description || '',
            ogTitle: meta.og_title || '',
            ogDescription: meta.og_description || '',
            ogImage: meta.og_image || '',
            canonical: meta.canonical || '',
            robots: meta.robots || 'index, follow',
            noindex: meta.noindex === 'true',
            keywords: meta.keywords || '',
            slug: meta.slug || '',
            parent: meta.parent || '',
            sortOrder: meta.sort_order ? parseInt(meta.sort_order, 10) : 0,
            lang: meta.lang || 'es-HN',
          });
        }
      })
      .catch(() => {});
  }, [page]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 've:error') {
        console.warn('[PageVisualEditor] Iframe error:', event.data.message);
        return;
      }

      if (event.data?.type === 've:ready') {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        if (event.data.proxyError) {
          setLoading(false);
          setError(event.data.reason || 'El editor visual no pudo cargar la página.');
          return;
        }
        if (event.data.initError) {
          console.warn('[PageVisualEditor] Script init warning:', event.data.message);
        }
        setEditorReady(true);
        setLoading(false);
        return;
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
        return;
      }

      if (event.data?.type === 've:deselect') {
        setSelected(null);
        return;
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
        return;
      }
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (editorReady && loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, [editorReady]);

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
        if (res.ok) { success++; } else { error++; }
      } catch { error++; }
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

      toast.success(success === 1 ? 'Cambio guardado y publicado' : `${success} cambios guardados y publicados`);
    } else {
      setSaveStatus('error');
      toast.danger(`Guardado con ${error} errores (${success} correctos)`);
    }
  }, [pendingChanges, page, toast, historyIndex]);

  const handleUpdateContent = useCallback(
    (section: string, field: string, content: string) => {
      sendToIframe({ type: 've:set-content', section, field, content, isHtml: true });
    },
    [sendToIframe],
  );

  const handleStyle = useCallback(
    (style: Record<string, string | boolean>) => {
      sendToIframe({ type: 've:style', ...style });
    },
    [sendToIframe],
  );

  const handleClose = useCallback(() => {
    setSelected(null);
    sendToIframe({ type: 've:deselect' });
  }, [sendToIframe]);

  const handleUndo = useCallback(() => {
    setHistoryIndex((prev) => Math.max(-1, prev - 1));
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const handleRefresh = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setLoading(true);
    setEditorReady(false);
    setSelected(null);
    setPendingChanges([]);
    setError(null);
    setSaveStatus('idle');
    if (iframeRef.current) {
      iframeRef.current.src = proxyUrl;
    }
  }, [proxyUrl]);

  const handleStatusChange = async (newStatus: PageStatus) => {
    setStatusMenuOpen(false);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-status', page, status: newStatus }),
      });
      if (res.ok) {
        setPageStatus(newStatus);
        toast.success(`Página en estado: ${STATUS_META[newStatus].label}`);
      } else {
        toast.danger('Error al cambiar estado');
      }
    } catch {
      toast.danger('Error de red');
    }
  };

  const handleSaveMetadata = async (meta: PageMetaFormData) => {
    const res = await fetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, meta }),
    });
    if (!res.ok) throw new Error('Error al guardar metadatos');
    setPageMeta(meta);
  };

  const hasPending = pendingChanges.length > 0;
  const statusCfg = STATUS_META[pageStatus];

  // ─── Metadata Tab ────────────────────────────────────────
  if (editorTab === 'metadata') {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border-light flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setEditorTab('visual')}>
              <ArrowLeft size={14} /> Volver al editor
            </Button>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Metadatos · {pageLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <LayoutDashboard size={14} /> Volver al listado
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PageMetadataPanel
            page={page}
            initialData={pageMeta}
            onSave={handleSaveMetadata}
            onClose={() => setEditorTab('visual')}
          />
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={48} className="text-danger mb-4" />
        <p className="text-text-secondary text-sm mb-4 max-w-md text-center">{error}</p>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleRefresh}>Reintentar</Button>
          {onBack && <Button variant="ghost" size="sm" onClick={onBack}>Volver al listado</Button>}
        </div>
      </div>
    );
  }

  // ─── Visual Editor ───────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-border-light flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} title="Volver al listado">
              <ArrowLeft size={14} />
            </Button>
          )}
          <span className="text-xs font-semibold text-primary">{pageLabel}</span>

          {/* Status */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="flex items-center gap-1"
            >
              <Badge tone={statusCfg.tone} size="sm" className="cursor-pointer">
                {statusCfg.label}
              </Badge>
            </button>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-border-light rounded-md shadow-lg py-1 w-32">
                  {(['published', 'draft', 'inactive'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-surface-alt transition-colors',
                        s === pageStatus ? 'font-bold text-primary' : 'text-text-secondary',
                      )}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {hasPending && (
            <span className="flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full bg-accent/10 text-accent-dark font-medium">
              <FileText size={10} />
              {pendingChanges.length} cambio{pendingChanges.length !== 1 ? 's' : ''} pendiente{pendingChanges.length !== 1 ? 's' : ''}
            </span>
          )}
          {saveStatus === 'saved' && !hasPending && (
            <span className="flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
              <CheckCircle2 size={10} /> Guardado
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <button type="button" onClick={handleUndo} disabled={historyIndex < 0}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors disabled:opacity-30" title="Deshacer">
            <Undo2 size={14} />
          </button>
          <button type="button" onClick={handleRedo} disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors disabled:opacity-30" title="Rehacer">
            <Redo2 size={14} />
          </button>

          <span className="w-px h-4 bg-border-light mx-1" />

          {/* Preview toggle */}
          <button type="button" onClick={() => setPreviewMode(!previewMode)}
            className={cn('p-1.5 rounded transition-colors', previewMode ? 'bg-accent/15 text-accent-dark' : 'hover:bg-surface-alt text-text-muted hover:text-text')}
            title={previewMode ? 'Modo edición' : 'Vista previa pública'}>
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>

          {/* Refresh */}
          <button type="button" onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors" title="Recargar">
            <RefreshCw size={14} />
          </button>

          {/* View public page */}
          {publicRoute && (
            <a href={publicRoute} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors" title="Ver página pública">
              <Globe size={14} />
            </a>
          )}

          <span className="w-px h-4 bg-border-light mx-1" />

          {/* Metadata button */}
          <button type="button" onClick={() => setEditorTab('metadata')}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors" title="Metadatos y SEO">
            <List size={14} />
          </button>

          {/* Property panel toggle */}
          <button type="button" onClick={() => setPanelOpen(!panelOpen)}
            className={cn('p-1.5 rounded transition-colors', panelOpen ? 'bg-accent/15 text-accent-dark' : 'hover:bg-surface-alt text-text-muted hover:text-text')}
            title={panelOpen ? 'Cerrar panel' : 'Abrir panel'}>
            {panelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>

          {/* Save */}
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={!hasPending || saving} className="ml-2">
            <Save size={14} className="mr-1" /> Guardar todo
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn('flex-1 relative bg-[#f5f5f0]', previewMode && 'opacity-90')}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center"><Spinner /><p className="text-xs text-text-secondary mt-2">Cargando editor visual...</p></div>
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
                if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = setTimeout(() => {
                  if (!editorReady) {
                    setLoading(false);
                    setError('El editor no pudo inicializarse. Recarga la página.');
                  }
                }, 15000);
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
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xxs font-bold shadow-lg z-20">
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

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-white border-t border-border-light text-xxs text-text-muted flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers size={10} /> {page}
          </span>
          <span className="flex items-center gap-1">
            <Badge tone="success" size="sm">Publicado</Badge> Visible en web
          </span>
          <span className="flex items-center gap-1">
            Panel de propiedades {panelOpen ? 'abierto' : 'cerrado'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-success">
            <Upload size={10} /> Los cambios se guardan y publican sin deploy
          </span>
          {hasPending && (
            <span className="flex items-center gap-1 text-warning">
              <Download size={10} /> {pendingChanges.length} cambio{pendingChanges.length !== 1 ? 's' : ''} pendiente{pendingChanges.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
