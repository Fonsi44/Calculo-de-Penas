'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, FileCheck, CheckCircle2, Clock, History,
  ListChecks, ShieldCheck, AlertTriangle, Loader2, FileText,
  CheckCircle, XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { usePromptDialog } from '@/components/ui/prompt-dialog';
import { EnlacesExpediente } from '@/components/sgie/enlaces-expediente';
import { SeguimientoDocumental } from '@/components/sgie/seguimiento-documental';
import { ReadinessExpediente } from '@/components/sgie/readiness-expediente';
import { InteligenciaExpediente } from '@/components/sgie/inteligencia-expediente';
import { cn } from '@/lib/ui';
import { traducirEstadoExpediente, traducirEstadoDocumento } from '@/lib/sgie/estados';

interface Requisito {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  confirmado: boolean | null;
}
interface HistorialItem {
  id: string;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  actorTipo: string;
  actorNombre: string | null;
  mensaje: string | null;
  creadoEn: string | null;
}
interface Detalle {
  id: string;
  numeroInterno: string;
  estado: string;
  prioridad: string;
  area: string | null;
  resumen: string | null;
  clienteNombre: string | null;
  tipoProcedimientoNombre: string | null;
  procedimientoVersion: number | null;
  responsableNombre: string | null;
  creadoEn: string | null;
  requisitos: Requisito[];
  historial: HistorialItem[];
  documentos?: DocumentoItem[];
  alertas?: AlertaItem[];
}

interface DocumentoItem {
  id: string;
  nombreOriginal: string;
  tipoMime: string;
  tamañoBytes: number;
  estado: string;
  tipoDocumento: string | null;
  subidoEn: string;
  hashSha256: string | null;
}

interface AlertaItem {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  mensaje: string | null;
  resuelta: boolean;
}

// Estados siguientes hacia los que el abogado puede avanzar (acciones críticas).
const TRANSICIONES_CRITICAS: Array<{ estado: string; label: string; descripcion: string }> = [
  { estado: 'validado', label: 'Validar expediente', descripcion: 'Marca el expediente como validado. Acción crítica del abogado.' },
  { estado: 'pendiente_de_firma', label: 'Enviar a firma', descripcion: 'El expediente queda pendiente de firma. Acción crítica del abogado.' },
  { estado: 'en_tramite', label: 'Marcar en trámite', descripcion: 'Inicia el trámite del expediente.' },
  { estado: 'finalizado', label: 'Finalizar expediente', descripcion: 'Cierra el expediente. Acción irreversible del abogado.' },
];

