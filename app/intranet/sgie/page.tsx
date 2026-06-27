'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderKanban, FileText, AlertTriangle, CheckSquare,
  Mail, Ban, FileCheck, Clock, ClipboardList, FolderOpen, Scale,
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

interface Metricas {
  listosRevisar: number;
  conFaltantes: number;
  listosFirma: number;
  total: number;
  porEstado: Record<string, number>;
}

// Estados que indican que el expediente está listo para revisión del abogado.
const ESTADOS_LISTOS_REVISAR = new Set(['pendiente_validacion_abogado', 'analisis_completado']);
// Estados que indican faltantes documentales.
const ESTADOS_CON_FALTANTES = new Set([
  'pendiente_de_documentos', 'enlace_enviado', 'documentos_parcialmente_recibidos', 'inconsistencias_detectadas',
]);
const ESTADO_FIRMA = 'pendiente_de_firma';

export default function SgieCockpitPage() {
  const { user } = useAuth();
  const [expedientes, setExpedientes] = useState<ExpedienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchExpedientes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/sgie/expedientes?limit=100');
      if (!res.ok) throw new Error('Error al cargar expedientes');
      const data = await res.json();
      setExpedientes(data.expedientes ?? []);
    } catch {
      setError(true);
      setExpedientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExpedientes(); }, [fetchExpedientes]); // eslint-disable-line react-hooks/set-state-in-effect -- carga inicial

  const metricas: Metricas = (() => {
    const porEstado: Record<string, number> = {};
    let listosRevisar = 0;
    let conFaltantes = 0;
    let listosFirma = 0;
    for (const e of expedientes) {
      porEstado[e.estado] = (porEstado[e.estado] ?? 0) + 1;
      if (ESTADOS_LISTOS_REVISAR.has(e.estado)) listosRevisar += 1;
      if (ESTADOS_CON_FALTANTES.has(e.estado)) conFaltantes += 1;
      if (e.estado === ESTADO_FIRMA) listosFirma += 1;
    }
    return { listosRevisar, conFaltantes, listosFirma, total: expedientes.length, porEstado };
  })();

  const prioridadTone = (p: string) => {
    switch (p) {
      case 'urgente': return 'text-danger';
      case 'alta': return 'text-warning';
      case 'media': return 'text-info';
      default: return 'text-text-muted';
    }
  };

  const formatFecha = (d: string | null) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Cockpit del abogado</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {user?.rol === 'admin'
            ? 'Vista de supervisión (administrador). Ve todos los expedientes.'
            : `Bienvenido, ${user?.nombre || user?.email}. Aquí están sus expedientes y tareas.`}
        </p>
      </div>

      {/* Tarjetas de señales (§10.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SignalCard
          icon={<FolderOpen size={16} />}
          label="Listos para revisar"
          value={metricas.listosRevisar}
          tone="info"
          href="/intranet/sgie/expedientes"
        />
        <SignalCard
          icon={<FileText size={16} />}
          label="Con documentos faltantes"
          value={metricas.conFaltantes}
          tone="warning"
          href="/intranet/sgie/expedientes"
        />
        <SignalCard
          icon={<FileCheck size={16} />}
          label="Listos para firma"
          value={metricas.listosFirma}
          tone="success"
          href="/intranet/sgie/expedientes"
        />
        {/* Estos módulos son placeholders de fases futuras (estados vacíos profesionales). */}
        <SignalCard icon={<AlertTriangle size={16} />} label="Alertas activas" value={0} tone="neutral" />
        <SignalCard icon={<CheckSquare size={16} />} label="Tareas de hoy" value={0} tone="neutral" />
      </div>

      {/* Bandeja principal: expedientes listos para revisar */}
      <Card padding="none">
        <div className="flex items-center justify-between p-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <FolderKanban size={16} className="text-accent-dark" />
            <h2 className="text-sm font-bold text-text">Expedientes para revisión</h2>
          </div>
          <Link href="/intranet/sgie/expedientes">
            <Button variant="ghost" size="sm">Ver todos</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : error ? (
          <EmptyState
            icon={<AlertTriangle size={28} />}
            title="No se pudieron cargar los expedientes"
            description="Verifique su conexión e inténtelo de nuevo."
            action={<Button variant="secondary" size="sm" onClick={fetchExpedientes}>Reintentar</Button>}
          />
        ) : expedientes.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="Aún no tiene expedientes asignados"
            description="Cuando se le asigne un expediente, aparecerá aquí para su revisión. Puede crear uno nuevo desde la sección Expedientes."
            action={<Link href="/intranet/sgie/expedientes"><Button variant="primary" size="sm"><FolderKanban size={14} /> Ir a expedientes</Button></Link>}
          />
        ) : (
          <div className="divide-y divide-border-light">
            {expedientes.slice(0, 6).map((e) => (
              <Link
                key={e.id}
                href={`/intranet/sgie/expedientes/${e.id}`}
                className="flex items-center gap-3 p-3 hover:bg-surface-alt transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Scale size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">{e.numeroInterno}</p>
                  <p className="text-xxs text-text-muted truncate">
                    {e.clienteNombre ?? 'Sin cliente'} · {e.tipoProcedimientoNombre ?? 'Sin procedimiento'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-xxs font-bold uppercase', prioridadTone(e.prioridad))}>{e.prioridad}</span>
                  <EstadoBadge estado={e.estado} />
                  {e.actualizadoEn && (
                    <span className="text-xxs text-text-muted hidden sm:inline">{formatFecha(e.actualizadoEn)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Placeholders de módulos futuros — estados vacíos profesionales, no mocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PlaceholderModule
          icon={<Clock size={18} />}
          title="Próximos plazos y agenda"
          description="Las fechas procesales, audiencias y vencimientos detectados aparecerán aquí como eventos propuestos para confirmar. Disponible en fases posteriores del SGIE."
        />
        <PlaceholderModule
          icon={<Ban size={18} />}
          title="Clientes sin respuesta"
          description="Cuando un cliente reciba un enlace de carga documental y no responda en el plazo configurado, aparecerá aquí para seguimiento. Disponible en fases posteriores."
        />
        <PlaceholderModule
          icon={<Mail size={18} />}
          title="Correos fallidos"
          description="Los errores de envío de correos transaccionales (Resend) se registrarán y mostrarán aquí para reintentar. Disponible en fases posteriores."
        />
        <PlaceholderModule
          icon={<ClipboardList size={18} />}
          title="Documentos pendientes de aprobación"
          description="Los documentos subidos por los clientes que requieran su revisión aparecerán aquí. Disponible cuando se active el motor documental."
        />
      </div>
    </div>
  );
}

function SignalCard({
  icon, label, value, tone, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
  href?: string;
}) {
  const toneClass = {
    info: 'text-info',
    warning: 'text-warning',
    success: 'text-success',
    danger: 'text-danger',
    neutral: 'text-text',
  }[tone];

  const content = (
    <div className="bg-surface-alt rounded-lg p-3 border border-border-light/50 hover:border-border transition-colors h-full">
      <div className="flex items-center gap-1.5 text-text-muted mb-1.5">
        {icon}
        <span className="text-xxs uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('font-extrabold text-2xl tabular-nums leading-none', toneClass)}>{value}</p>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function PlaceholderModule({
  icon, title, description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card padding="md" className="opacity-90">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-alt text-text-muted flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text">{title}</p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
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
      {estado.replace(/_/g, ' ')}
    </span>
  );
}
