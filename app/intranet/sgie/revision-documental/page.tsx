'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText, ShieldAlert, ScanLine, FileWarning,
  Ban, Copy, XCircle, AlertTriangle, FileCheck,
  Eye, ThumbsUp, FileX,
  ArrowLeft, Search, CheckSquare, Square, X, Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';

type FiltroRevision = 'baja_confianza' | 'ocr_insuficiente' | 'clasificacion_dudosa' | 'contradiccion' | 'ilegible' | 'duplicado' | 'rechazado' | 'error_tecnico' | null;

interface DocumentoRevision {
  id: string;
  nombre: string;
  expedienteId: string;
  numeroInterno: string;
  requisito: string;
  cliente: string;
  estado: string;
  confianza: number;
  fecha: string;
  tipoError: string;
}

// Estado aprobable: el doc puede entrar en un lote de aprobación.
const ESTADOS_APROBABLES = new Set(['pendiente_abogado', 'clasificado', 'ia_procesada']);

const FILTROS: { key: FiltroRevision; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'baja_confianza', label: 'Baja confianza', icon: ShieldAlert },
  { key: 'ocr_insuficiente', label: 'OCR insuficiente', icon: ScanLine },
  { key: 'clasificacion_dudosa', label: 'Clasificación dudosa', icon: FileWarning },
  { key: 'contradiccion', label: 'Contradicción', icon: AlertTriangle },
  { key: 'ilegible', label: 'Ilegible', icon: Ban },
  { key: 'duplicado', label: 'Duplicado', icon: Copy },
  { key: 'rechazado', label: 'Rechazado', icon: XCircle },
  { key: 'error_tecnico', label: 'Error técnico', icon: AlertTriangle },
];

