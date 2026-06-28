'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FolderKanban, FileText, AlertTriangle, CheckSquare,
  Mail, FileCheck, ClipboardList, FolderOpen, Scale,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';

interface ExpedienteItem {
  id: string;
  numeroInterno: string;
  estado: string;
  prioridad: string;
  clienteNombre: string | null;
  responsableNombre: string | null;
  tipoProcedimientoNombre: string | null;
  actualizadoEn: string | null;
}

interface CockpitData {
  expedientes: ExpedienteItem[];
  total: number;
  metricas: {
    listosRevisar: number;
    conFaltantes: number;
    listosFirma: number;
    alertasActivas: number;
    tareasHoy: number;
    documentosPendientes: number;
    correosFallidos: number;
    total: number;
  };
}

const _ESTADOS_LISTOS_REVISAR = new Set(['pendiente_validacion_abogado', 'analisis_completado']);
const _ESTADOS_CON_FALTANTES = new Set(['pendiente_de_documentos', 'enlace_enviado', 'documentos_parcialmente_recibidos', 'inconsistencias_detectadas']);
const _ESTADO_FIRMA = 'pendiente_de_firma';

interface CockpitAvanzado {
  tendenciaPorEstado: { estado: string; n: number }[];
  tareasVencidasPorResponsable: { responsableId: string; nombre: string; n: number }[];
  documentosPendientes: number;
  alertasCriticas: number;
  cuellosDeBotella: Array<{ id: string; numeroInterno: string; estado: string; actualizadoEn: string | null }>;
  eventosProximos: Array<{ id: string; titulo: string; fecha: string; estado: string }>;
}

