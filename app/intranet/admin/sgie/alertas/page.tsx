'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle, Info, AlertCircle, XCircle, CheckCircle,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

type Severidad = 'critico' | 'error' | 'advertencia' | 'info';

interface Alerta {
  id: string;
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  expediente: string | null;
  fechaCreacion: string;
  status: string;
}

const SEVERIDAD_MAP: Record<string, Severidad> = {
  critico: 'critico',
  error: 'error',
  advertencia: 'advertencia',
  info: 'info',
};

const SEVERIDAD_CONFIG: Record<Severidad, { label: string; icon: React.ReactNode; tone: 'danger' | 'warning' | 'info' }> = {
  critico: { label: 'Crítica', icon: <XCircle size={14} />, tone: 'danger' },
  error: { label: 'Error', icon: <AlertCircle size={14} />, tone: 'warning' },
  advertencia: { label: 'Advertencia', icon: <AlertTriangle size={14} />, tone: 'warning' },
  info: { label: 'Informativa', icon: <Info size={14} />, tone: 'info' },
};

const STATUS_BADGE_TONE: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'neutral'> = {
  abierta: 'danger',
  en_progreso: 'info',
  pospuesta: 'warning',
  resuelta: 'success',
  descartada: 'neutral',
};

const STATUS_LABEL: Record<string, string> = {
  abierta: 'Abierta',
  en_progreso: 'En progreso',
  pospuesta: 'Pospuesta',
  resuelta: 'Resuelta',
  descartada: 'Descartada',
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severidadFilter, setSeveridadFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/sgie/alertas?limit=100');
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const json = await res.json() as { alertas?: Array<{ id: string; severidad: string; titulo: string; mensaje: string | null; expedienteId: string | null; creadoEn: string | null; resuelta: boolean }> };
        const raw = json.alertas ?? [];
        if (!cancelled) {
          setAlertas(raw.map((a) => {
            const sev = SEVERIDAD_MAP[a.severidad] || 'advertencia';
            return {
              id: a.id,
              severidad: sev,
              titulo: a.titulo,
              mensaje: a.mensaje ?? '',
              expediente: a.expedienteId ?? null,
              fechaCreacion: a.creadoEn?.slice(0, 10) ?? '',
              status: a.resuelta ? 'resuelta' : 'abierta',
            };
          }));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar alertas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = alertas.filter((a) => {
    if (severidadFilter !== 'all' && a.severidad !== severidadFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const countBySeveridad = {
    critico: alertas.filter((a) => a.severidad === 'critico').length,
    error: alertas.filter((a) => a.severidad === 'error').length,
    advertencia: alertas.filter((a) => a.severidad === 'advertencia').length,
    info: alertas.filter((a) => a.severidad === 'info').length,
  };

  const SEVERIDADES: Severidad[] = ['critico', 'error', 'advertencia', 'info'];

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Alertas y SLA</h1>
        <p className="text-sm text-text-secondary mt-1">Gestión de alertas operativas, incidencias y cumplimiento de niveles de servicio.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SEVERIDADES.map((sev) => (
          <div key={sev} className="bg-surface border border-border-light rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: sev === 'critico' ? 'rgba(220,38,38,0.1)' : sev === 'error' ? 'rgba(234,179,8,0.1)' : sev === 'advertencia' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)' }}>
              {SEVERIDAD_CONFIG[sev].icon}
            </div>
            <div>
              <p className="text-xl font-extrabold text-primary">{countBySeveridad[sev]}</p>
              <p className="text-xxs text-text-muted">{SEVERIDAD_CONFIG[sev].label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding="md">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-text-muted mr-1">Severidad:</span>
          {(['all', ...SEVERIDADES] as const).map((sev) => (
            <button key={sev} onClick={() => setSeveridadFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                severidadFilter === sev
                  ? 'bg-accent/15 text-accent-dark border-accent/30'
                  : 'bg-surface text-text-secondary border-border-light hover:border-border'
              }`}>
              {sev === 'all' ? 'Todas' : SEVERIDAD_CONFIG[sev].label}
            </button>
          ))}
          <span className="text-xs font-semibold text-text-muted mx-2">|</span>
          <span className="text-xs font-semibold text-text-muted mr-1">Estado:</span>
          {(['all', 'abierta', 'en_progreso', 'pospuesta', 'resuelta', 'descartada'] as const).map((st) => (
            <button key={st} onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                statusFilter === st
                  ? 'bg-accent/15 text-accent-dark border-accent/30'
                  : 'bg-surface text-text-secondary border-border-light hover:border-border'
              }`}>
              {st === 'all' ? 'Todos' : STATUS_LABEL[st]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Severidad</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Título</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Mensaje</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Expediente</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Creada</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Estado</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alerta) => {
                const sevConfig = SEVERIDAD_CONFIG[alerta.severidad];
                return (
                  <tr key={alerta.id} className="border-b border-border-light/50 hover:bg-surface-alt/40">
                    <td className="py-2.5 px-2">
                      <Badge tone={sevConfig.tone} size="sm">
                        <span className="flex items-center gap-1">{sevConfig.icon}{sevConfig.label}</span>
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2 text-xs font-semibold text-text">{alerta.titulo}</td>
                    <td className="py-2.5 px-2 text-xs text-text-secondary max-w-xs truncate">{alerta.mensaje}</td>
                    <td className="py-2.5 px-2 text-xs text-text-muted font-mono">{alerta.expediente || '—'}</td>
                    <td className="py-2.5 px-2 text-xs text-text-muted">{alerta.fechaCreacion || '—'}</td>
                    <td className="py-2.5 px-2">
                      <Badge tone={STATUS_BADGE_TONE[alerta.status] ?? 'neutral'} size="sm">{STATUS_LABEL[alerta.status] ?? alerta.status}</Badge>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1">
                        {alerta.status === 'abierta' && (
                          <>
                            <button className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-text transition-colors" title="Marcar en progreso"><Eye size={14} /></button>
                            <button className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-success transition-colors" title="Resolver"><CheckCircle size={14} /></button>
                          </>
                        )}
                        {alerta.status === 'resuelta' && (
                          <span className="text-xxs text-text-muted">Resuelta</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-text-muted">No se encontraron alertas con los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
