'use client';

/**
 * SGIE — Modal de previsualización de documento (Sprint 2, tarea 4).
 *
 * Abre un modal que muestra el documento (PDF/imagen) vía la URL segura del
 * endpoint `/api/sgie/documentos/:id/preview`. No expone blobs públicos
 * directamente: la URL se obtiene tras validar scope en el backend.
 *
 * Si el storage no tiene URL (preview_not_available), muestra un mensaje
 * profesional y ofrece descargar metadatos.
 *
 * Sprint 2.
 */
import { useEffect, useState } from 'react';
import { X, FileText, AlertTriangle, Download } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { ExtraccionDocumento } from '@/components/sgie/extraccion-documento';
import { IaDocumento } from '@/components/sgie/ia-documento';
import { cn } from '@/lib/ui';

interface PreviewState {
  cargando: boolean;
  disponible: boolean;
  url: string | null;
  tipoMime: string | null;
  nombre: string | null;
  motivo: string | null;
  error: string | null;
}

export function DocumentoPreview({
  documentoId,
  onClose,
}: {
  documentoId: string | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<PreviewState>({
    cargando: false, disponible: false, url: null, tipoMime: null, nombre: null, motivo: null, error: null,
  });
  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(documentoId));

  useEffect(() => {
    if (!documentoId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset del estado de carga al abrir el preview
    setState({ cargando: true, disponible: false, url: null, tipoMime: null, nombre: null, motivo: null, error: null });
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`/api/sgie/documentos/${documentoId}/preview`, { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 403) throw new Error('Sin acceso al documento');
          if (res.status === 404) throw new Error('Documento no encontrado');
          throw new Error('No se pudo cargar la previsualización');
        }
        const data = await res.json();
        if (cancelado) return;
        if (data.disponible) {
          setState({ cargando: false, disponible: true, url: data.url, tipoMime: data.tipoMime, nombre: data.nombre, motivo: null, error: null });
        } else {
          setState({ cargando: false, disponible: false, url: null, tipoMime: null, nombre: data.nombre, motivo: data.motivo ?? 'preview_not_available', error: null });
        }
      } catch (err) {
        if (cancelado) return;
        setState({
          cargando: false, disponible: false, url: null, tipoMime: null, nombre: null, motivo: null,
          error: err instanceof Error ? err.message : 'Error desconocido',
        });
      }
    })();

    return () => { cancelado = true; };
  }, [documentoId]);

  useEffect(() => {
    if (!documentoId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [documentoId, onClose]);

  if (!documentoId) return null;

  const esImagen = state.tipoMime?.startsWith('image/');
  const esPdf = state.tipoMime === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Previsualización de documento"
        className="relative bg-surface rounded-lg shadow-xl border border-border-light w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-3 border-b border-border-light">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-accent-dark flex-shrink-0" />
            <p className="text-sm font-semibold text-text truncate">{state.nombre ?? 'Documento'}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-text flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto bg-surface-alt/30">
          {state.cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" />
              <p className="text-xs text-text-secondary mt-3">Cargando previsualización…</p>
            </div>
          ) : state.error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <AlertTriangle size={32} className="text-danger mb-3" />
              <p className="text-sm font-semibold text-text">No se pudo previsualizar</p>
              <p className="text-xs text-text-secondary mt-1">{state.error}</p>
            </div>
          ) : !state.disponible ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <FileText size={32} className="text-text-muted mb-3" />
              <p className="text-sm font-semibold text-text">Previsualización no disponible</p>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                El sistema de almacenamiento no proporciona una URL de previsualización para este documento.
                Esto puede ocurrir si el archivo aún se está procesando o si el storage no está configurado con URLs firmadas.
              </p>
            </div>
          ) : esImagen ? (
            <div className="flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.url!} alt={state.nombre ?? 'Documento'} className="max-w-full max-h-[70vh] rounded-md shadow-sm" />
            </div>
          ) : esPdf ? (
            <iframe src={state.url!} title={state.nombre ?? 'PDF'} className="w-full h-[70vh] border-0" />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <FileText size={32} className="text-text-muted mb-3" />
              <p className="text-sm font-semibold text-text">Tipo de archivo no previsualizable</p>
              <p className="text-xs text-text-secondary mt-1 mb-4">
                Los archivos <code className="font-mono text-text">{state.tipoMime ?? 'desconocido'}</code> no se pueden mostrar en el navegador.
              </p>
              <a href={state.url!} download={state.nombre ?? undefined} target="_blank" rel="noopener noreferrer"
                className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold',
                  'bg-primary text-accent hover:opacity-90 transition-opacity')}>
                <Download size={13} /> Descargar archivo
              </a>
            </div>
          )}
        </div>

        {/* Extracción documental — revisión asistente (Fase 3) */}
        <div className="border-t border-border-light p-3 max-h-[35vh] overflow-auto">
          <ExtraccionDocumento documentoId={documentoId} />
        </div>

        {/* Análisis IA — revisión humana (Fase 4) */}
        <div className="border-t border-border-light p-3 max-h-[35vh] overflow-auto">
          <IaDocumento documentoId={documentoId} />
        </div>
      </div>
    </div>
  );
}