export default function SgieCockpitPage() {
  const { user } = useAuth();
  const [data, setData] = useState<CockpitData | null>(null);
  const [avanzado, setAvanzado] = useState<CockpitAvanzado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [res, resAv] = await Promise.all([
        fetch('/api/sgie/cockpit', { credentials: 'include' }),
        fetch('/api/sgie/cockpit/avanzado', { credentials: 'include' }),
      ]);
      if (!res.ok) throw new Error('Error al cargar');
      setData(await res.json());
      if (resAv.ok) setAvanzado(await resAv.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; fetchData(); }
  }, [fetchData]);

  const m = data?.metricas;
  const expedientes = data?.expedientes ?? [];

  const prioridadTone = (p: string) => {
    switch (p) {
      case 'urgente': return 'text-danger';
      case 'alta': return 'text-warning';
      default: return 'text-text-muted';
    }
  };

  const formatFecha = (d: string | null) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' }); }
    catch { return ''; }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Cockpit del abogado</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {user?.rol === 'admin' ? 'Vista de supervisión — todos los expedientes.' : `Bienvenido/a, ${user?.nombre || user?.email}.`}
        </p>
      </div>

      {error && (
        <EmptyState icon={<AlertTriangle size={28} />} title="Error al cargar" description="Verifique su conexión."
          action={<Button variant="secondary" size="sm" onClick={fetchData}>Reintentar</Button>} />
      )}

      {/* Tarjetas de señales */}
      {m && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <SignalCard icon={<FolderOpen size={16} />} label="Listos para revisar" value={m.listosRevisar} tone="info" href="/intranet/sgie/expedientes" />
          <SignalCard icon={<FileText size={16} />} label="Faltan documentos" value={m.conFaltantes} tone="warning" href="/intranet/sgie/expedientes" />
          <SignalCard icon={<FileCheck size={16} />} label="Listos para firma" value={m.listosFirma} tone="success" href="/intranet/sgie/expedientes" />
          <SignalCard icon={<AlertTriangle size={16} />} label="Alertas activas" value={m.alertasActivas} tone="danger" href="/intranet/sgie/alertas" />
          <SignalCard icon={<CheckSquare size={16} />} label="Tareas pendientes" value={m.tareasHoy} tone="neutral" href="/intranet/sgie/tareas" />
          <SignalCard icon={<ClipboardList size={16} />} label="Docs. pendientes" value={m.documentosPendientes} tone="neutral" href="/intranet/sgie/documentos" />
          <SignalCard icon={<Mail size={16} />} label="Correos fallidos" value={m.correosFallidos} tone="neutral" href="/intranet/sgie/correos" />
          <SignalCard icon={<FolderKanban size={16} />} label="Total expedientes" value={m.total} tone="neutral" />
        </div>
      )}

      {/* Bandeja de expedientes */}
      <Card padding="none">
        <div className="flex items-center justify-between p-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <FolderKanban size={16} className="text-accent-dark" />
            <h2 className="text-sm font-bold text-text">Expedientes recientes</h2>
          </div>
          <Link href="/intranet/sgie/expedientes"><Button variant="ghost" size="sm">Ver todos</Button></Link>
        </div>

        {expedientes.length === 0 ? (
          <EmptyState icon={<FolderOpen size={28} />} title="Sin expedientes asignados"
            description="Cuando se le asigne un expediente, aparecerá aquí."
            action={<Link href="/intranet/sgie/expedientes"><Button variant="primary" size="sm"><FolderKanban size={14} /> Ir a expedientes</Button></Link>} />
        ) : (
          <div className="divide-y divide-border-light">
            {expedientes.slice(0, 8).map((e) => (
              <Link key={e.id} href={`/intranet/sgie/expedientes/${e.id}`}
                className="flex items-center gap-3 p-3 hover:bg-surface-alt transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Scale size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">{e.numeroInterno}</p>
                  <p className="text-xxs text-text-muted truncate">{e.clienteNombre ?? 'Sin cliente'} · {e.tipoProcedimientoNombre ?? 'Sin procedimiento'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-xxs font-bold uppercase', prioridadTone(e.prioridad))}>{e.prioridad}</span>
                  <EstadoBadge estado={e.estado} />
                  {e.actualizadoEn && <span className="text-xxs text-text-muted hidden sm:inline">{formatFecha(e.actualizadoEn)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Sprint 3: bloque ejecutivo (tendencias, cuellos de botella, accesos) */}
      {avanzado && <CockpitEjecutivo data={avanzado} />}
    </div>
  );
}

function CockpitEjecutivo({ data }: { data: CockpitAvanzado }) {
  const maxTendencia = Math.max(1, ...data.tendenciaPorEstado.map((t) => t.n));
  const maxTareas = Math.max(1, ...data.tareasVencidasPorResponsable.map((t) => t.n));
  return (
    <>
      {/* Accesos rápidos */}
      <div className="flex flex-wrap gap-2">
        <Link href="/intranet/sgie/clientes"><Button variant="secondary" size="sm"><FolderOpen size={14} /> Nuevo cliente</Button></Link>
        <Link href="/intranet/sgie/expedientes"><Button variant="secondary" size="sm"><FolderKanban size={14} /> Nuevo expediente</Button></Link>
        <Link href="/intranet/sgie/tareas"><Button variant="secondary" size="sm"><CheckSquare size={14} /> Nueva tarea</Button></Link>
        <Link href="/intranet/sgie/reportes"><Button variant="secondary" size="sm"><FileText size={14} /> Reportes</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia por estado */}
        <Card padding="md">
          <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border-light">Tendencia de expedientes por estado</h2>
          {data.tendenciaPorEstado.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">Sin datos.</p>
          ) : (
            <ul className="space-y-2">
              {data.tendenciaPorEstado.map((t) => (
                <li key={t.estado} className="flex items-center gap-3">
                  <span className="text-xs text-text flex-1 truncate">{t.estado.replace(/_/g, ' ')}</span>
                  <div className="w-28 h-1.5 rounded-full bg-surface-alt overflow-hidden flex-shrink-0">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(t.n / maxTendencia) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-text tabular-nums w-6 text-right flex-shrink-0">{t.n}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Tareas vencidas por responsable */}
        <Card padding="md">
          <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border-light">Tareas vencidas por responsable</h2>
          {data.tareasVencidasPorResponsable.length === 0 ? (
            <p className="text-xs text-success text-center py-4">Sin tareas vencidas.</p>
          ) : (
            <ul className="space-y-2">
              {data.tareasVencidasPorResponsable.map((t) => (
                <li key={t.responsableId} className="flex items-center gap-3">
                  <span className="text-xs text-text flex-1 truncate">{t.nombre}</span>
                  <div className="w-28 h-1.5 rounded-full bg-surface-alt overflow-hidden flex-shrink-0">
                    <div className="h-full bg-danger/60 rounded-full" style={{ width: `${(t.n / maxTareas) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-danger tabular-nums w-6 text-right flex-shrink-0">{t.n}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Cuellos de botella */}
        <Card padding="md">
          <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border-light">Cuellos de botella (sin movimiento 14+ días)</h2>
          {data.cuellosDeBotella.length === 0 ? (
            <p className="text-xs text-success text-center py-4">Sin expedientes estancados.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.cuellosDeBotella.map((c) => (
                <li key={c.id}>
                  <Link href={`/intranet/sgie/expedientes/${c.id}`} className="flex items-center gap-2 text-xs hover:bg-surface-alt rounded px-1.5 py-1">
                    <span className="font-mono font-semibold text-text">{c.numeroInterno}</span>
                    <span className="text-text-muted truncate flex-1">{c.estado.replace(/_/g, ' ')}</span>
                    {c.actualizadoEn && <span className="text-xxs text-text-muted">{new Date(c.actualizadoEn).toLocaleDateString('es-HN')}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Eventos próximos */}
        <Card padding="md">
          <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border-light">Eventos próximos (7 días)</h2>
          {data.eventosProximos.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">Sin eventos próximos.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.eventosProximos.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-xs">
                  <span className="text-text flex-1 truncate">{e.titulo}</span>
                  <span className="text-xxs text-text-muted flex-shrink-0">{new Date(e.fecha).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function SignalCard({ icon, label, value, tone, href }: {
  icon: React.ReactNode; label: string; value: number; tone: 'info' | 'warning' | 'success' | 'danger' | 'neutral'; href?: string;
}) {
  const toneClass = { info: 'text-info', warning: 'text-warning', success: 'text-success', danger: 'text-danger', neutral: 'text-text' }[tone];
  const content = (
    <div className="bg-surface-alt rounded-lg p-3 border border-border-light/50 hover:border-border transition-colors h-full">
      <div className="flex items-center gap-1.5 text-text-muted mb-1.5">{icon}<span className="text-xxs uppercase tracking-wider">{label}</span></div>
      <p className={cn('font-extrabold text-2xl tabular-nums leading-none', toneClass)}>{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function EstadoBadge({ estado }: { estado: string }) {
  const tono = (() => {
    if (estado === 'validado' || estado === 'finalizado' || estado === 'archivado') return 'success';
    if (estado === 'pendiente_validacion_abogado' || estado === 'analisis_completado') return 'info';
    if (estado.includes('inconsisten') || estado === 'pendiente_de_firma') return 'warning';
    return 'neutral';
  })();
  const tonoClass = { success: 'bg-success/10 text-success border-success/20', info: 'bg-info/10 text-info border-info/20', warning: 'bg-warning/10 text-warning border-warning/20', neutral: 'bg-surface-alt text-text-secondary border-border' }[tono];
  return <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border whitespace-nowrap', tonoClass)}>{estado.replace(/_/g, ' ')}</span>;
}
