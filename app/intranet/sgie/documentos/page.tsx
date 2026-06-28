'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FileText, Search, RefreshCw, ChevronLeft, ChevronRight,
  Play, Eye, X, CheckCircle, AlertTriangle, Clock,
  Upload, Ban, FileCheck, Hash, FileWarning,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { DocumentoPreview } from '@/components/sgie/documento-preview';
import { cn } from '@/lib/ui';
import { traducirEstadoDocumento } from '@/lib/sgie/estados';

interface DocumentoItem {
  id: string;
  expedienteId: string;
  requisitoExpedienteId: string | null;
  nombreOriginal: string;
  tipoMime: string;
  tamañoBytes: number;
  estado: string;
  origen: string;
  tipoDocumento: string | null;
  subidoEn: string;
  procesadoEn: string | null;
  hashSha256: string | null;
  aprobadoEn: string | null;
  rechazadoEn: string | null;
  rechazoMotivo: string | null;
  numeroInterno: string | null;
  clienteNombre: string | null;
}

interface DocumentoDetalle {
  id: string;
  expedienteId: string;
  requisitoExpedienteId: string | null;
  requisitoNombre: string | null;
  nombreOriginal: string;
  nombreSaneado: string;
  tipoMime: string;
  tamañoBytes: number;
  hashSha256: string;
  estado: string;
  origen: string;
  tipoDocumento: string | null;
  subidoEn: string;
  procesadoEn: string | null;
  textoExtraido: string | null;
  confianzaClasificacion: number | null;
  evidenciasClasificacion: string[] | null;
  numeroInterno: string | null;
  clienteNombre: string | null;
  aprobadoEn: string | null;
  rechazadoEn: string | null;
  rechazoMotivo: string | null;
  metadata: Record<string, unknown> | null;
}