export default function SgieExpedienteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const promptDialog = usePromptDialog();
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const fetchDetalle = useCallback(async () => {
    setLoading(true);
    setNoEncontrado(false);
    try {
      const res = await fetch(`/api/sgie/expedientes/${params.id}`);
      if (res.status === 404) { setNoEncontrado(true); return; }
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setDetalle(data.expediente);
    } catch {
      toast.danger('Error al cargar el expediente');
      setNoEncontrado(true);
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [alertasList, setAlertasList] = useState<AlertaItem[]>([]);
  const [accionDocId, setAccionDocId] = useState<string | null>(null);

  const fetchDocumentosAlertas = useCallback(async () => {
    try {
      const [docRes, alertRes] = await Promise.all([
        fetch(`/api/sgie/documentos?expedienteId=${params.id}&limit=50`),
        fetch(`/api/sgie/expedientes/${params.id}/alertas`),
      ]);
      if (docRes.ok) { const d = await docRes.json(); setDocumentos(d.documentos ?? []); }
      if (alertRes.ok) { const a = await alertRes.json(); setAlertasList(a.alertas ?? []); }
    } catch { /* non-critical */ }
  }, [params.id]);

  useEffect(() => { const run = async () => { await fetchDetalle(); await fetchDocumentosAlertas(); }; run(); }, [fetchDetalle, fetchDocumentosAlertas]);

  const handleAprobarDoc = async (docId: string) => {
    setAccionDocId(docId);
    try {
      const res = await fetch(`/api/sgie/documentos/${docId}/aprobar`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Documento aprobado');
      fetchDocumentosAlertas();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setAccionDocId(null); }
  };

  const handleRechazarDoc = async (docId: string) => {
    // Sustituye a prompt() nativo (Sprint 0, tarea 3). Modal accesible del
    // design system con validación de longitud y estado de carga.
    const motivo = await promptDialog({
      title: 'Rechazar documento',
      description: 'Indique el motivo del rechazo. El cliente recibirá esta justificación.',
      placeholder: 'Ej.: Documento ilegible, no corresponde al requisito solicitado…',
      confirmLabel: 'Rechazar documento',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      minLength: 1,
      maxLength: 500,
      multiline: true,
    });
    if (motivo === null) return; // cancelado
    setAccionDocId(docId);
    try {
      const res = await fetch(`/api/sgie/documentos/${docId}/rechazar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motivo }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Documento rechazado', motivo.slice(0, 80) + (motivo.length > 80 ? '…' : ''));
      fetchDocumentosAlertas();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setAccionDocId(null); }
  };

  const handleResolverAlerta = async (alertaId: string) => {
    try {
      const res = await fetch(`/api/sgie/alertas/${alertaId}/resolver`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchDocumentosAlertas();
    } catch { /* */ }
  };

  const handleConfirmarChecklist = async () => {
    const ok = await confirm({
      title: 'Confirmar checklist',
      description: 'Se marcarán todos los requisitos como confirmados y el expediente pasará a pendiente de documentos. Desde aquí el sistema podrá operar la solicitud documental.',
    });
    if (!ok) return;
    setAccionEnCurso('checklist');
    try {
      const res = await fetch(`/api/sgie/expedientes/${params.id}/checklist/confirmar`, { method: 'POST' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Checklist confirmado');
      fetchDetalle();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al confirmar checklist');
    } finally {
      setAccionEnCurso(null);
    }
  };

  const handleTransicion = async (estadoDestino: string, label: string, descripcion: string) => {
    const ok = await confirm({
      title: label,
      description: descripcion + ' Quedará registrado en el historial y en auditoría.',
      tone: estadoDestino === 'finalizado' ? 'warning' : 'primary',
    });
    if (!ok) return;
    setAccionEnCurso(estadoDestino);
    try {
      const res = await fetch(`/api/sgie/expedientes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoDestino }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Estado actualizado');
      fetchDetalle();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al cambiar estado');
    } finally {
      setAccionEnCurso(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (noEncontrado || !detalle) {
    return (
      <Card padding="md">
        <EmptyState
          icon={<AlertTriangle size={28} />}
          title="Expediente no disponible"
          description="No tiene acceso a este expediente o no existe. Verifique el enlace o contacte con administración."
          action={<Button variant="primary" size="sm" onClick={() => router.push('/intranet/sgie/expedientes')}>Volver a expedientes</Button>}
        />
      </Card>
    );
  }

  const checklistConfirmado = detalle.requisitos.length > 0 && detalle.requisitos.every((r) => r.confirmado);

  return (
    <div className="space-y-4">
      <PageHeader
        title={detalle.numeroInterno}
        subtitle={`${detalle.clienteNombre ?? 'Sin cliente'} · ${detalle.tipoProcedimientoNombre ?? 'Sin procedimiento'}`}
        metadata={`Responsable: ${detalle.responsableNombre ?? '—'} · Creado: ${formatFecha(detalle.creadoEn)}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push('/intranet/sgie/expedientes')}>
            <ArrowLeft size={14} /> Volver
          </Button>
        }
      />

      {/* Resumen ejecutivo */}
      <Card padding="md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <p className="text-xxs uppercase tracking-wider text-text-muted">Estado</p>
            <EstadoBadge estado={detalle.estado} />
          </div>
          <div>
            <p className="text-xxs uppercase tracking-wider text-text-muted">Prioridad</p>
            <p className="text-sm font-bold text-text capitalize">{detalle.prioridad}</p>
          </div>
          <div>
            <p className="text-xxs uppercase tracking-wider text-text-muted">Área</p>
            <p className="text-sm text-text">{detalle.area ?? '—'}</p>
          </div>
          <div>
            <p className="text-xxs uppercase tracking-wider text-text-muted">Versión proc.</p>
            <p className="text-sm text-text">{detalle.procedimientoVersion ?? '—'}</p>
          </div>
        </div>
        {detalle.resumen && (
          <div>
            <p className="text-xxs uppercase tracking-wider text-text-muted mb-1">Resumen</p>
            <p className="text-sm text-text">{detalle.resumen}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Checklist documental */}
        <Card padding="none">
          <div className="flex items-center justify-between p-3 border-b border-border-light">
            <div className="flex items-center gap-2">
              <ListChecks size={16} className="text-accent-dark" />
              <h2 className="text-sm font-bold text-text">Checklist documental</h2>
            </div>
            {!checklistConfirmado && (
              <Button
                variant="secondary"
                size="sm"
                loading={accionEnCurso === 'checklist'}
                onClick={handleConfirmarChecklist}
              >
                Confirmar checklist
              </Button>
            )}
          </div>
          {detalle.requisitos.length === 0 ? (
            <div className="p-4">
              <p className="text-sm text-text-secondary">No hay requisitos definidos para este expediente.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-light">
              {detalle.requisitos.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3">
                  <div className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0',
                    r.confirmado ? 'bg-success/10 text-success' : 'bg-surface-alt text-text-muted',
                  )}>
                    {r.confirmado ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text">{r.nombre}</p>
                    <p className="text-xxs text-text-muted capitalize">
                      {r.tipo} · estado: {r.estado.replace(/_/g, ' ')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="p-3 bg-surface-alt/50 text-xxs text-text-muted rounded-b-lg">
            <FileCheck size={10} className="inline mr-1" />
            {checklistConfirmado ? 'Checklist confirmado. Documentos listos para recibir.' : 'Confirme el checklist para habilitar la recepción de documentos.'}
          </div>
        </Card>

        {/* Historial */}
        <Card padding="none">
          <div className="flex items-center gap-2 p-3 border-b border-border-light">
            <History size={16} className="text-accent-dark" />
            <h2 className="text-sm font-bold text-text">Historial del expediente</h2>
          </div>
          {detalle.historial.length === 0 ? (
            <div className="p-4">
              <p className="text-sm text-text-secondary">Sin eventos registrados.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-light max-h-80 overflow-y-auto">
              {detalle.historial.map((h) => (
                <li key={h.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text">{formatAccion(h.accion)}</span>
                    <span className="text-xxs text-text-muted">· {h.actorTipo}</span>
                  </div>
                  {(h.estadoAnterior || h.estadoNuevo) && (
                    <p className="text-xxs text-text-secondary mt-0.5">
                      {h.estadoAnterior ?? '—'} → {h.estadoNuevo ?? '—'}
                    </p>
                  )}
                  {h.mensaje && <p className="text-xxs text-text-muted mt-0.5">{h.mensaje}</p>}
                  <p className="text-xxs text-text-muted mt-0.5">{formatFechaHora(h.creadoEn)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Documentos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="none">
          <div className="flex items-center justify-between p-3 border-b border-border-light">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-accent-dark" />
              <h2 className="text-sm font-bold text-text">Documentos ({documentos.length})</h2>
            </div>
          </div>
          {documentos.length === 0 ? (
            <div className="p-4"><p className="text-sm text-text-secondary">Sin documentos cargados.</p></div>
          ) : (
            <ul className="divide-y divide-border-light max-h-80 overflow-y-auto">
              {documentos.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-3">
                  <FileText size={16} className="text-text-muted flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text truncate">{d.nombreOriginal}</p>
                    <p className="text-xxs text-text-muted">{d.tipoDocumento || d.tipoMime} · {formatEstadoDoc(d.estado)}</p>
                  </div>
                  {d.estado === 'pendiente_abogado' && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleAprobarDoc(d.id)} disabled={accionDocId === d.id}
                        className="p-1 rounded hover:bg-success/10 text-success" title="Aprobar">
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => handleRechazarDoc(d.id)} disabled={accionDocId === d.id}
                        className="p-1 rounded hover:bg-danger/10 text-danger" title="Rechazar">
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="none">
          <div className="flex items-center justify-between p-3 border-b border-border-light">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-accent-dark" />
              <h2 className="text-sm font-bold text-text">Alertas ({alertasList.filter(a => !a.resuelta).length})</h2>
            </div>
          </div>
          {alertasList.length === 0 ? (
            <div className="p-4"><p className="text-sm text-text-secondary">Sin alertas.</p></div>
          ) : (
            <ul className="divide-y divide-border-light max-h-80 overflow-y-auto">
              {alertasList.map((a) => (
                <li key={a.id} className={cn('p-3', a.resuelta && 'opacity-50')}>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-semibold', severidadColor(a.severidad))}>{a.titulo}</span>
                    {!a.resuelta && (
                      <button onClick={() => handleResolverAlerta(a.id)} className="text-xxs text-accent hover:underline">Resolver</button>
                    )}
                  </div>
                  {a.mensaje && <p className="text-xxs text-text-muted mt-0.5">{a.mensaje}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Enlaces de carga documental (Sprint 1) */}
      <EnlacesExpediente expedienteId={detalle.id} />

      {/* Seguimiento documental — recordatorios, estado documental, bloqueo (Fase 2) */}
      <SeguimientoDocumental expedienteId={detalle.id} />

      {/* Preparación documental — puerta "Listo para revisión" (Fase 5) */}
      <ReadinessExpediente expedienteId={detalle.id} />

      {/* Inteligencia del expediente (Sprint 3) */}
      <InteligenciaExpediente expedienteId={detalle.id} />

      {/* Acciones críticas del abogado */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-accent-dark" />
          <h2 className="text-sm font-bold text-text">Acciones del abogado</h2>
        </div>
        <p className="text-xs text-text-secondary mb-3">
          Las transiciones críticas requieren su acción explícita. El sistema nunca valida, firma ni cierra un expediente automáticamente.
        </p>
        <div className="flex flex-wrap gap-2">
          {TRANSICIONES_CRITICAS.map((t) => {
            const esActual = detalle.estado === t.estado;
            return (
              <Button
                key={t.estado}
                variant={esActual ? 'ghost' : 'secondary'}
                size="sm"
                disabled={esActual}
                loading={accionEnCurso === t.estado}
                onClick={() => handleTransicion(t.estado, t.label, t.descripcion)}
              >
                {accionEnCurso === t.estado ? <Loader2 size={14} className="animate-spin" /> : <FileCheck size={14} />}
                {esActual ? `${t.label} (actual)` : t.label}
              </Button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const tono = (() => {
    if (estado === 'validado' || estado === 'finalizado' || estado === 'archivado') return 'success';
    if (estado === 'pendiente_validacion_abogado' || estado === 'analisis_completado') return 'info';
    if (estado.includes('inconsisten') || estado === 'pendiente_de_firma') return 'warning';
    return 'neutral';
  })();
  const tonoClass = {
    success: 'bg-success/10 text-success border-success/20',
    info: 'bg-info/10 text-info border-info/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    neutral: 'bg-surface-alt text-text-secondary border-border',
  }[tono];
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border whitespace-nowrap', tonoClass)}>
      {traducirEstadoExpediente(estado)}
    </span>
  );
}

function formatFecha(d: string | null): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function formatFechaHora(d: string | null): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('es-HN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}
function formatAccion(accion: string): string {
  return accion.replace(/_/g, ' ');
}

function formatEstadoDoc(estado: string): string {
  return traducirEstadoDocumento(estado);
}

function severidadColor(s: string): string {
  const map: Record<string, string> = { info: 'text-info', advertencia: 'text-warning', error: 'text-danger', critico: 'text-danger font-bold' };
  return map[s] || 'text-text-secondary';
}
