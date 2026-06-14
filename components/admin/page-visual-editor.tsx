'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Eye, EyeOff, Save, PanelRightOpen, PanelRightClose,
  RefreshCw, FileText, CheckCircle2, AlertTriangle, ArrowLeft,
  Globe, List, LayoutPanelLeft, Download,
  PenLine, BookOpen, Bug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { cn } from '@/lib/ui';
import { PageMetadataPanel, PageMetaFormData } from '@/components/admin/page-metadata-panel';
import { PropertyPanel, SelectedElement } from '@/components/admin/visual-editor-property-panel';
import { ComponentPanel } from '@/components/admin/visual-editor-component-panel';
import { type EditorComponentDef } from '@/lib/visual-editor/components';

interface PageVisualEditorProps {
  page: string;
  pageLabel: string;
  publicRoute?: string;
  onBack?: () => void;
  initialMeta?: Partial<PageMetaFormData>;
  onMetaUpdate?: (meta: Partial<PageMetaFormData>) => void;
}

interface PendingChange {
  section: string;
  field: string;
  content: string;
  timestamp: number;
}

interface BreadcrumbItem {
  tag: string;
  section: string;
}

interface DebugInfo {
  matchedCount: number;
  contentKeys: number;
  reverseMapSize: number;
  selectedTag: string | null;
  isEditing: boolean;
  listenerCount: number;
}

type EditorTab = 'visual' | 'metadata';
type PageStatus = 'published' | 'draft' | 'inactive';

const STATUS_META: Record<PageStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  published: { label: 'Publicado', tone: 'success' },
  draft: { label: 'Borrador', tone: 'warning' },
  inactive: { label: 'Inactivo', tone: 'danger' },
};

