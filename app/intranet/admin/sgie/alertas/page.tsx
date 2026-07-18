'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle, Info, AlertCircle, XCircle, CheckCircle,
  Clock, RefreshCw, Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Severidad = 'info' | 'warning' | 'error' | 'critical';
type StatusAlerta = 'abierta' | 'en_progreso' | 'pospuesta' | 'resuelta' | 'descartada';

interface Alerta {
  id: string;
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  expediente: string | null;
  fechaCreacion: string;
  fechaVencimiento: string | null;
  status: StatusAlerta;
}

const MOCK_ALERTAS: Alerta[] = [
  { id: 'a1', severidad: 'critical', titulo: 'Documento sin clasificar por 72h', mensaje: 'El documento escritura_012.pdf ingresó hace 72 horas y no ha sido clasificado. Se requiere acción inmediata.', expediente: 'EXP-2026-0042', fechaCreacion: '2026-07-15', fechaVencimiento: '2026-07-22', status: 'abierta' },
  { id: 'a2', severidad: 'error', titulo: 'OCR falló en 3 documentos', mensaje: 'El motor OCR reportó 3 fallos consecutivos en documentos del lote L-045. Revise la calidad de los escaneos.', expediente: 'EXP-2026-0038', fechaCreacion: '2026-07-16', fechaVencimiento: '2026-07-23', status: 'en_progreso' },
  { id: 'a3', severidad: 'warning', titulo: 'Confianza IA baja en clasificación', mensaje: '5 clasificaciones automáticas tuvieron confianza menor al 70%. Requieren revisión manual.', expediente: null, fechaCreacion: '2026-07-17', fechaVencimiento: null, status: 'abierta' },
  { id: 'a4', severidad: 'info', titulo: 'Actualización de modelo disponible', mensaje: 'El modelo deepseek-v4-flash está disponible para pruebas. Consulte la documentación de migración.', expediente: null, fechaCreacion: '2026-07-18', fechaVencimiento: '2026-08-01', status: 'abierta' },
  { id: 'a5', severidad: 'critical', titulo: 'Expediente sin responsable asignado', mensaje: 'El expediente EXP-2026-0051 no tiene un abogado responsable. Asignación requerida.', expediente: 'EXP-2026-0051', fechaCreacion: '2026-07-14', fechaVencimiento: '2026-07-19', status: 'abierta' },
  { id: 'a6', severidad: 'error', titulo: 'Error de sincronización con DNI', mensaje: 'La consulta al sistema DNI falló por timeout. 12 intentos fallidos en la última hora.', expediente: null, fechaCreacion: '2026-07-18', fechaVencimiento: null, status: 'en_progreso' },
  { id: 'a7', severidad: 'warning', titulo: 'Almacenamiento接近 límite', mensaje: 'El almacenamiento de documentos alcanzó el 85% de su capacidad. Considere archivar expedientes cerrados.', expediente: null, fechaCreacion: '2026-07-16', fechaVencimiento: '2026-08-16', status: 'pospuesta' },
  { id: 'a8', severidad: 'info', titulo: 'Reporte semanal generado', mensaje: 'El reporte de métricas SGIE de la semana 28 está disponible para descarga.', expediente: null, fechaCreacion: '2026-07-18', fechaVencimiento: null, status: 'resuelta' },
  { id: 'a9', severidad: 'critical', titulo: 'Servicio de notificaciones caído', mensaje: 'El servicio de notificaciones electrónicas no responde desde hace 30 minutos. Se requiere intervención.', expediente: null, fechaCreacion: '2026-07-18', fechaVencimiento: null, status: 'en_progreso' },
  { id: 'a10', severidad: 'error', titulo: 'Plantilla de correo inválida', mensaje: 'La plantilla "notificacion_cierre" contiene una variable no definida. Corrección requerida.', expediente: null, fechaCreacion: '2026-07-15', fechaVencimiento: '2026-07-25', status: 'abierta' },
  { id: 'a11', severidad: 'warning', titulo: 'Tokens IA接近 límite mensual', mensaje: 'El consumo de tokens del período actual está al 78% del límite mensual.', expediente: null, fechaCreacion: '2026-07-17', fechaVencimiento: '2026-07-31', status: 'descartada' },
  { id: 'a12', severidad: 'info', titulo: 'Mantenimiento programado', mensaje: 'El sistema SGIE tendrá una ventana de mantenimiento el sábado 25/07 de 02:00 a 04:00.', expediente: null, fechaCreacion: '2026-07-16', fechaVencimiento: '2026-07-25', status: 'abierta' },
];

