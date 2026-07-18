'use client';

import { useState, useEffect } from 'react';
import {
  Mail, Send, FileText, Settings, AlertTriangle,
  Clock, RefreshCw, Eye, Copy, Edit3,
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

interface PlantillaRaw {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  version?: number;
}

export default function ComunicacionesPage() {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('outbox');
  const [filter, setFilter] = useState<string>('todos');
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTab = async (activeTab: Tab, activeFilter: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tab: activeTab, filter: activeFilter });
      const res = await fetch(`/api/admin/comunicaciones?${params}`);
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json() as { tab?: string; outbox?: OutboxItem[]; plantillas?: PlantillaRaw[]; total?: number };

      if (json.tab === 'outbox') setOutbox(json.outbox ?? []);
      else if (json.tab === 'plantillas') {
        setPlantillas((json.plantillas ?? []).map((p: PlantillaRaw) => ({
          ...p,
          estado: (p.estado === 'desactivada' ? 'archivada' : p.estado) as 'activa' | 'borrador' | 'archivada',
          version: p.version ?? 1,
        })));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
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
        const params = new URLSearchParams({ tab, filter });
        const res = await fetch(`/api/admin/comunicaciones?${params}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const json = await res.json() as { tab?: string; outbox?: OutboxItem[]; plantillas?: PlantillaRaw[]; activa?: Record<string, unknown> };

        if (!cancelled) {
          if (json.tab === 'outbox') setOutbox(json.outbox ?? []);
          else if (json.tab === 'plantillas') {
            setPlantillas((json.plantillas ?? []).map((p: PlantillaRaw) => ({
              ...p,
              estado: (p.estado === 'desactivada' ? 'archivada' : p.estado) as 'activa' | 'borrador' | 'archivada',
              version: p.version ?? 1,
            })));
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar datos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, filter]);

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: 'outbox', label: 'Outbox', icon: Send },
    { key: 'plantillas', label: 'Plantillas', icon: FileText },
    { key: 'reglas', label: 'Reglas', icon: Settings },
  ];

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Comunicaciones</h1>
        <p className="text-xs text-text-secondary mt-0.5">Gestión de outbox, plantillas y reglas de comunicación</p>
      </div>

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
                  <option value="pending">Pendientes</option>
                  <option value="sent">Enviados</option>
                  <option value="failed">Fallidos</option>
                </select>
                <Button variant="secondary" size="sm" onClick={() => loadTab(tab, filter)}><RefreshCw size={13} /> Refrescar</Button>
              </div>
            }
          />
          {outbox.length === 0 ? (
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
                  {outbox.map((item) => {
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
                          <Badge tone={OUTBOX_ESTADO_TONE[item.estado] ?? 'neutral'}>{item.estado}</Badge>
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

      {tab === 'plantillas' && (
        <Card padding="md">
          <CardHeader
            title="Plantillas de comunicación"
            subtitle="Gestiona las plantillas de correo y notificaciones"
            action={<Button variant="primary" size="sm" disabled><FileText size={13} /> Nueva plantilla</Button>}
          />
          {plantillas.length === 0 ? (
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
                  {plantillas.map((p) => (
                    <tr key={p.id} className="border-b border-border-light/50 hover:bg-surface-alt transition-colors">
                      <td className="py-2.5 px-2 font-semibold text-text">{p.nombre}</td>
                      <td className="py-2.5 px-2 text-text-secondary font-mono">{p.slug}</td>
                      <td className="py-2.5 px-2">
                        <Badge tone={PLANTILLA_ESTADO_TONE[p.estado] ?? 'neutral'}>{p.estado}</Badge>
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

      {tab === 'reglas' && (
        <Card padding="md">
          <CardHeader
            title="Reglas de comunicación"
            subtitle="Configuración de reglas de envío y automatización"
            action={<Button variant="primary" size="sm" disabled><Settings size={13} /> Nueva regla</Button>}
          />
          <EmptyState icon={<Settings size={24} />} title="Sin reglas" description="Gestione las reglas desde la sección Reglas de comunicación." />
        </Card>
      )}
    </div>
  );
}
