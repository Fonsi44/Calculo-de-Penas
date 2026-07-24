'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { isAdminRole } from '@/lib/roles';
import { CheckCircle, FileText, Mail, AlertTriangle, Database, Cpu, Brain } from 'lucide-react';

interface Metricas {
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
  expPorEstado: Array<{ estado: string; total: number }>;
  expPorAbogado: Array<{ nombre: string; total: number }>;
}

export default function MetricasAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sgie/metricas');
      if (res.ok) setData(await res.json());
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.rol === 'admin' && !mounted.current) { mounted.current = true; fetchData(); }
  }, [authLoading, user, fetchData]);

  if (authLoading) return <Spinner size="lg" />;
  if (!user || user.rol !== 'admin') return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;

  if (loading) return <Spinner size="lg" />;
  if (!data) return <div className="text-center py-10 text-text-muted">Sin datos disponibles.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Métricas SGIE</h1>
        <p className="text-sm text-text-secondary mt-1">Dashboard de productividad y costes</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricaCard icon={<Database size={18} />} label="Expedientes" value={data.totalExpedientes} sub={`${data.expedientesActivos30d} activos (30d)`} />
        <MetricaCard icon={<FileText size={18} />} label="Documentos" value={data.totalDocumentos} sub={`${data.documentosProcesados30d} procesados (30d)`} />
        <MetricaCard icon={<Brain size={18} />} label="IA" value={`${data.tasaExitoIa}%`} sub={`${data.iaExitosas} éxito / ${data.iaFallidas} fallos`} />
        <MetricaCard icon={<Mail size={18} />} label="Correos" value={data.totalCorreos} sub={`${data.correosFallidos} fallidos`} />
        <MetricaCard icon={<AlertTriangle size={18} />} label="Alertas activas" value={data.alertasActivas} />
        <MetricaCard icon={<CheckCircle size={18} />} label="Tareas pendientes" value={data.tareasPendientes} />
        <MetricaCard icon={<Cpu size={18} />} label="Correcciones IA" value={data.totalCorreccionesIa} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-border-light rounded-lg p-4">
          <h2 className="text-sm font-bold text-primary mb-3">Expedientes por estado</h2>
          <div className="space-y-2">
            {data.expPorEstado.slice(0, 10).map((e) => (
              <div key={e.estado} className="flex items-center gap-2">
                <span className="text-xs text-text-secondary flex-1">{e.estado.replace(/_/g, ' ')}</span>
                <span className="text-xs font-bold text-primary">{e.total}</span>
                <div className="w-24 h-2 bg-surface-alt rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, (e.total / Math.max(1, data.totalExpedientes)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border-light rounded-lg p-4">
          <h2 className="text-sm font-bold text-primary mb-3">Expedientes por abogado</h2>
          <div className="space-y-2">
            {data.expPorAbogado.slice(0, 10).map((a) => (
              <div key={a.nombre} className="flex items-center gap-2">
                <span className="text-xs text-text-secondary flex-1">{a.nombre || 'Sin asignar'}</span>
                <span className="text-xs font-bold text-primary">{a.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricaCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border-light rounded-lg p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-extrabold text-primary">{value}</p>
      {sub && <p className="text-xxs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}
