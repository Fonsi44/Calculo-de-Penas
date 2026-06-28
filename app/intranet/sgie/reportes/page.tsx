'use client';

/**
 * SGIE — Reportes operativos con exportación (Sprint 2, tarea 2).
 *
 * Muestra métricas agregadas (expedientes por estado/cliente/abogado/procedimiento,
 * tareas, documentos, alertas, enlaces) con filtros y exportación CSV + impresión.
 *
 * Exportación:
 *  - CSV: descarga directa vía GET /api/sgie/reportes?formato=csv.
 *  - Imprimir/PDF: window.print() sobre una vista print-friendly (sin librerías
 *    pesadas; el PDF real queda pendiente de una dependencia como pdfkit/puppeteer).
 *
 * Diseño con tokens. Estados loading/skeleton/error/vacío.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3, Download, Printer, ArrowLeft, Filter, X as XIcon,
  FolderKanban, CheckSquare, FileText, AlertTriangle, Link2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { PageHeaderSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { traducirEstadoExpediente } from '@/lib/sgie/estados';
import type { MetricasReporte } from '@/lib/sgie/reportes-db';

interface FiltrosForm {
  fechaDesde: string;
  fechaHasta: string;
  estado: string;
  clienteId: string;
  abogadoId: string;
  tipoProcedimientoId: string;
}

const EMPTY_FILTROS: FiltrosForm = {
  fechaDesde: '', fechaHasta: '', estado: '', clienteId: '', abogadoId: '', tipoProcedimientoId: '',
};

const ESTADOS_EXPEDIENTE = [
  'creado', 'pendiente_de_documentos', 'documentos_completos',
  'pendiente_validacion_abogado', 'validado', 'en_tramite', 'finalizado', 'archivado',
];

export default function SgieReportesPage() {
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const [metricas, setMetricas] = useState<MetricasReporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosForm>(EMPTY_FILTROS);
  const [exportando, setExportando] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const mounted = useRef(false);

  const fetchReporte = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (filtros.fechaDesde) params.set('fechaDesde', new Date(filtros.fechaDesde + 'T00:00:00').toISOString());
      if (filtros.fechaHasta) params.set('fechaHasta', new Date(filtros.fechaHasta + 'T23:59:59').toISOString());
      if (filtros.estado) params.set('estado', filtros.estado);
      if (filtros.clienteId) params.set('clienteId', filtros.clienteId);
      if (filtros.abogadoId) params.set('abogadoId', filtros.abogadoId);
      if (filtros.tipoProcedimientoId) params.set('tipoProcedimientoId', filtros.tipoProcedimientoId);

      const res = await fetch(`/api/sgie/reportes?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const d = await res.json();
      setMetricas(d.metricas);
    } catch {
      setError(true);
      toast.danger('No se pudo generar el reporte');
    } finally {
      setLoading(false);
    }
  }, [filtros, toast]);

  useEffect(() => {
    if (!authLoading && user && !mounted.current) {
      mounted.current = true;
      fetchReporte();
    }
  }, [authLoading, user, fetchReporte]);

  const exportarCsv = async () => {
    setExportando(true);
    try {
      const params = new URLSearchParams({ formato: 'csv' });
      if (filtros.fechaDesde) params.set('fechaDesde', new Date(filtros.fechaDesde + 'T00:00:00').toISOString());
      if (filtros.fechaHasta) params.set('fechaHasta', new Date(filtros.fechaHasta + 'T23:59:59').toISOString());
      if (filtros.estado) params.set('estado', filtros.estado);

      const res = await fetch(`/api/sgie/reportes?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'reporte.csv';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV descargado', filename);
    } catch {
      toast.danger('No se pudo exportar el CSV');
    } finally {
      setExportando(false);
    }
  };

  const exportarPdf = async () => {
    setExportandoPdf(true);
    try {
      const params = new URLSearchParams({ formato: 'pdf' });
      if (filtros.fechaDesde) params.set('fechaDesde', new Date(filtros.fechaDesde + 'T00:00:00').toISOString());
      if (filtros.fechaHasta) params.set('fechaHasta', new Date(filtros.fechaHasta + 'T23:59:59').toISOString());
      if (filtros.estado) params.set('estado', filtros.estado);

      const res = await fetch(`/api/sgie/reportes?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'reporte.pdf';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado', filename);
    } catch {
      toast.danger('No se pudo exportar el PDF');
    } finally {
      setExportandoPdf(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros(EMPTY_FILTROS);
  };

  const hayFiltros = Object.values(filtros).some((v) => v);

  if (authLoading || (loading && !metricas)) {
    return <div className="space-y-4"><PageHeaderSkeleton cards={4} /></div>;
  }
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }
  if (error || !metricas) {
    return (
      <Card padding="md">
        <ErrorState title="No se pudo generar el reporte" description="Verifique su conexión y vuelva a intentarlo." onRetry={fetchReporte} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reportes"
        subtitle={user.rol === 'admin' ? 'Vista administrador (todos los datos)' : 'Sus expedientes asignados'}
        icon={<BarChart3 size={20} className="text-accent" />}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportarCsv} loading={exportando}>
              <Download size={14} /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={exportarPdf} loading={exportandoPdf}>
              <FileText size={14} /> PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer size={14} /> Imprimir
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <Card padding="sm">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-text">
            <Filter size={14} className="text-text-muted" />
            Filtros {hayFiltros && <span className="text-xxs text-info">(aplicados)</span>}
          </span>
          <span className="text-text-muted">{mostrarFiltros ? '▲' : '▼'}</span>
        </button>
        {mostrarFiltros && (
          <div className="mt-3 pt-3 border-t border-border-light space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Desde" htmlFor="r-desde">
                <Input id="r-desde" type="date" value={filtros.fechaDesde}
                  onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })} />
              </Field>
              <Field label="Hasta" htmlFor="r-hasta">
                <Input id="r-hasta" type="date" value={filtros.fechaHasta}
                  onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })} />
              </Field>
              <Field label="Estado" htmlFor="r-estado">
                <select id="r-estado" value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none hover:border-border-strong focus:border-accent">
                  <option value="">Todos</option>
                  {ESTADOS_EXPEDIENTE.map((e) => (
                    <option key={e} value={e}>{traducirEstadoExpediente(e)}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={fetchReporte}>Aplicar filtros</Button>
              {hayFiltros && (
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  <XIcon size={14} /> Limpiar
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricaCard icon={<FolderKanban size={16} />} label="Expedientes" valor={metricas.expedientes.total} tone="primary" href="/intranet/sgie/expedientes" />
        <MetricaCard icon={<CheckSquare size={16} />} label="Tareas vencidas" valor={metricas.tareas.vencidas} tone="danger" href="/intranet/sgie/tareas" />
        <MetricaCard icon={<FileText size={16} />} label="Docs pendientes" valor={metricas.documentos.pendientesValidacion} tone="warning" href="/intranet/sgie/documentos" />
        <MetricaCard icon={<AlertTriangle size={16} />} label="Alertas activas" valor={metricas.alertas.activas} tone="danger" href="/intranet/sgie/alertas" />
        <MetricaCard icon={<CheckSquare size={16} />} label="Tareas completadas" valor={metricas.tareas.completadas} tone="success" />
        <MetricaCard icon={<FolderKanban size={16} />} label="Docs totales" valor={metricas.documentos.total} tone="info" />
        <MetricaCard icon={<AlertTriangle size={16} />} label="Alertas resueltas" valor={metricas.alertas.resueltas} tone="neutral" />
        <MetricaCard icon={<Link2 size={16} />} label="Enlaces activos" valor={metricas.enlaces.activos} tone="info" />
      </div>

      {/* Desgloses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DesgloseCard titulo="Expedientes por estado" items={metricas.expedientes.porEstado.map((e) => ({ label: traducirEstadoExpediente(e.estado), valor: e.n }))} />
        <DesgloseCard titulo="Expedientes por cliente (top)" items={metricas.expedientes.porCliente.slice(0, 8).map((c) => ({ label: c.nombre, valor: c.n }))} />
        <DesgloseCard titulo="Expedientes por abogado" items={metricas.expedientes.porAbogado.map((a) => ({ label: a.nombre, valor: a.n }))} />
        <DesgloseCard titulo="Expedientes por procedimiento" items={metricas.expedientes.porProcedimiento.map((p) => ({ label: p.nombre, valor: p.n }))} />
      </div>

      {/* Listado de expedientes */}
      {metricas.expedientes.listado.length === 0 ? (
        <Card padding="md">
          <EmptyState icon={<BarChart3 size={28} />} title="Sin expedientes" description="No hay expedientes que cumplan los filtros seleccionados." />
        </Card>
      ) : (
        <Card padding="none">
          <div className="p-3 border-b border-border-light">
            <h2 className="text-sm font-bold text-text">Detalle de expedientes ({metricas.expedientes.listado.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">N.º interno</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Cliente</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden sm:table-cell">Procedimiento</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Estado</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden md:table-cell">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {metricas.expedientes.listado.slice(0, 100).map((e) => (
                  <tr key={e.id} className="hover:bg-surface-alt transition-colors">
                    <td className="p-3 font-mono text-xs font-semibold text-text">{e.numeroInterno}</td>
                    <td className="p-3 text-text-secondary truncate max-w-[180px]">{e.clienteNombre ?? '—'}</td>
                    <td className="p-3 text-text-secondary hidden sm:table-cell truncate max-w-[180px]">{e.procedimientoNombre ?? '—'}</td>
                    <td className="p-3"><span className="text-xxs font-semibold text-text-secondary">{traducirEstadoExpediente(e.estado)}</span></td>
                    <td className="p-3 text-xxs text-text-muted hidden md:table-cell">{e.creadoEn ? new Date(e.creadoEn).toLocaleDateString('es-HN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}

function MetricaCard({
  icon, label, valor, tone, href,
}: {
  icon: React.ReactNode; label: string; valor: number;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  href?: string;
}) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
    neutral: 'bg-surface-alt text-text-secondary',
  }[tone];

  const content = (
    <Card padding="sm" className={cn('hover:border-border-strong transition-colors', href && 'cursor-pointer')}>
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', toneClass)}>{icon}</div>
        <p className="text-xxs uppercase tracking-wider text-text-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold text-text tabular-nums">{valor}</p>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function DesgloseCard({ titulo, items }: { titulo: string; items: { label: string; valor: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <Card padding="md">
      <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border-light">{titulo}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">Sin datos</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="text-xs text-text flex-1 truncate">{it.label}</span>
              <div className="w-24 h-1.5 rounded-full bg-surface-alt overflow-hidden flex-shrink-0">
                <div className="h-full bg-accent/60 rounded-full" style={{ width: `${(it.valor / max) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold text-text tabular-nums w-6 text-right flex-shrink-0">{it.valor}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
