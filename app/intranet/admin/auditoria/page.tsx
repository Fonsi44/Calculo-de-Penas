'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AuditEvent {
  id: string;
  usuarioId: string | null;
  accion: string;
  recurso: string | null;
  recursoId: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
  exito: boolean;
  mensaje: string | null;
  creadoEn: string;
}

export default function AdminAuditoriaPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionFilter, setAccionFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (accionFilter) params.set('accion', accionFilter);
    fetch(`/api/admin/auditoria?${params}`)
      .then(r => r.json())
      .then(data => setEvents(data.eventos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, accionFilter]);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString('es-HN'); } catch { return d; }
  };

  const actionBadge = (accion: string) => {
    const colors: Record<string, string> = {
      blog_created: 'text-green-600 bg-green-50',
      blog_updated: 'text-blue-600 bg-blue-50',
      blog_deleted: 'text-red-600 bg-red-50',
      faq_created: 'text-green-600 bg-green-50',
      faq_updated: 'text-blue-600 bg-blue-50',
      faq_deleted: 'text-red-600 bg-red-50',
      login: 'text-gray-600 bg-gray-50',
      login_failed: 'text-red-600 bg-red-50',
      usuario_created: 'text-green-600 bg-green-50',
      usuario_deleted: 'text-red-600 bg-red-50',
    };
    const color = colors[accion] || 'text-gray-600 bg-gray-50';
    return <span className={`text-xxs font-mono px-1.5 py-0.5 rounded ${color}`}>{accion}</span>;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Auditoría</h1>
        <p className="text-xs text-text-secondary">Registro de acciones administrativas</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={accionFilter}
            onChange={e => { setAccionFilter(e.target.value); setPage(1); }}
            placeholder="Filtrar por acción (ej: blog_created)..."
            iconLeft={<Filter size={14} />}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setAccionFilter(''); setPage(1); }}>
          Limpiar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : events.length === 0 ? (
        <Card padding="lg"><p className="text-center text-text-secondary text-sm">No hay eventos de auditoría</p></Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase">Acción</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase hidden md:table-cell">Recurso</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase hidden lg:table-cell">IP</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-b border-border-light hover:bg-surface-alt">
                    <td className="p-3">{actionBadge(e.accion)}</td>
                    <td className="p-3 text-text-secondary text-xs hidden md:table-cell">
                      {e.recurso && <><span className="font-medium">{e.recurso}</span>{e.recursoId && <span className="text-text-muted">/{e.recursoId?.slice(0, 8)}</span>}</>}
                    </td>
                    <td className="p-3 text-xxs text-text-muted font-mono hidden lg:table-cell">{e.ip || '-'}</td>
                    <td className="p-3 text-xxs text-text-muted">{formatDate(e.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border-light flex justify-between items-center">
            <p className="text-xs text-text-secondary">Página {page}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
              <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={events.length < limit}>Siguiente</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
