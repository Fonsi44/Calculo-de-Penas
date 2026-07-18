'use client';

import { useState, useMemo } from 'react';
import {
  Mail, Send, FileText, Settings, AlertTriangle, CheckCircle,
  Clock, XCircle, RefreshCw, Eye, Copy, Edit3,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';

type Tab = 'outbox' | 'plantillas' | 'reglas';

interface OutboxItem {
  id: string;
  tipo: string;
  destinatario: string;
  asunto: string;
  estado: 'pendiente' | 'enviado' | 'fallido';
  intentos: number;
  fecha: string;
}

interface PlantillaItem {
  id: string;
  nombre: string;
  slug: string;
  estado: 'activa' | 'borrador' | 'archivada';
  version: number;
}

const MOCK_OUTBOX: OutboxItem[] = [
  { id: 'o1', tipo: 'recordatorio', destinatario: 'carlos@example.com', asunto: 'Recordatorio de cita', estado: 'pendiente', intentos: 0, fecha: '2026-07-18T10:00:00Z' },
  { id: 'o2', tipo: 'notificacion', destinatario: 'maria@example.com', asunto: 'Documentos recibidos', estado: 'enviado', intentos: 1, fecha: '2026-07-17T14:30:00Z' },
  { id: 'o3', tipo: 'alerta', destinatario: 'ana@example.com', asunto: 'Notificación de vencimiento', estado: 'fallido', intentos: 3, fecha: '2026-07-16T09:00:00Z' },
  { id: 'o4', tipo: 'notificacion', destinatario: 'juan@example.com', asunto: 'Actualización de expediente', estado: 'pendiente', intentos: 0, fecha: '2026-07-18T08:00:00Z' },
  { id: 'o5', tipo: 'recordatorio', destinatario: 'luis@example.com', asunto: 'Recordatorio de pago', estado: 'enviado', intentos: 1, fecha: '2026-07-15T11:00:00Z' },
  { id: 'o6', tipo: 'alerta', destinatario: 'sofia@example.com', asunto: 'Alerta de seguridad', estado: 'fallido', intentos: 5, fecha: '2026-07-14T16:00:00Z' },
];

const MOCK_PLANTILLAS: PlantillaItem[] = [
  { id: 'p1', nombre: 'Recordatorio de cita', slug: 'recordatorio-cita', estado: 'activa', version: 3 },
  { id: 'p2', nombre: 'Notificación documentos', slug: 'notificacion-documentos', estado: 'activa', version: 2 },
  { id: 'p3', nombre: 'Alerta de vencimiento', slug: 'alerta-vencimiento', estado: 'borrador', version: 1 },
  { id: 'p4', nombre: 'Bienvenida portal cliente', slug: 'bienvenida-portal', estado: 'activa', version: 4 },
  { id: 'p5', nombre: 'Recordatorio de pago', slug: 'recordatorio-pago', estado: 'archivada', version: 2 },
];

const OUTBOX_ESTADO_TONE: Record<string, 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  enviado: 'success',
  fallido: 'danger',
};

const PLANTILLA_ESTADO_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  activa: 'success',
  borrador: 'warning',
  archivada: 'neutral',
};

