'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ReglaComunicacion {
  id: string;
  nombre: string;
  descripcion: string;
  trigger: string;
  plantilla: string;
  status: string;
  version: string;
  ultimaModificacion: string;
  canales: string[];
  condiciones: string[];
}

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  desactivada: 'Desactivada',
  archivada: 'Archivada',
};

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'info'> = {
  borrador: 'neutral',
  activa: 'success',
  desactivada: 'warning',
  archivada: 'info',
};

export default function ReglasComunicacionPage() {
  const [reglas, setReglas] = useState<ReglaComunicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/sgie/reglas');
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const json = await res.json() as { versiones?: Array<{ id: string; version: number; activa: boolean; descripcion: string | null; creadoEn: string | null }>; activa?: Record<string, unknown> };
        if (!cancelled) {
          const versiones = json.versiones ?? [];
          const activa = json.activa as Record<string, unknown> ?? {};
          setReglas(transformToRules(activa, versiones));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar reglas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return reglas;
    const q = search.toLowerCase();
    return reglas.filter((r) =>
      r.nombre.toLowerCase().includes(q) || r.trigger.toLowerCase().includes(q) || r.plantilla.toLowerCase().includes(q)
    );
  }, [search, reglas]);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Reglas de comunicación</h1>
          <p className="text-sm text-text-secondary mt-1">Definición de reglas que disparan notificaciones automáticas según eventos del sistema.</p>
        </div>
        <Button variant="secondary" size="sm" disabled>
          Nueva regla
        </Button>
      </div>

      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Buscar por nombre, trigger o plantilla..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-surface pl-8 pr-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Layers size={14} />
            <span>{filtered.length} reglas</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-muted">
            {reglas.length === 0 ? 'No hay reglas configuradas.' : 'No se encontraron reglas con ese criterio de búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Nombre</th>
                  <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Trigger</th>
                  <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Plantilla</th>
                  <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Canales</th>
                  <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Versión</th>
                  <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Estado</th>
                  <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Última mod.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((regla) => (
                  <tr key={regla.id} className="border-b border-border-light/50 hover:bg-surface-alt/40">
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-semibold text-text">{regla.nombre}</p>
                        <p className="text-xxs text-text-muted mt-0.5">{regla.descripcion}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded text-accent-dark font-mono">{regla.trigger}</code>
                    </td>
                    <td className="py-3 px-2 text-xs text-text-secondary font-mono">{regla.plantilla}</td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {regla.canales.map((c) => (
                          <Badge key={c} tone="neutral" size="sm">{c === 'email' ? 'Email' : c === 'notificacion_interna' ? 'Interna' : c}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs text-text-secondary">v{regla.version}</td>
                    <td className="py-3 px-2">
                      <Badge tone={STATUS_TONE[regla.status] ?? 'neutral'} size="sm">{STATUS_LABEL[regla.status] ?? regla.status}</Badge>
                    </td>
                    <td className="py-3 px-2 text-xs text-text-muted">{regla.ultimaModificacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function transformToRules(activa: Record<string, unknown>, versiones: Array<{ id: string; version: number; activa: boolean; descripcion: string | null; creadoEn: string | null }>): ReglaComunicacion[] {
  const rules: ReglaComunicacion[] = [];

  for (const [key] of Object.entries(activa)) {
    rules.push({
      id: `rule-${key}`,
      nombre: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      descripcion: `Regla configurada para: ${key}`,
      trigger: key,
      plantilla: `template_${key}`,
      status: 'activa',
      version: versiones.length > 0 ? `${versiones[0]?.version ?? 1}.0.0` : '1.0.0',
      ultimaModificacion: versiones[0]?.creadoEn?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      canales: ['email'],
      condiciones: [],
    });
  }

  versiones.slice(0, 3).forEach((ver) => {
    if (ver.activa && rules.length > 0) return;
    rules.push({
      id: `ver-${ver.id}`,
      nombre: `Configuración v${ver.version}`,
      descripcion: ver.descripcion ?? `Versión ${ver.version} de la configuración`,
      trigger: 'config_version',
      plantilla: '-',
      status: ver.activa ? 'activa' : 'archivada',
      version: `${ver.version}.0.0`,
      ultimaModificacion: ver.creadoEn?.slice(0, 10) ?? '',
      canales: ['notificacion_interna'],
      condiciones: [],
    });
  });

  return rules;
}
