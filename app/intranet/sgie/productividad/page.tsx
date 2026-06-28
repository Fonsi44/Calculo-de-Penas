'use client';

/**
 * SGIE — Dashboard de productividad (Sprint 4, tarea 6).
 *
 * Métricas por abogado/rango: expedientes creados/cerrados, tareas
 * completadas/vencidas por abogado, actividad semanal. Exportación CSV.
 * Barras CSS/tarjetas (sin librerías de gráficos).
 *
 * Sprint 4.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { formatDuracion } from '@/lib/sgie/tiempo-por-estado';
import Link from 'next/link';
import { TrendingUp, Download, ArrowLeft, Filter, CheckCircle, AlertTriangle, FolderKanban, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';

interface Metricas {
  porAbogado: { abogadoId: string; nombre: string; completadas: number; vencidas: number }[];
  actividadSemanal: { semana: string; n: number }[];
  resumen: { creados: number; cerrados: number; tareasCompletadas: number; tareasVencidas: number };
}

export default function SgieProductividadPage() {
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [exportando, setExportando] = useState(false);
  const mounted = useRef(false);

  const fetchMetricas = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.set('fechaDesde', new Date(fechaDesde + 'T00:00:00').toISOString());
      if (fechaHasta) params.set('fechaHasta', new Date(fechaHasta + 'T23:59:59').toISOString());
      const res = await fetch(`/api/sgie/productividad?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      setMetricas(await res.json());
    } catch {
      setError(true);
      toast.danger('No se pudo cargar la productividad');
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, toast]);

  useEffect(() => {
    if (!authLoading && user && !mounted.current) { mounted.current = true; fetchMetricas(); }
  }, [authLoading, user, fetchMetricas]);

  const exportarCsv = async () => {
    setExportando(true);
    try {
      const params = new URLSearchParams({ formato: 'csv' });
      if (fechaDesde) params.set('fechaDesde', new Date(fechaDesde + 'T00:00:00').toISOString());
      if (fechaHasta) params.set('fechaHasta', new Date(fechaHasta + 'T23:59:59').toISOString());
      const res = await fetch(`/api/sgie/productividad?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'productividad.csv';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV descargado', filename);
    } catch {
      toast.danger('No se pudo exportar');
    } finally {
      setExportando(false);
    }
  };

  if (authLoading || (loading && !metricas)) return <div className="space-y-4"><PageHeaderSkeleton cards={4} /></div>;
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }
  if (error || !metricas) {
    return <Card padding="md"><ErrorState title="No se pudo cargar" description="Verifique su conexión." onRetry={fetchMetricas} /></Card>;
  }

  const maxCompletadas = Math.max(1, ...metricas.porAbogado.map((a) => a.completadas));
  const maxActividad = Math.max(1, ...metricas.actividadSemanal.map((s) => s.n));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Productividad"
        subtitle={user.rol === 'admin' ? 'Vista administrador' : 'Su actividad'}
        icon={<TrendingUp size={20} className="text-accent" />}
        actions={<Button variant="secondary" size="sm" onClick={exportarCsv} loading={exportando}><Download size={14} /> CSV</Button>}
      />

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex items-end gap-3 flex-wrap">
          <Field label="Desde" htmlFor="p-desde"><Input id="p-desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></Field>
          <Field label="Hasta" htmlFor="p-hasta"><Input id="p-hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></Field>
          <Button variant="primary" size="sm" onClick={fetchMetricas}><Filter size={14} /> Aplicar</Button>
        </div>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metrica icon={<FolderKanban size={16} />} label="Expedientes creados" valor={metricas.resumen.creados} tone="primary" />
        <Metrica icon={<FolderKanban size={16} />} label="Expedientes cerrados" valor={metricas.resumen.cerrados} tone="success" />
        <Metrica icon={<CheckCircle size={16} />} label="Tareas completadas" valor={metricas.resumen.tareasCompletadas} tone="info" />
        <Metrica icon={<AlertTriangle size={16} />} label="Tareas vencidas" valor={metricas.resumen.tareasVencidas} tone="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por abogado */}
        <Card padding="md">
          <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border-light">Tareas por abogado</h2>
          {metricas.porAbogado.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">Sin datos.</p>
          ) : (
            <ul className="space-y-2.5">
              {metricas.porAbogado.map((a) => (
                <li key={a.abogadoId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text truncate flex-1">{a.nombre}</span>
                    <span className="text-xxs text-text-muted flex-shrink-0">
                      <span className="text-success font-semibold">{a.completadas}</span> · <span className="text-danger font-semibold">{a.vencidas}</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-alt overflow-hidden">
                    <div className="h-full bg-success/60 rounded-full" style={{ width: `${(a.completadas / maxCompletadas) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Actividad semanal */}
        <Card padding="md">
          <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border-light">Actividad semanal (expedientes creados)</h2>
          {metricas.actividadSemanal.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">Sin actividad.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {metricas.actividadSemanal.map((s) => (
                <div key={s.semana} className="flex-1 flex flex-col items-center gap-1" title={`Semana ${s.semana}: ${s.n} expedientes`}>
                  <div className="w-full bg-primary/60 rounded-t-md" style={{ height: `${(s.n / maxActividad) * 100}%`, minHeight: '4px' }} />
                  <span className="text-xxs text-text-muted">{s.n}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Sprint 5 — Tiempo medio por estado */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-light">
          <h2 className="text-sm font-bold text-text flex items-center gap-1.5">
            <Clock size={14} className="text-accent-dark" /> Tiempo medio por estado
          </h2>
        </div>
        <TiempoPorEstado fechaDesde={fechaDesde} fechaHasta={fechaHasta} />
      </Card>

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}

function TiempoPorEstado({ fechaDesde, fechaHasta }: { fechaDesde: string; fechaHasta: string }) {
  const [datos, setDatos] = useState<{ tiempoPorEstado: Array<{ estado: string; mediaMs: number; mediaDias: number; muestras: number }>; datosInsuficientes: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const params = new URLSearchParams();
    if (fechaDesde) params.set('fechaDesde', new Date(fechaDesde + 'T00:00:00').toISOString());
    if (fechaHasta) params.set('fechaHasta', new Date(fechaHasta + 'T23:59:59').toISOString());
    fetch(`/api/sgie/productividad/tiempo-por-estado?${params}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelado && d) setDatos(d); })
      .catch(() => {})
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [fechaDesde, fechaHasta]);

  const maxMedia = Math.max(1, ...(datos?.tiempoPorEstado ?? []).map((e) => e.mediaMs));

  if (loading) return <p className="text-xs text-text-muted text-center py-4">Cargando…</p>;
  if (datos?.datosInsuficientes || (datos?.tiempoPorEstado.length ?? 0) === 0) {
    return <p className="text-xs text-text-muted text-center py-4">Datos insuficientes para calcular el tiempo por estado en este rango.</p>;
  }

  return (
    <ul className="space-y-2">
      {datos!.tiempoPorEstado.map((e) => (
        <li key={e.estado} className="flex items-center gap-3">
          <span className="text-xs text-text flex-1 truncate">{e.estado.replace(/_/g, ' ')}</span>
          <div className="w-32 h-1.5 rounded-full bg-surface-alt overflow-hidden flex-shrink-0">
            <div className="h-full bg-accent/60 rounded-full" style={{ width: `${(e.mediaMs / maxMedia) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold text-text tabular-nums w-20 text-right flex-shrink-0">{formatDuracion(e.mediaMs)}</span>
          <span className="text-xxs text-text-muted w-12 text-right flex-shrink-0">({e.muestras})</span>
        </li>
      ))}
    </ul>
  );
}

function Metrica({ icon, label, valor, tone }: { icon: React.ReactNode; label: string; valor: number; tone: string }) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info', danger: 'bg-danger/10 text-danger',
  }[tone];
  return (
    <Card padding="sm">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', toneClass)}>{icon}</div>
        <p className="text-xxs uppercase tracking-wider text-text-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold text-text tabular-nums">{valor}</p>
    </Card>
  );
}