export function PageVisualEditor({ page, pageLabel, publicRoute, onBack, initialMeta, onMetaUpdate }: PageVisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [componentPanelOpen, setComponentPanelOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editorReady, setEditorReady] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('visual');
  const [pageStatus, setPageStatus] = useState<PageStatus>('draft');
  const [pageMeta, setPageMeta] = useState<Partial<PageMetaFormData> | undefined>(initialMeta);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveLockRef = useRef(false);
  const proxyUrl = `/api/admin/visual-editor/proxy?page=${page}`;

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, window.location.origin);
    }
  }, []);

  // Load page metadata once (not duplicated from parent)
  useEffect(() => {
    if (pageMeta) return; // Already loaded from parent
    fetch(`/api/admin/pages?page=${page}`)
      .then(r => r.json())
      .then(data => {
        if (data.grouped && data.grouped._meta) {
          const m = data.grouped._meta;
          setPageStatus((m.status as PageStatus) || 'draft');
          setPageMeta({
            metaTitle: m.meta_title || '',
            metaDescription: m.meta_description || '',
            ogTitle: m.og_title || '',
            ogDescription: m.og_description || '',
            ogImage: m.og_image || '',
            canonical: m.canonical || '',
            robots: m.robots || 'index, follow',
            noindex: m.noindex === 'true',
            keywords: m.keywords || '',
            slug: m.slug || '',
            parent: m.parent || '',
            sortOrder: m.sort_order ? parseInt(m.sort_order, 10) : 0,
            lang: m.lang || 'es-HN',
          });
          if (onMetaUpdate) onMetaUpdate({
            metaTitle: m.meta_title || '',
            metaDescription: m.meta_description || '',
            ogTitle: m.og_title || '',
            ogDescription: m.og_description || '',
            ogImage: m.og_image || '',
          });
        }
      })
      .catch(() => {});
  }, [page, pageMeta, onMetaUpdate]);

  // postMessage handler
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const d = event.data;
      if (!d?.type) return;

      switch (d.type) {
        case 've:error':
          console.warn('[VE] Iframe error:', d.message);
          break;
        case 've:ready':
          if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
          if (d.proxyError) { setLoading(false); setError(d.reason || 'Error al cargar la página.'); }
          else { setEditorReady(true); setLoading(false); }
          break;
        case 've:select':
          setSelected({
            page: d.page, section: d.section, field: d.field,
            content: d.content, isRichtext: d.isRichtext,
            tagName: d.tagName, className: d.className,
          });
          break;
        case 've:deselect':
          setSelected(null);
          break;
        case 've:breadcrumb':
          setBreadcrumbs(d.breadcrumbs ?? []);
          break;
        case 've:update': {
          const change: PendingChange = { section: d.section, field: d.field, content: d.content, timestamp: Date.now() };
          setPendingChanges(prev => {
            const filtered = prev.filter(c => !(c.section === change.section && c.field === change.field));
            return [...filtered, change];
          });
          setHasUnsavedChanges(true);
          setSaveStatus('idle');
          break;
        }
        case 've:element-removed':
        case 've:element-hidden':
        case 've:element-shown':
        case 've:element-moved':
        case 've:element-duplicated':
        case 've:component-inserted':
          setHasUnsavedChanges(true);
          setSaveStatus('idle');
          break;
        case 've:debug-info':
          setDebugInfo(d);
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  // Sync preview mode with iframe
  useEffect(() => {
    if (!editorReady) return;
    sendToIframe({ type: previewMode ? 've:preview' : 've:edit' });
  }, [previewMode, editorReady, sendToIframe]);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || pendingChanges.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges, pendingChanges]);

  // ─── BATCH SAVE (single POST with all changes) ───────────
  const handleSaveDraft = useCallback(async () => {
    if (pendingChanges.length === 0) { toast.info('No hay cambios pendientes'); return; }
    if (saveLockRef.current) { toast.warning('Ya se está guardando'); return; }

    saveLockRef.current = true;
    setSaving(true);
    setSaveStatus('saving');

    try {
      const res = await fetch('/api/admin/pages/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, changes: pendingChanges, publish: false }),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setPendingChanges([]);
        setHasUnsavedChanges(false);
        toast.success(`${pendingChanges.length} cambio${pendingChanges.length !== 1 ? 's' : ''} guardado${pendingChanges.length !== 1 ? 's' : ''} como borrador`);
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveStatus('error');
        toast.danger(err.error || 'Error al guardar');
      }
    } catch {
      setSaveStatus('error');
      toast.danger('Error de red al guardar');
    }
    setSaving(false);
    saveLockRef.current = false;
  }, [pendingChanges, page, toast]);

  const handlePublish = useCallback(async () => {
    if (pendingChanges.length === 0 && pageStatus === 'published') {
      toast.info('No hay cambios para publicar');
      return;
    }

    if (saveLockRef.current) { toast.warning('Ya se está guardando'); return; }

    const confirmed = await confirm({
      title: pageStatus === 'published' ? '¿Actualizar publicación?' : '¿Publicar página?',
      description: pageStatus === 'published'
        ? 'Los cambios se guardarán y la página actualizada será visible al público.'
        : 'Los cambios se guardarán y la página pasará a estado publicado.',
      tone: 'primary',
    });
    if (!confirmed) return;

    saveLockRef.current = true;
    setSaving(true);

    try {
      // Single batch save + publish
      const res = await fetch('/api/admin/pages/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          changes: pendingChanges,
          publish: true,
          newStatus: 'published',
        }),
      });

      if (res.ok) {
        setPageStatus('published');
        setPendingChanges([]);
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        toast.success('Página publicada exitosamente');
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveStatus('error');
        toast.danger(err.error || 'Error al publicar');
      }
    } catch {
      setSaveStatus('error');
      toast.danger('Error de red');
    }
    setSaving(false);
    saveLockRef.current = false;
  }, [pendingChanges, page, pageStatus, toast, confirm]);

  const handleUpdateContent = useCallback(
    (section: string, field: string, content: string) => {
      sendToIframe({ type: 've:set-content', section, field, content, isHtml: true });
    }, [sendToIframe]);

  const handleStyle = useCallback(
    (style: Record<string, string | boolean>) => sendToIframe({ type: 've:style', ...style }), [sendToIframe]);

  const handleClose = useCallback(() => {
    setSelected(null);
    sendToIframe({ type: 've:deselect' });
  }, [sendToIframe]);

  const handleRefresh = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setLoading(true);
    setEditorReady(false);
    setSelected(null);
    setBreadcrumbs([]);
    setPendingChanges([]);
    setError(null);
    setSaveStatus('idle');
    if (iframeRef.current) iframeRef.current.src = proxyUrl;
  }, [proxyUrl]);

  const handleStatusChange = async (newStatus: PageStatus) => {
    setStatusMenuOpen(false);
    if (newStatus === pageStatus) return;

    if (newStatus === 'draft' && pageStatus === 'published') {
      if (!await confirm({ title: '¿Despublicar página?', description: 'La página dejará de ser visible al público.', tone: 'warning' })) return;
    }
    if (newStatus === 'inactive') {
      if (!await confirm({ title: '¿Marcar como inactiva?', description: 'La página quedará oculta.', tone: 'warning' })) return;
    }

    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-status', page, status: newStatus }),
      });
      if (res.ok) {
        setPageStatus(newStatus);
        toast.success(`Página en estado: ${STATUS_META[newStatus].label}`);
      } else toast.danger('Error al cambiar estado');
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
    if (onMetaUpdate) onMetaUpdate(meta);
  };

  const handleInsertComponent = useCallback((component: EditorComponentDef) => {
    sendToIframe({ type: 've:insert-component', html: component.html, section: selected?.section ?? null });
    setHasUnsavedChanges(true);
    toast.info(`Componente "${component.name}" insertado`);
  }, [sendToIframe, selected, toast]);

  const handleRemove = useCallback((section: string) => { sendToIframe({ type: 've:remove-element', section }); setSelected(null); setHasUnsavedChanges(true); }, [sendToIframe]);
  const handleHide = useCallback((section: string) => { sendToIframe({ type: 've:hide-element', section }); setSelected(null); setHasUnsavedChanges(true); }, [sendToIframe]);
  const handleMoveUp = useCallback((section: string) => { sendToIframe({ type: 've:move-up', section }); setHasUnsavedChanges(true); }, [sendToIframe]);
  const handleMoveDown = useCallback((section: string) => { sendToIframe({ type: 've:move-down', section }); setHasUnsavedChanges(true); }, [sendToIframe]);
  const handleDuplicate = useCallback((section: string) => { sendToIframe({ type: 've:duplicate-element', section }); setHasUnsavedChanges(true); }, [sendToIframe]);
  const handleSelectAncestor = useCallback(() => { sendToIframe({ type: 've:select-ancestor' }); }, [sendToIframe]);
  const handleSelectDescendant = useCallback(() => { sendToIframe({ type: 've:select-descendant' }); }, [sendToIframe]);
  const handleRefreshDebug = useCallback(() => { sendToIframe({ type: 've:get-debug-info' }); }, [sendToIframe]);

  const hasPending = pendingChanges.length > 0;
  const statusCfg = STATUS_META[pageStatus];

  // ─── Metadata Tab ────────────────────────────────────────
  if (editorTab === 'metadata') {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border-light flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setEditorTab('visual')}>
              <ArrowLeft size={14} /> Volver al editor
            </Button>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Metadatos · {pageLabel}</span>
          </div>
          {onBack && <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={14} /> Volver al listado</Button>}
        </div>
        <div className="flex-1 overflow-y-auto">
          <PageMetadataPanel page={page} initialData={pageMeta} onSave={handleSaveMetadata} onClose={() => setEditorTab('visual')} />
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
      {/* ── Top Bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-border-light flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={async () => {
              if (hasUnsavedChanges || hasPending) {
                if (!await confirm({ title: '¿Salir sin guardar?', description: 'Tenés cambios sin guardar.', tone: 'warning' })) return;
              }
              onBack();
            }} title="Volver al listado">
              <ArrowLeft size={14} />
            </Button>
          )}
          <span className="text-xs font-semibold text-primary truncate">{pageLabel}</span>

          {/* Status badge (only current) */}
          <div className="relative">
            <button onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="flex items-center gap-1">
              <Badge tone={statusCfg.tone} size="sm" className="cursor-pointer">{statusCfg.label}</Badge>
            </button>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-border-light rounded-md shadow-lg py-1 w-36">
                  {(['published', 'draft', 'inactive'] as const).map((s) => (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      className={cn('w-full text-left px-3 py-1.5 text-xs hover:bg-surface-alt transition-colors',
                        s === pageStatus ? 'font-bold text-primary' : 'text-text-secondary')}>
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status indicators */}
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
              <FileText size={10} /> Sin guardar
            </span>
          )}
          {hasPending && (
            <span className="flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full bg-accent/10 text-accent-dark font-medium">
              <PenLine size={10} /> {pendingChanges.length} pendiente{pendingChanges.length !== 1 ? 's' : ''}
            </span>
          )}
          {saveStatus === 'saved' && !hasPending && !hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
              <CheckCircle2 size={10} /> Guardado
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Edit/Preview toggle */}
          <button type="button" onClick={() => setPreviewMode(!previewMode)}
            className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xxs font-semibold transition-colors',
              previewMode ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-accent/10 text-accent-dark border border-accent/20')}
            title={previewMode ? 'Volver a modo edición' : 'Activar vista previa'}>
            {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {previewMode ? 'Previsualizar' : 'Editar'}
          </button>

          <span className="w-px h-4 bg-border-light mx-1" />

          {/* Component panel toggle */}
          <button type="button" onClick={() => setComponentPanelOpen(!componentPanelOpen)}
            className={cn('p-1.5 rounded transition-colors', componentPanelOpen ? 'bg-accent/15 text-accent-dark' : 'hover:bg-surface-alt text-text-muted hover:text-text')}
            title={componentPanelOpen ? 'Cerrar componentes' : 'Abrir componentes'}>
            <LayoutPanelLeft size={14} />
          </button>

          {/* Property panel toggle */}
          <button type="button" onClick={() => setPanelOpen(!panelOpen)}
            className={cn('p-1.5 rounded transition-colors', panelOpen ? 'bg-accent/15 text-accent-dark' : 'hover:bg-surface-alt text-text-muted hover:text-text')}
            title={panelOpen ? 'Cerrar panel' : 'Abrir panel'}>
            {panelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>

          <span className="w-px h-4 bg-border-light mx-1" />

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

          {/* Metadata */}
          <button type="button" onClick={() => setEditorTab('metadata')}
            className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors" title="Metadatos y SEO">
            <List size={14} />
          </button>

          {/* Debug toggle */}
          <button type="button" onClick={() => { setDebugOpen(!debugOpen); if (!debugOpen) handleRefreshDebug(); }}
            className={cn('p-1.5 rounded transition-colors', debugOpen ? 'bg-warning/15 text-warning' : 'hover:bg-surface-alt text-text-muted hover:text-text')}
            title="Diagnóstico del editor">
            <Bug size={14} />
          </button>

          <span className="w-px h-4 bg-border-light mx-1" />

          {/* Save Draft */}
          <Button variant="secondary" size="sm" onClick={handleSaveDraft}
            disabled={!hasPending || saving || previewMode}
            title="Guardar como borrador (no afecta la web pública)">
            <Save size={14} className="mr-1" /> Borrador
          </Button>

          {/* Publish */}
          <Button variant="primary" size="sm" onClick={handlePublish}
            disabled={(!hasPending && pageStatus === 'published') || saving || previewMode}
            loading={saving}>
            <Globe size={14} className="mr-1" />
            {pageStatus === 'published' ? 'Actualizar' : 'Publicar'}
          </Button>
        </div>
      </div>

      {/* ── Editor Area ──────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {componentPanelOpen && (
          <ComponentPanel isOpen={componentPanelOpen} onToggle={() => setComponentPanelOpen(false)} onInsertComponent={handleInsertComponent} />
        )}

        <div className={cn('flex-1 relative bg-[#f5f5f0]', previewMode && 'opacity-95')}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center"><Spinner /><p className="text-xs text-text-secondary mt-2">Cargando editor visual...</p></div>
            </div>
          )}

          <iframe ref={iframeRef} src={proxyUrl}
            className="w-full h-full border-0"
            title={`Editor: ${pageLabel}`}
            sandbox="allow-same-origin allow-scripts"
            onLoad={() => {
              if (!editorReady) {
                if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = setTimeout(() => {
                  if (!editorReady) { setLoading(false); setError('El editor no pudo inicializarse. Recargá la página.'); }
                }, 15000);
              }
            }}
            onError={() => { setLoading(false); setError('Error al cargar la página.'); }}
          />

          {!loading && !editorReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center max-w-sm"><Spinner /><p className="text-xs text-text-secondary mt-2">Inicializando editor...</p></div>
            </div>
          )}
        </div>

        {panelOpen && (
          <div className="w-80 flex-shrink-0 overflow-hidden border-l border-border-light">
            <PropertyPanel selected={selected} breadcrumbs={breadcrumbs}
              onUpdateContent={handleUpdateContent} onStyle={handleStyle} onClose={handleClose}
              onRemove={handleRemove} onHide={handleHide}
              onMoveUp={handleMoveUp} onMoveDown={handleMoveDown} onDuplicate={handleDuplicate}
              onSelectAncestor={handleSelectAncestor} onSelectDescendant={handleSelectDescendant} />
          </div>
        )}
      </div>

      {/* ── Bottom Bar ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1 bg-white border-t border-border-light text-xxs text-text-muted flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><BookOpen size={10} /> {page}</span>
          <Badge tone={statusCfg.tone} size="sm">{statusCfg.label}</Badge>
          <span>Modo: {previewMode ? 'Previsualización' : 'Edición'}</span>
        </div>
        <div className="flex items-center gap-2">
          {debugOpen && debugInfo && (
            <span className="flex items-center gap-2 text-xxs">
              <span>Match: {debugInfo.matchedCount}</span>
              <span>Keys: {debugInfo.contentKeys}</span>
              <span>Listeners: {debugInfo.listenerCount}</span>
            </span>
          )}
          {hasPending && (
            <span className="flex items-center gap-1 text-warning">
              <Download size={10} /> {pendingChanges.length} pendiente{pendingChanges.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
