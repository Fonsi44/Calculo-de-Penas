'use client';

import Link from 'next/link';
import {
  Clock, AlertTriangle, ThumbsUp, Users, FileText,
  CheckCircle, XCircle, ArrowRight, FileCheck, Search,
  Calendar, Mail, RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';

interface JornadaItem {
  id: string;
  titulo: string;
  expedienteId: string;
  numeroInterno: string;
  tipo: string;
  estado: string;
  prioridad: string;
  vence: string | null;
  clienteNombre: string | null;
  href: string;
}

const MOCK_DECISION: JornadaItem[] = [
  { id: '1', titulo: 'Aprobar clasificación de documentos', expedienteId: 'exp-1', numeroInterno: 'EXP-2026-0042', tipo: 'revision', estado: 'pendiente', prioridad: 'alta', vence: '2026-07-20T12:00:00Z', clienteNombre: 'Carlos Mendoza', href: '/intranet/sgie/revision-documental' },
  { id: '2', titulo: 'Validar análisis IA de escritura pública', expedienteId: 'exp-2', numeroInterno: 'EXP-2026-0038', tipo: 'revision', estado: 'pendiente', prioridad: 'urgente', vence: '2026-07-19T12:00:00Z', clienteNombre: 'María López', href: '/intranet/sgie/revision-documental' },
  { id: '3', titulo: 'Revisar propuesta de acuerdo', expedienteId: 'exp-3', numeroInterno: 'EXP-2026-0051', tipo: 'revision', estado: 'pendiente', prioridad: 'media', vence: '2026-07-25T12:00:00Z', clienteNombre: 'Juan Pérez', href: '/intranet/sgie/revision-documental' },
];

const MOCK_TERCEROS: JornadaItem[] = [
  { id: '4', titulo: 'Esperando documentos del cliente', expedienteId: 'exp-4', numeroInterno: 'EXP-2026-0029', tipo: 'documentos', estado: 'pendiente', prioridad: 'alta', vence: '2026-07-22T12:00:00Z', clienteNombre: 'Ana Rodríguez', href: '/intranet/sgie/expedientes/exp-4' },
  { id: '5', titulo: 'Pendiente de respuesta del juzgado', expedienteId: 'exp-5', numeroInterno: 'EXP-2026-0015', tipo: 'externo', estado: 'pendiente', prioridad: 'media', vence: '2026-08-01T12:00:00Z', clienteNombre: 'Pedro García', href: '/intranet/sgie/expedientes/exp-5' },
];

const MOCK_RIESGO: JornadaItem[] = [
  { id: '6', titulo: 'Término de prueba vence mañana', expedienteId: 'exp-6', numeroInterno: 'EXP-2026-0012', tipo: 'plazo', estado: 'critico', prioridad: 'urgente', vence: '2026-07-19T12:00:00Z', clienteNombre: 'Luis Hernández', href: '/intranet/sgie/expedientes/exp-6' },
  { id: '7', titulo: 'Documentación pendiente por 15+ días', expedienteId: 'exp-7', numeroInterno: 'EXP-2026-0023', tipo: 'documentos', estado: 'bloqueado', prioridad: 'alta', vence: null, clienteNombre: 'Sofía Torres', href: '/intranet/sgie/expedientes/exp-7' },
];

const PRIORIDAD_TONE: Record<string, string> = {
  baja: 'bg-surface-alt text-text-secondary border-border',
  media: 'bg-info/10 text-info border-info/20',
  alta: 'bg-warning/10 text-warning border-warning/20',
  urgente: 'bg-danger/10 text-danger border-danger/20',
};

function formatFecha(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' }); }
  catch { return ''; }
}

function esVencido(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export default function MiJornadaPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Mi Jornada</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SeccionJornada
          icon={<ThumbsUp size={16} className="text-info" />}
          titulo="Requiere mi decisión"
          descripcion="Elementos que necesitan su revisión y aprobación"
          items={MOCK_DECISION}
          vacioMensaje="Sin elementos pendientes de decisión."
          color="info"
        />
        <SeccionJornada
          icon={<Users size={16} className="text-warning" />}
          titulo="Esperando a terceros"
          descripcion="Acciones pendientes de clientes, juzgados u otros"
          items={MOCK_TERCEROS}
          vacioMensaje="Sin elementos pendientes de terceros."
          color="warning"
        />
        <SeccionJornada
          icon={<AlertTriangle size={16} className="text-danger" />}
          titulo="En riesgo"
          descripcion="Plazos próximos a vencer o expedientes bloqueados"
          items={MOCK_RIESGO}
          vacioMensaje="Sin elementos en riesgo."
          color="danger"
        />
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-light">
            <RefreshCw size={16} className="text-accent-dark" />
            <h2 className="text-sm font-bold text-text">Trabajo rápido</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AccionRapida icon={<FileCheck size={16} />} label="Revisar documentos" href="/intranet/sgie/revision-documental" />
            <AccionRapida icon={<Search size={16} />} label="Buscar expediente" href="/intranet/sgie/expedientes" />
            <AccionRapida icon={<Calendar size={16} />} label="Ver agenda" href="/intranet/sgie/agenda" />
            <AccionRapida icon={<Mail size={16} />} label="Correos pendientes" href="/intranet/sgie/correos" />
            <AccionRapida icon={<FileText size={16} />} label="Ver documentos" href="/intranet/sgie/documentos" />
            <AccionRapida icon={<Clock size={16} />} label="Alertas activas" href="/intranet/sgie/alertas" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function SeccionJornada({ icon, titulo, descripcion, items, vacioMensaje, color }: {
  icon: React.ReactNode; titulo: string; descripcion: string;
  items: JornadaItem[]; vacioMensaje: string; color: 'info' | 'warning' | 'danger';
}) {
  const colorBorder = { info: 'border-info/20', warning: 'border-warning/20', danger: 'border-danger/20' }[color];
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-light">
        {icon}
        <div>
          <h2 className="text-sm font-bold text-text">{titulo}</h2>
          <p className="text-xxs text-text-muted">{descripcion}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={icon} title="" description={vacioMensaje} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const vencido = esVencido(item.vence);
            return (
              <Link key={item.id} href={item.href}
                className={cn(
                  'block p-3 rounded-lg border transition-colors hover:bg-surface-alt',
                  colorBorder,
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-text leading-tight">{item.titulo}</p>
                  <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border flex-shrink-0', PRIORIDAD_TONE[item.prioridad] || PRIORIDAD_TONE.media)}>
                    {item.prioridad}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xxs text-text-muted">
                  <span className="font-mono">{item.numeroInterno}</span>
                  {item.clienteNombre && <span>· {item.clienteNombre}</span>}
                  {item.vence && (
                    <span className={cn(vencido ? 'text-danger font-semibold' : '')}>
                      · {vencido ? 'Vencido: ' : 'Vence: '}{formatFecha(item.vence)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AccionRapida({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border-light/50 bg-surface-alt/40 hover:bg-surface-alt hover:border-border transition-colors group"
    >
      <span className="text-text-secondary group-hover:text-text">{icon}</span>
      <span className="text-xs font-semibold text-text-secondary group-hover:text-text flex-1">{label}</span>
      <ArrowRight size={12} className="text-text-muted group-hover:text-text" />
    </Link>
  );
}
