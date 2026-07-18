'use client';

import { useState, useEffect } from 'react';
import {
  Activity, AlertTriangle, Clock, Database, Mail, Briefcase,
  FileText, ShieldAlert, UserX, UserCheck, HardDrive,
  RefreshCw, Server, FileSearch, Bot, XCircle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/ui';

interface DashboardData {
  timestamp: string;
  totalExpedientes: number;
  expedientesActivos30d: number;
  totalDocumentos: number;
  documentosProcesados30d: number;
  totalExtraccionesIa: number;
  iaExitosas: number;
  iaFallidas: number;
  tasaExitoIa: number;
  totalCorreos: number;
  correosFallidos: number;
  tareasPendientes: number;
  alertasActivas: number;
  totalCorreccionesIa: number;
  jobsPendientes: number;
  jobsFallidos: number;
  outboxPendientes: number;
  outboxFallidos: number;
  comunicacionesPendientes: number;
  comunicacionesFallidas: number;
  expPorEstado: Array<{ estado: string; total: number }>;
}

const TONE_BG: Record<string, string> = {
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sgie/metricas');
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/sgie/metricas');
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar métricas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const grupos = data ? [
    {
      key: 'incidencias',
      titulo: 'Incidencias',
      descripcion: 'Fallos y bloqueos activos en el sistema',
      items: [
        { label: 'Jobs DLQ', valor: data.jobsFallidos ?? 0, icon: Activity, tone: 'danger' as const },
        { label: 'Documentos atascados', valor: data.totalDocumentos - (data.documentosProcesados30d ?? 0), icon: FileText, tone: 'warning' as const },
        { label: 'Outbox fallidos', valor: data.outboxFallidos ?? 0, icon: Mail, tone: 'danger' as const },
        { label: 'Correos fallidos', valor: data.correosFallidos ?? 0, icon: XCircle, tone: 'warning' as const },
        { label: 'IA fallidas', valor: data.iaFallidas ?? 0, icon: Bot, tone: 'danger' as const },
        { label: 'Tareas pendientes', valor: data.tareasPendientes ?? 0, icon: UserX, tone: 'warning' as const },
      ],
    },
    {
      key: 'riesgo',
      titulo: 'Riesgo',
      descripcion: 'Vencimientos y SLA críticos',
      items: [
        { label: 'Alertas activas', valor: data.alertasActivas ?? 0, icon: Clock, tone: 'danger' as const },
        { label: 'SLA incumplido', valor: data.comunicacionesFallidas ?? 0, icon: AlertTriangle, tone: 'danger' as const },
        { label: 'Bloqueos', valor: data.expPorEstado?.find(e => e.estado === 'bloqueado_por_cliente')?.total ?? 0, icon: ShieldAlert, tone: 'danger' as const },
      ],
    },
    {
      key: 'personas',
      titulo: 'Personas',
      descripcion: 'Usuarios y equipos del sistema',
      items: [
        { label: 'Total expedientes', valor: data.totalExpedientes ?? 0, icon: Briefcase, tone: 'info' as const },
        { label: 'Activos (30d)', valor: data.expedientesActivos30d ?? 0, icon: UserCheck, tone: 'success' as const },
        { label: 'Tasa IA', valor: `${data.tasaExitoIa ?? 0}%`, icon: Bot, tone: 'info' as const },
      ],
    },
    {
      key: 'automatizacion',
      titulo: 'Automatización',
      descripcion: 'Estado de procesos automatizados',
      items: [
        { label: 'Jobs pendientes', valor: data.jobsPendientes ?? 0, icon: Activity, tone: 'warning' as const },
        { label: 'Outbox pendientes', valor: data.outboxPendientes ?? 0, icon: Mail, tone: 'warning' as const },
        { label: 'IA realizadas', valor: data.totalExtraccionesIa ?? 0, icon: Bot, tone: 'success' as const },
        { label: 'Correcciones IA', valor: data.totalCorreccionesIa ?? 0, icon: FileSearch, tone: 'success' as const },
        { label: 'Coms. pendientes', valor: data.comunicacionesPendientes ?? 0, icon: Mail, tone: 'info' as const },
        { label: 'Coms. fallidas', valor: data.comunicacionesFallidas ?? 0, icon: XCircle, tone: 'danger' as const },
      ],
    },
  ] : [];

  const saludItems = data ? [
    { label: 'Base de datos', ok: true, icon: Database },
    { label: 'Blob Storage', ok: true, icon: HardDrive },
    { label: 'Worker', ok: data.jobsFallidos === 0, icon: Server },
    { label: 'Cron', ok: data.jobsPendientes === 0, icon: Clock },
    { label: 'Resend', ok: (data.correosFallidos ?? 0) < 10, icon: Mail },
    { label: 'OCR', ok: data.iaExitosas > 0 || data.totalExtraccionesIa === 0, icon: FileSearch },
    { label: 'IA', ok: data.tasaExitoIa >= 50 || data.totalExtraccionesIa === 0, icon: Bot },
  ] : [];

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;
  if (!data) return <div className="p-8 text-center text-text-muted">Sin datos disponibles</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Dashboard administrativo</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          <RefreshCw size={14} /> Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {grupos.map(({ key, titulo, descripcion, items }) => (
          <Card key={key} padding="md">
            <CardHeader title={titulo} subtitle={descripcion} />
            {items.length === 0 ? (
              <EmptyState icon={<Activity size={24} />} title="Sin datos" description="No hay métricas disponibles." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border-light p-3 transition-colors hover:border-border">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <item.icon size={14} className="text-text-secondary" />
                      <span className={cn('text-xs font-bold', item.tone ? TONE_BG[item.tone]?.split(' ')[0] : '')}>
                        {item.valor}
                      </span>
                    </div>
                    <p className="text-xxs text-text-secondary leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card padding="md">
        <CardHeader
          title="Salud del sistema"
          subtitle="Estado actual de servicios y dependencias"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {saludItems.length === 0 ? (
            <div className="col-span-full text-center py-6 text-xs text-text-muted">Sin información de salud.</div>
          ) : (
            saludItems.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border-light p-3">
                <div className={cn('w-3 h-3 rounded-full', s.ok ? 'bg-success' : 'bg-danger')} />
                <s.icon size={16} className="text-text-secondary" />
                <span className="text-xxs text-text-secondary text-center">{s.label}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