const TIPO_ICON: Record<string, typeof Mail> = {
  recordatorio: Clock,
  notificacion: Mail,
  alerta: AlertTriangle,
};

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function ComunicacionesPage() {
  const [loading] = useState(false);
  const [tab, setTab] = useState<Tab>('outbox');
  const [filter, setFilter] = useState<string>('todos');

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: 'outbox', label: 'Outbox', icon: Send },
    { key: 'plantillas', label: 'Plantillas', icon: FileText },
    { key: 'reglas', label: 'Reglas', icon: Settings },
  ];

  const outboxFiltrados = useMemo(() => {
    if (filter === 'todos') return MOCK_OUTBOX;
    return MOCK_OUTBOX.filter((o) => o.estado === filter);
  }, [filter]);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Comunicaciones</h1>
        <p className="text-xs text-text-secondary mt-0.5">Gestión de outbox, plantillas y reglas de comunicación</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border-light p-1 bg-surface-alt/50 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all',
              tab === key ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-text hover:bg-surface/50',
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Outbox tab */}
      {tab === 'outbox' && (
        <Card padding="md">
          <CardHeader
            title="Buzón de salida"
            subtitle="Comunicaciones pendientes, enviadas y fallidas"
            action={
              <div className="flex gap-2">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}
                  className="h-8 rounded-md border border-border bg-surface px-2 text-xs outline-none">
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="enviado">Enviados</option>
                  <option value="fallido">Fallidos</option>
                </select>
                <Button variant="secondary" size="sm"><RefreshCw size={13} /> Reintentar</Button>
              </div>
            }
          />
          {outboxFiltrados.length === 0 ? (
            <EmptyState icon={<Send size={24} />} title="Sin comunicaciones" description="No hay elementos en el outbox." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-light text-text-muted text-xxs uppercase tracking-wider">
                    <th className="text-left py-2.5 px-2 font-semibold">Tipo</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Destinatario</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Asunto</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Estado</th>
                    <th className="text-center py-2.5 px-2 font-semibold">Intentos</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Fecha</th>
                    <th className="text-right py-2.5 px-2 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {outboxFiltrados.map((item) => {
                    const Icon = TIPO_ICON[item.tipo] || Mail;
                    return (
                      <tr key={item.id} className="border-b border-border-light/50 hover:bg-surface-alt transition-colors">
                        <td className="py-2.5 px-2">
                          <span className="inline-flex items-center gap-1 text-text-secondary">
                            <Icon size={13} /> {item.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-text">{item.destinatario}</td>
                        <td className="py-2.5 px-2 text-text-secondary max-w-[180px] truncate">{item.asunto}</td>
                        <td className="py-2.5 px-2">
                          <Badge tone={OUTBOX_ESTADO_TONE[item.estado]}>{item.estado}</Badge>
                        </td>
                        <td className="py-2.5 px-2 text-center text-text-secondary">{item.intentos}</td>
                        <td className="py-2.5 px-2 text-text-secondary whitespace-nowrap">{formatFecha(item.fecha)}</td>
                        <td className="py-2.5 px-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button title="Ver detalle" aria-label="Ver detalle" className="p-1 rounded hover:bg-info/15 text-info">
                              <Eye size={13} />
                            </button>
                            {item.estado === 'fallido' && (
                              <button title="Reintentar" aria-label="Reintentar" className="p-1 rounded hover:bg-warning/15 text-warning">
                                <RefreshCw size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Plantillas tab */}
      {tab === 'plantillas' && (
        <Card padding="md">
          <CardHeader
            title="Plantillas de comunicación"
            subtitle="Gestiona las plantillas de correo y notificaciones"
            action={<Button variant="primary" size="sm"><FileText size={13} /> Nueva plantilla</Button>}
          />
          {MOCK_PLANTILLAS.length === 0 ? (
            <EmptyState icon={<FileText size={24} />} title="Sin plantillas" description="No hay plantillas disponibles." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-light text-text-muted text-xxs uppercase tracking-wider">
                    <th className="text-left py-2.5 px-2 font-semibold">Nombre</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Slug</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Estado</th>
                    <th className="text-center py-2.5 px-2 font-semibold">Versión</th>
                    <th className="text-right py-2.5 px-2 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PLANTILLAS.map((p) => (
                    <tr key={p.id} className="border-b border-border-light/50 hover:bg-surface-alt transition-colors">
                      <td className="py-2.5 px-2 font-semibold text-text">{p.nombre}</td>
                      <td className="py-2.5 px-2 text-text-secondary font-mono">{p.slug}</td>
                      <td className="py-2.5 px-2">
                        <Badge tone={PLANTILLA_ESTADO_TONE[p.estado]}>{p.estado}</Badge>
                      </td>
                      <td className="py-2.5 px-2 text-center text-text-secondary">v{p.version}</td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button title="Editar" aria-label="Editar" className="p-1 rounded hover:bg-accent/15 text-accent-dark">
                            <Edit3 size={13} />
                          </button>
                          <button title="Copiar slug" aria-label="Copiar slug" className="p-1 rounded hover:bg-info/15 text-info">
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Reglas tab */}
      {tab === 'reglas' && (
        <Card padding="md">
          <CardHeader
            title="Reglas de comunicación"
            subtitle="Configuración de reglas de envío y automatización"
            action={<Button variant="primary" size="sm"><Settings size={13} /> Nueva regla</Button>}
          />
          <div className="space-y-3">
            <div className="rounded-lg border border-border-light p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text">Recordatorio automático de citas</h3>
                  <p className="text-xxs text-text-muted mt-0.5">Envía un recordatorio 24h antes de la cita vía correo electrónico.</p>
                </div>
                <Badge tone="success">Activa</Badge>
              </div>
              <div className="flex gap-4 mt-2 text-xxs text-text-secondary">
                <span>Disparador: cita_cliente.estado → confirmada</span>
                <span>Acción: enviar correo (plantilla recordatorio-cita)</span>
              </div>
            </div>
            <div className="rounded-lg border border-border-light p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text">Notificación de documentos recibidos</h3>
                  <p className="text-xxs text-text-muted mt-0.5">Notifica al cliente cuando se adjuntan documentos a su expediente.</p>
                </div>
                <Badge tone="success">Activa</Badge>
              </div>
              <div className="flex gap-4 mt-2 text-xxs text-text-secondary">
                <span>Disparador: documento.estado → recibido</span>
                <span>Acción: enviar correo (plantilla notificacion-documentos)</span>
              </div>
            </div>
            <div className="rounded-lg border border-border-light p-4 opacity-60">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text">Alerta de vencimiento de plazo</h3>
                  <p className="text-xxs text-text-muted mt-0.5">Alerta automática 72h antes del vencimiento de un plazo procesal.</p>
                </div>
                <Badge tone="neutral">Inactiva</Badge>
              </div>
              <div className="flex gap-4 mt-2 text-xxs text-text-secondary">
                <span>Disparador: plazo.dias_restantes → 3</span>
                <span>Acción: enviar correo + notificación in-app</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