// Tonos semánticos alineados con el design system (tokens, no colores crudos).
// `neutral` reemplaza a `bg-gray-100`; el resto mapea a tokens semánticos.
const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  solicitado: { label: traducirEstadoDocumento('solicitado'), color: 'bg-surface-alt text-text-secondary border-border', icon: Clock },
  subido: { label: traducirEstadoDocumento('subido'), color: 'bg-info/10 text-info border-info/20', icon: Upload },
  clasificando: { label: traducirEstadoDocumento('clasificando'), color: 'bg-warning/10 text-warning border-warning/20', icon: RefreshCw },
  clasificado: { label: traducirEstadoDocumento('clasificado'), color: 'bg-info/10 text-info border-info/20', icon: FileCheck },
  texto_extraido: { label: traducirEstadoDocumento('texto_extraido'), color: 'bg-success/10 text-success border-success/20', icon: FileText },
  ocr_pendiente: { label: traducirEstadoDocumento('ocr_pendiente'), color: 'bg-warning/10 text-warning border-warning/20', icon: FileWarning },
  ilegible: { label: traducirEstadoDocumento('ilegible'), color: 'bg-danger/10 text-danger border-danger/20', icon: Ban },
  duplicado: { label: traducirEstadoDocumento('duplicado'), color: 'bg-accent/10 text-accent-dark border-accent/20', icon: Hash },
  incorrecto: { label: traducirEstadoDocumento('incorrecto'), color: 'bg-danger/10 text-danger border-danger/20', icon: X },
  vencido: { label: traducirEstadoDocumento('vencido'), color: 'bg-danger/10 text-danger border-danger/20', icon: Clock },
  ia_procesada: { label: traducirEstadoDocumento('ia_procesada'), color: 'bg-info/10 text-info border-info/20', icon: FileCheck },
  pendiente_abogado: { label: traducirEstadoDocumento('pendiente_abogado'), color: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
  aprobado: { label: traducirEstadoDocumento('aprobado'), color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  rechazado: { label: traducirEstadoDocumento('rechazado'), color: 'bg-danger/10 text-danger border-danger/20', icon: X },
};

function formatoBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatoFecha(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

async function apiCall(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (res.status === 401) throw new Error('No autorizado');
  return res.json();
}

export default function SgieDocumentosPage() {
  const { user, loading: authLoading } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroExpediente, setFiltroExpediente] = useState('');
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DocumentoDetalle | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const limit = 30;

  const cargarDocumentos = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filtroEstado) params.set('estado', filtroEstado);
      if (filtroExpediente) params.set('expedienteId', filtroExpediente);
      const data = await apiCall(`/api/sgie/documentos?${params}`);
      setDocumentos(data.documentos ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setFetching(false);
    }
  }, [page, filtroEstado, filtroExpediente]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!authLoading && user?.rol && (user.rol === 'abogado' || user.rol === 'admin') && !mounted.current) {
      mounted.current = true;
      cargarDocumentos();
    }
  }, [authLoading, user, cargarDocumentos]);

  const verDetalle = async (id: string) => {
    setDetalleId(id);
    setDetalleLoading(true);
    setDetalle(null);
    try {
      const data = await apiCall(`/api/sgie/documentos/${id}`);
      setDetalle(data.documento ?? null);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setDetalleLoading(false);
    }
  };

  const encolarProcesamiento = async (id: string) => {
    setProcesando(id);
    setMensaje(null);
    try {
      const data = await apiCall(`/api/sgie/documentos/${id}/procesar`, { method: 'POST' });
      setMensaje({ tipo: 'ok', texto: data.mensaje ?? 'Job encolado.' });
      cargarDocumentos();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setProcesando(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (authLoading) return <Spinner size="lg" />;
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-primary">Acceso restringido</p>
        <p className="text-sm text-text-secondary mt-2">Requiere rol de abogado o administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Documentos</h1>
          <p className="text-sm text-text-secondary mt-1">
            {total} documento{total !== 1 ? 's' : ''} — Motor documental SGIE
          </p>
        </div>
      </div>

      {mensaje && (
        <div className={cn(
          'p-3 rounded-md border text-sm flex items-center justify-between',
          mensaje.tipo === 'ok' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger',
        )}>
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-danger/10 border border-danger/20 text-danger text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="UUID expediente..."
            value={filtroExpediente}
            onChange={(e) => { setFiltroExpediente(e.target.value); setPage(1); }}
            className="h-9 pl-8 pr-3 rounded-md border border-border-light bg-surface text-sm w-64 font-mono"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-border-light bg-surface text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button onClick={cargarDocumentos} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-light text-sm text-text-secondary hover:bg-surface-alt transition-colors">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Tabla */}
      {fetching ? (
        <Spinner size="lg" />
      ) : documentos.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border-light rounded-lg">
          <FileText size={40} className="mx-auto text-text-muted mb-3" />
          <p className="font-semibold text-primary">Sin documentos</p>
          <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
            No se encontraron documentos{total > 0 ? ' con los filtros aplicados' : ''}. Los documentos aparecerán aquí cuando clientes carguen archivos mediante enlaces mágicos o abogados los suban directamente.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-surface border border-border-light rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-left bg-surface-alt/50">
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Documento</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Expediente</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Tipo</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Estado</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Tamaño</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Fecha</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Hash</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {documentos.map((doc) => {
                  const estadoConfig = ESTADO_CONFIG[doc.estado] ?? ESTADO_CONFIG.subido;
                  const EstadoIcon = estadoConfig.icon;
                  return (
                    <tr key={doc.id} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-text-muted flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-text truncate max-w-[200px]" title={doc.nombreOriginal}>
                              {doc.nombreOriginal}
                            </p>
                            <p className="text-xxs text-text-muted">{doc.tipoMime}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {doc.numeroInterno ? (
                          <Link href={`/intranet/sgie/expedientes/${doc.expedienteId}`} className="text-primary font-mono text-xs hover:underline">
                            {doc.numeroInterno}
                          </Link>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                        {doc.clienteNombre && (
                          <p className="text-xxs text-text-muted">{doc.clienteNombre}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-text-secondary">{doc.tipoDocumento || doc.origen}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-semibold border', estadoConfig.color)}>
                          <EstadoIcon size={11} />
                          {estadoConfig.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-text-secondary">
                        {formatoBytes(doc.tamañoBytes)}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-text-muted">
                        {formatoFecha(doc.subidoEn)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xxs text-text-muted font-mono" title={doc.hashSha256 ?? ''}>
                          {doc.hashSha256 || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => verDetalle(doc.id)}
                            className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={14} />
                          </button>
                          {(doc.estado === 'subido') && (
                            <button
                              onClick={() => encolarProcesamiento(doc.id)}
                              disabled={procesando === doc.id}
                              className="p-1.5 rounded-md hover:bg-accent/10 text-accent hover:text-accent-dark transition-colors disabled:opacity-50"
                              title="Procesar documento"
                            >
                              {procesando === doc.id ? <Spinner size="sm" /> : <Play size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-text-muted">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-1.5 rounded-md border border-border-light hover:bg-surface-alt disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-border-light hover:bg-surface-alt disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Panel de detalle */}
      {detalleId && (
        <div className="fixed inset-0 bg-overlay/50 z-50 flex items-start justify-center pt-20" onClick={() => setDetalleId(null)}>
          <div className="bg-surface border border-border-light rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-light">
              <h2 className="font-bold text-primary">Detalle del documento</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewId(detalleId)}
                  disabled={!detalle}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary text-accent hover:opacity-90 transition-opacity disabled:opacity-50"
                  title="Previsualizar documento"
                >
                  <Eye size={13} /> Previsualizar
                </button>
                <button onClick={() => setDetalleId(null)} className="p-1 hover:bg-surface-alt rounded">
                  <X size={18} className="text-text-muted" />
                </button>
              </div>
            </div>
            {detalleLoading ? (
              <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
            ) : detalle ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Nombre original</p>
                    <p className="text-text">{detalle.nombreOriginal}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Expediente</p>
                    <Link href={`/intranet/sgie/expedientes/${detalle.expedienteId}`}
                      className="text-primary font-mono text-xs hover:underline">
                      {detalle.numeroInterno || detalle.expedienteId}
                    </Link>
                    {detalle.clienteNombre && <p className="text-xxs text-text-muted">{detalle.clienteNombre}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Tipo MIME</p>
                    <p className="text-text">{detalle.tipoMime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Tamaño</p>
                    <p className="text-text">{formatoBytes(detalle.tamañoBytes)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Estado</p>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-semibold border',
                      (ESTADO_CONFIG[detalle.estado] ?? ESTADO_CONFIG.subido).color)}>
                      {detalle.estado}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Clasificación</p>
                    <p className="text-text">{detalle.tipoDocumento || 'Sin clasificar'}</p>
                    {detalle.confianzaClasificacion != null && (
                      <p className="text-xxs text-text-muted">Confianza: {detalle.confianzaClasificacion}%</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Hash SHA-256</p>
                    <p className="text-text font-mono text-xs break-all">{detalle.hashSha256}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-0.5">Cargado</p>
                    <p className="text-text text-xs">{formatoFecha(detalle.subidoEn)}</p>
                  </div>
                  {detalle.requisitoNombre && (
                    <div className="col-span-2">
                      <p className="text-xs text-text-muted font-semibold mb-0.5">Requisito</p>
                      <p className="text-text">{detalle.requisitoNombre}</p>
                    </div>
                  )}
                </div>

                {detalle.textoExtraido && (
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-1">Texto extraído (primeros 2000 caracteres)</p>
                    <div className="bg-background border border-border-light rounded-md p-3 max-h-60 overflow-y-auto">
                      <pre className="text-xs text-text whitespace-pre-wrap font-sans">{detalle.textoExtraido}</pre>
                    </div>
                  </div>
                )}

                {detalle.evidenciasClasificacion && detalle.evidenciasClasificacion.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted font-semibold mb-1">Evidencias de clasificación</p>
                    <ul className="space-y-0.5">
                      {detalle.evidenciasClasificacion.map((e, i) => (
                        <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                          <CheckCircle size={11} className="text-success mt-0.5 flex-shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(detalle.estado === 'subido' || detalle.estado === 'clasificando') && (
                  <div className="pt-2 border-t border-border-light">
                    <button
                      onClick={() => { encolarProcesamiento(detalle.id); }}
                      disabled={procesando === detalle.id}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-text-inverse font-semibold text-sm hover:bg-primary-light disabled:opacity-50 transition-colors"
                    >
                      {procesando === detalle.id ? <Spinner size="sm" /> : <Play size={14} />}
                      Procesar documento
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted text-sm">Documento no encontrado</div>
            )}
          </div>
        </div>
      )}

      <DocumentoPreview documentoId={previewId} onClose={() => setPreviewId(null)} />
    </div>
  );
}