function formatFecha(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function labelTipoError(tipo: string): string {
  const m: Record<string, string> = {
    baja_confianza: 'Baja confianza', ocr_insuficiente: 'OCR insuficiente',
    clasificacion_dudosa: 'Clasif. dudosa', contradiccion: 'Contradicción',
    ilegible: 'Ilegible', duplicado: 'Duplicado', rechazado: 'Rechazado', error_tecnico: 'Error técnico',
  };
  return m[tipo] || tipo;
}

function toneConfianza(confianza: number): string {
  if (confianza >= 80) return 'bg-success/10 text-success border-success/20';
  if (confianza >= 50) return 'bg-warning/10 text-warning border-warning/20';
  if (confianza > 0) return 'bg-danger/10 text-danger border-danger/20';
  return 'bg-surface-alt text-text-muted border-border';
}

// ─── P2-07: tipos UI para aprobación en bloque ──────────────────────────────
interface ItemPreviewUI {
  documentId: string;
  nombre: string;
  tipoDocumento: string | null;
  version: number;
  estadoActual: string;
  confianza: number | null;
  aprobable: boolean;
  codigoNoAprobable?: string;
  motivoNoAprobable?: string;
  accion: string;
}
interface ResultadoBulkUI {
  estado: string;
  aprobados: string[];
  yaAprobados: string[];
  rechazados: Array<{ documentId: string; codigo: string; motivo?: string }>;
  correlationId: string;
}

export default function RevisionDocumentalPage() {
  const { user, loading: authLoading } = useAuth();
  const [docs, setDocs] = useState<DocumentoRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroRevision>(null);
  const [accionId, setAccionId] = useState<string | null>(null);
  // P2-07: selección múltiple para aprobación en bloque.
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  // bulkApprovalFeature: si la flag está apagada, ocultar la UI de selección.
  const [bulkApprovalDisponible, setBulkApprovalDisponible] = useState<boolean | null>(null);
  // Modal de aprobación en bloque (preview → confirm → resultado).
  const [bulkModal, setBulkModal] = useState<{
    abierto: boolean;
    expedienteId: string | null;
    fase: 'preview' | 'confirmando' | 'resultado' | 'error';
    preview: ItemPreviewUI[] | null;
    previewHash: string | null;
    batchId: string | null;
    idempotencyKey: string;
    resultado: ResultadoBulkUI | null;
    error: string | null;
  }>({
    abierto: false, expedienteId: null, fase: 'preview',
    preview: null, previewHash: null, batchId: null,
    idempotencyKey: '', resultado: null, error: null,
  });

  // Comprobar disponibilidad de la feature flag (vía endpoint existente o flag).
  // Simplificación: asumimos disponible para roles admin/supervisor con SGIE.
  // La negación real ocurre en el servidor (servicio valida flag deny-by-default).
  useEffect(() => {
    if (user && (user.rol === 'admin' || user.rol === 'supervisor')) {
      setBulkApprovalDisponible(true);
    } else {
      setBulkApprovalDisponible(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/sgie/revision');
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) setDocs(json.documentos ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar documentos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtrados = filtroActivo
    ? docs.filter((d) => d.tipoError === filtroActivo)
    : docs;

  // Agrupar por expediente para la selección múltiple (bulk approval es por expediente).
  const docsPorExpediente = useMemo(() => {
    const m = new Map<string, DocumentoRevision[]>();
    for (const d of filtrados) {
      if (!m.has(d.expedienteId)) m.set(d.expedienteId, []);
      m.get(d.expedienteId)!.push(d);
    }
    return m;
  }, [filtrados]);

  const toggleSeleccion = useCallback((id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSeleccionExpediente = useCallback((expedienteId: string, docsExp: DocumentoRevision[]) => {
    const aprobables = docsExp.filter((d) => ESTADOS_APROBABLES.has(d.estado));
    const todosSel = aprobables.every((d) => seleccionados.has(d.id));
    setSeleccionados((prev) => {
      const next = new Set(prev);
      for (const d of aprobables) {
        if (todosSel) next.delete(d.id); else next.add(d.id);
      }
      return next;
    });
  }, [seleccionados]);

  // Abrir modal de bulk approval para un expediente.
  const abrirBulkPreview = useCallback(async (expedienteId: string) => {
    const idsExp = filtrados
      .filter((d) => d.expedienteId === expedienteId && seleccionados.has(d.id))
      .map((d) => d.id);
    if (idsExp.length === 0) return;
    setBulkModal({
      abierto: true, expedienteId, fase: 'preview',
      preview: null, previewHash: null, batchId: null,
      idempotencyKey: `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      resultado: null, error: null,
    });
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/documentos/bulk-approval/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: idsExp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setBulkModal((m) => ({
        ...m,
        preview: json.items,
        previewHash: json.previewHash,
        batchId: json.batchId,
      }));
    } catch (e) {
      setBulkModal((m) => ({ ...m, fase: 'error', error: e instanceof Error ? e.message : 'Error en preview' }));
    }
  }, [filtrados, seleccionados]);

  // Confirmar la aprobación del lote.
  const confirmarBulk = useCallback(async () => {
    if (!bulkModal.expedienteId || !bulkModal.batchId || !bulkModal.previewHash) return;
    setBulkModal((m) => ({ ...m, fase: 'confirmando' }));
    try {
      const res = await fetch(`/api/sgie/expedientes/${bulkModal.expedienteId}/documentos/bulk-approval/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: bulkModal.batchId,
          idempotencyKey: bulkModal.idempotencyKey,
          previewHash: bulkModal.previewHash,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setBulkModal((m) => ({ ...m, fase: 'resultado', resultado: json }));
      // Limpiar selección de los aprobados.
      setSeleccionados((prev) => {
        const next = new Set(prev);
        for (const id of [...(json.aprobados ?? []), ...(json.yaAprobados ?? [])]) next.delete(id);
        return next;
      });
    } catch (e) {
      setBulkModal((m) => ({ ...m, fase: 'error', error: e instanceof Error ? e.message : 'Error al confirmar' }));
    }
  }, [bulkModal]);

  const cerrarBulkModal = useCallback(() => {
    setBulkModal({
      abierto: false, expedienteId: null, fase: 'preview',
      preview: null, previewHash: null, batchId: null,
      idempotencyKey: '', resultado: null, error: null,
    });
  }, []);

  if (authLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }

  if (loading && docs.length === 0) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Revisión documental</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {docs.length} documentos requieren revisión
            {filtroActivo ? ` · ${labelTipoError(filtroActivo)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltroActivo(null)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xxs font-semibold border transition-colors',
            !filtroActivo
              ? 'bg-accent/15 text-accent-dark border-accent/30'
              : 'bg-surface text-text-secondary border-border-light hover:bg-surface-alt',
          )}
        >
          <Search size={12} /> Todos
        </button>
        {FILTROS.map((f) => {
          const active = filtroActivo === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFiltroActivo(active ? null : f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xxs font-semibold border transition-colors',
                active
                  ? 'bg-accent/15 text-accent-dark border-accent/30'
                  : 'bg-surface text-text-secondary border-border-light hover:bg-surface-alt',
              )}
            >
              <f.icon size={12} /> {f.label}
            </button>
          );
        })}
      </div>

      {filtrados.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<FileCheck size={28} />}
            title="Sin documentos pendientes"
            description={filtroActivo ? `No hay documentos con filtro "${labelTipoError(filtroActivo)}".` : 'Todos los documentos han sido revisados.'}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {bulkApprovalDisponible && Array.from(docsPorExpediente.entries()).map(([expId, docsExp]) => {
            const aprobablesExp = docsExp.filter((d) => ESTADOS_APROBABLES.has(d.estado));
            const selExp = aprobablesExp.filter((d) => seleccionados.has(d.id));
            return (
              <div key={expId} className="overflow-hidden bg-surface border border-border-light rounded-lg">
                {/* Toolbar por expediente con bulk approval */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-alt/40 border-b border-border-light">
                  <div className="flex items-center gap-2">
                    {bulkApprovalDisponible && aprobablesExp.length > 0 && (
                      <button
                        onClick={() => toggleSeleccionExpediente(expId, docsExp)}
                        className="inline-flex items-center gap-1 text-xxs font-semibold text-text-secondary hover:text-text"
                        aria-label={selExp.length === aprobablesExp.length ? 'Deseleccionar todos' : 'Seleccionar todos los elegibles'}
                      >
                        {selExp.length === aprobablesExp.length && aprobablesExp.length > 0
                          ? <CheckSquare size={14} className="text-accent-dark" />
                          : <Square size={14} />}
                        {selExp.length}/{aprobablesExp.length}
                      </button>
                    )}
                    <Link href={`/intranet/sgie/expedientes/${expId}`}
                      className="text-primary font-mono text-xs hover:underline">
                      {docsExp[0].numeroInterno}
                    </Link>
                    <span className="text-xxs text-text-muted">· {docsExp[0].cliente}</span>
                  </div>
                  {bulkApprovalDisponible && selExp.length > 0 && (
                    <button
                      onClick={() => abrirBulkPreview(expId)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xxs font-semibold bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors"
                    >
                      <ThumbsUp size={12} /> Aprobar {selExp.length} en bloque
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-light text-left bg-surface-alt/30">
                        {bulkApprovalDisponible && <th className="w-8 py-2.5 px-3"></th>}
                        <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Documento</th>
                        <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Requisito</th>
                        <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Motivo</th>
                        <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Confianza</th>
                        <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Fecha</th>
                        <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {docsExp.map((doc) => {
                        const elegible = ESTADOS_APROBABLES.has(doc.estado);
                        return (
                          <tr key={doc.id} className="hover:bg-surface-alt/30 transition-colors">
                            {bulkApprovalDisponible && (
                              <td className="py-2.5 px-3">
                                <button
                                  onClick={() => toggleSeleccion(doc.id)}
                                  disabled={!elegible}
                                  className="p-0.5 disabled:opacity-30"
                                  aria-label={seleccionados.has(doc.id) ? `Deseleccionar ${doc.nombre}` : `Seleccionar ${doc.nombre}`}
                                  aria-pressed={seleccionados.has(doc.id)}
                                >
                                  {seleccionados.has(doc.id)
                                    ? <CheckSquare size={16} className="text-accent-dark" />
                                    : <Square size={16} className="text-text-muted" />}
                                </button>
                              </td>
                            )}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-text-muted flex-shrink-0" />
                                <p className="font-medium text-text truncate max-w-[200px]" title={doc.nombre}>
                                  {doc.nombre}
                                </p>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-text-secondary">{doc.requisito}</td>
                            <td className="py-2.5 px-3">
                              <span className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border',
                                doc.tipoError === 'ilegible' || doc.tipoError === 'rechazado' || doc.tipoError === 'error_tecnico'
                                  ? 'bg-danger/10 text-danger border-danger/20'
                                  : doc.tipoError === 'baja_confianza' || doc.tipoError === 'ocr_insuficiente'
                                    ? 'bg-warning/10 text-warning border-warning/20'
                                    : 'bg-accent/10 text-accent-dark border-accent/20',
                              )}>
                                {labelTipoError(doc.tipoError)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border', toneConfianza(doc.confianza))}>
                                {doc.confianza > 0 ? `${doc.confianza}%` : 'N/A'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-text-muted">{formatFecha(doc.fecha)}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setAccionId(`aprobar-${doc.id}`)}
                                  disabled={accionId === `aprobar-${doc.id}`}
                                  className="p-1.5 rounded-md hover:bg-success/10 text-success transition-colors disabled:opacity-50"
                                  title="Aprobar documento"
                                >
                                  <ThumbsUp size={14} />
                                </button>
                                <button
                                  onClick={() => setAccionId(`rechazar-${doc.id}`)}
                                  disabled={accionId === `rechazar-${doc.id}`}
                                  className="p-1.5 rounded-md hover:bg-danger/10 text-danger transition-colors disabled:opacity-50"
                                  title="Rechazar documento"
                                >
                                  <FileX size={14} />
                                </button>
                                <button
                                  className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary transition-colors"
                                  title="Vista previa"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Si la flag bulk NO está disponible, mostrar tabla simple sin agrupar */}
          {!bulkApprovalDisponible && (
            <div className="overflow-x-auto bg-surface border border-border-light rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light text-left bg-surface-alt/50">
                    <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Documento</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Expediente</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Requisito</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Motivo</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Confianza</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Fecha</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filtrados.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-text-muted flex-shrink-0" />
                          <p className="font-medium text-text truncate max-w-[200px]" title={doc.nombre}>{doc.nombre}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Link href={`/intranet/sgie/expedientes/${doc.expedienteId}`} className="text-primary font-mono text-xs hover:underline">
                          {doc.numeroInterno}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-text-secondary">{doc.requisito}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border', toneConfianza(doc.confianza))}>
                          {labelTipoError(doc.tipoError)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-text-muted">{formatFecha(doc.fecha)}</td>
                      <td className="py-2.5 px-3">
                        <button onClick={() => setAccionId(`aprobar-${doc.id}`)} className="p-1.5 rounded-md hover:bg-success/10 text-success" title="Aprobar">
                          <ThumbsUp size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de aprobación en bloque (P2-07) */}
      {bulkModal.abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') cerrarBulkModal(); }}
        >
          <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
              <h2 id="bulk-modal-title" className="font-bold text-primary">
                Aprobación en bloque
              </h2>
              <button onClick={cerrarBulkModal} className="p-1 rounded hover:bg-surface-alt" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {bulkModal.fase === 'preview' && !bulkModal.preview && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 size={16} className="animate-spin" /> Generando preview…
                </div>
              )}
              {bulkModal.fase === 'preview' && bulkModal.preview && (
                <div className="space-y-2">
                  <p className="text-xs text-text-secondary">
                    Revisa el resumen antes de confirmar. Los documentos no elegibles se omitirán.
                  </p>
                  {bulkModal.preview.map((item) => (
                    <div key={item.documentId} className={cn(
                      'flex items-start gap-2 p-2 rounded border text-xs',
                      item.aprobable ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20',
                    )}>
                      {item.aprobable
                        ? <CheckSquare size={14} className="text-success mt-0.5" />
                        : <AlertTriangle size={14} className="text-warning mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text truncate">{item.nombre}</p>
                        {item.motivoNoAprobable && (
                          <p className="text-text-muted text-xxs mt-0.5">{item.motivoNoAprobable}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {bulkModal.fase === 'confirmando' && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 size={16} className="animate-spin" /> Confirmando aprobación…
                </div>
              )}
              {bulkModal.fase === 'resultado' && bulkModal.resultado && (
                <div className="space-y-3">
                  <p className={cn(
                    'font-semibold text-sm',
                    bulkModal.resultado.rechazados.length === 0 ? 'text-success' : 'text-warning',
                  )}>
                    {bulkModal.resultado.estado === 'confirmada'
                      ? `✓ ${bulkModal.resultado.aprobados.length} documento(s) aprobado(s).`
                      : `${bulkModal.resultado.aprobados.length} aprobados, ${bulkModal.resultado.rechazados.length} rechazados.`}
                  </p>
                  {bulkModal.resultado.yaAprobados.length > 0 && (
                    <p className="text-xxs text-text-muted">
                      {bulkModal.resultado.yaAprobados.length} ya estaban aprobados.
                    </p>
                  )}
                  {bulkModal.resultado.rechazados.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-danger">Rechazados:</p>
                      {bulkModal.resultado.rechazados.map((r) => (
                        <p key={r.documentId} className="text-xxs text-text-secondary">
                          · {r.documentId.slice(0, 8)}… — {r.codigo}: {r.motivo}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {bulkModal.fase === 'error' && (
                <p className="text-sm text-danger">{bulkModal.error}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-border-light">
              <button
                onClick={cerrarBulkModal}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-text-secondary hover:bg-surface-alt"
              >
                {bulkModal.fase === 'resultado' ? 'Cerrar' : 'Cancelar'}
              </button>
              {bulkModal.fase === 'preview' && bulkModal.preview && (
                <button
                  onClick={confirmarBulk}
                  disabled={bulkModal.preview.every((i) => !i.aprobable)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-success text-white hover:bg-success/90 disabled:opacity-50"
                >
                  <ThumbsUp size={12} /> Confirmar aprobación
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}