const SEVERIDAD_CONFIG: Record<Severidad, { label: string; icon: React.ReactNode; tone: 'danger' | 'warning' | 'info'; order: number }> = {
  critical: { label: 'Crítica', icon: <XCircle size={14} />, tone: 'danger', order: 0 },
  error: { label: 'Error', icon: <AlertCircle size={14} />, tone: 'warning', order: 1 },
  warning: { label: 'Advertencia', icon: <AlertTriangle size={14} />, tone: 'warning', order: 2 },
  info: { label: 'Informativa', icon: <Info size={14} />, tone: 'info', order: 3 },
};

const STATUS_BADGE_TONE: Record<StatusAlerta, 'danger' | 'warning' | 'success' | 'info' | 'neutral'> = {
  abierta: 'danger',
  en_progreso: 'info',
  pospuesta: 'warning',
  resuelta: 'success',
  descartada: 'neutral',
};

const STATUS_LABEL: Record<StatusAlerta, string> = {
  abierta: 'Abierta',
  en_progreso: 'En progreso',
  pospuesta: 'Pospuesta',
  resuelta: 'Resuelta',
  descartada: 'Descartada',
};

export default function AlertasPage() {
  const [severidadFilter, setSeveridadFilter] = useState<Severidad | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusAlerta | 'all'>('all');

  const filtered = useMemo(() => {
    return MOCK_ALERTAS.filter((a) => {
      if (severidadFilter !== 'all' && a.severidad !== severidadFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    });
  }, [severidadFilter, statusFilter]);

  const countBySeveridad = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, error: 0, warning: 0, info: 0 };
    MOCK_ALERTAS.forEach((a) => { counts[a.severidad] = (counts[a.severidad] || 0) + 1; });
    return counts;
  }, []);

  function handleAction(id: string, newStatus: StatusAlerta) {
    // Mock action — no persistence
    console.log(`Alerta ${id} → ${newStatus}`);
  }

  const SEVERIDADES: Severidad[] = ['critical', 'error', 'warning', 'info'];

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
              style={{ backgroundColor: sev === 'critical' ? 'rgba(220,38,38,0.1)' : sev === 'error' ? 'rgba(234,179,8,0.1)' : sev === 'warning' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)' }}>
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
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Vencimiento</th>
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
                    <td className="py-2.5 px-2 text-xs text-text-muted">{alerta.fechaVencimiento || '—'}</td>
                    <td className="py-2.5 px-2">
                      <Badge tone={STATUS_BADGE_TONE[alerta.status]} size="sm">{STATUS_LABEL[alerta.status]}</Badge>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1">
                        {alerta.status === 'abierta' && (
                          <>
                            <button onClick={() => handleAction(alerta.id, 'en_progreso')}
                              className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
                              title="Marcar en progreso"><Eye size={14} /></button>
                            <button onClick={() => handleAction(alerta.id, 'pospuesta')}
                              className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
                              title="Pospuesta"><Clock size={14} /></button>
                            <button onClick={() => handleAction(alerta.id, 'resuelta')}
                              className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-success transition-colors"
                              title="Resolver"><CheckCircle size={14} /></button>
                          </>
                        )}
                        {alerta.status === 'en_progreso' && (
                          <>
                            <button onClick={() => handleAction(alerta.id, 'resuelta')}
                              className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-success transition-colors"
                              title="Resolver"><CheckCircle size={14} /></button>
                            <button onClick={() => handleAction(alerta.id, 'pospuesta')}
                              className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
                              title="Pospuesta"><Clock size={14} /></button>
                          </>
                        )}
                        {alerta.status === 'pospuesta' && (
                          <button onClick={() => handleAction(alerta.id, 'abierta')}
                            className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-warning transition-colors"
                            title="Reabrir"><RefreshCw size={14} /></button>
                        )}
                        {(alerta.status === 'abierta' || alerta.status === 'en_progreso') && (
                          <button onClick={() => handleAction(alerta.id, 'descartada')}
                            className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-danger transition-colors"
                            title="Descartar"><XCircle size={14} /></button>
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
