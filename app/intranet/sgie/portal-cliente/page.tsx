'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, User, Mail, Phone, FileText, Link, Copy, XCircle,
  Plus, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';

interface EnlacePortal {
  id: string;
  expedienteNumero: string;
  creado: string;
  estado: 'activo' | 'revocado' | 'expirado';
  linkStatus: 'enviado' | 'pendiente' | 'accedido';
}

interface ClientePortal {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  expedientesCount: number;
  enlaces: EnlacePortal[];
}

interface ClienteRaw {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  expedientesCount?: number;
  _count?: { expedientes?: number };
}

interface EnlaceRaw {
  id: string;
  expedienteId: string | null;
  creadoEn: string;
  revocadoEn: string | null;
  expiraEn: string | null;
  usosActuales: number | null;
}

const ESTADO_ENLACE_TONE: Record<string, 'success' | 'danger' | 'warning'> = {
  activo: 'success',
  revocado: 'danger',
  expirado: 'warning',
};

const LINK_STATUS_TONE: Record<string, 'success' | 'warning' | 'info'> = {
  enviado: 'info',
  pendiente: 'warning',
  accedido: 'success',
};

function formatFecha(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

export default function PortalClientePage() {
  const [clientes, setClientes] = useState<ClientePortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<ClientePortal | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/sgie/clientes?limit=100');
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const json = await res.json() as { clientes?: ClienteRaw[] };
        if (!cancelled) {
          const raw = json.clientes ?? [];
          setClientes(raw.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            email: c.email ?? '',
            telefono: c.telefono ?? '',
            expedientesCount: c.expedientesCount ?? c._count?.expedientes ?? 0,
            enlaces: [],
          })));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar clientes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    const q = searchTerm.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [searchTerm, clientes]);

  const mostrarResults = searchTerm.trim().length > 0;

  async function fetchEnlaces(clienteId: string) {
    try {
      const res = await fetch(`/api/sgie/enlaces?expedienteId=${clienteId}`);
      if (!res.ok) return;
      const json = await res.json() as { enlaces?: EnlaceRaw[] };
      const enlaces: EnlacePortal[] = (json.enlaces ?? []).map((e) => ({
        id: e.id,
        expedienteNumero: e.expedienteId?.slice(0, 8) ?? '',
        creado: e.creadoEn ?? new Date().toISOString(),
        estado: e.revocadoEn ? 'revocado' as const : (e.expiraEn && new Date(e.expiraEn) < new Date() ? 'expirado' as const : 'activo' as const),
        linkStatus: e.usosActuales && e.usosActuales > 0 ? 'accedido' as const : 'enviado' as const,
      }));
      setSelected((prev) => prev && prev.id === clienteId ? { ...prev, enlaces } : prev);
    } catch {
      /* ignore */
    }
  }

  function handleSelect(cliente: ClientePortal) {
    setSelected(cliente);
    setShowGenerate(false);
    fetchEnlaces(cliente.id);
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Portal de Cliente</h1>
        <p className="text-xs text-text-secondary mt-0.5">Gestión de accesos y enlaces del portal de clientes</p>
      </div>

      <div className="max-w-lg">
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelected(null); }}
          iconLeft={<Search size={16} />}
        />
      </div>

      {mostrarResults && clientesFiltrados.length === 0 && (
        <Card padding="md">
          <EmptyState icon={<Search size={24} />} title="Sin resultados" description="No se encontraron clientes con ese criterio." />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="sm">
          <CardHeader title="Clientes" subtitle={mostrarResults ? `${clientesFiltrados.length} resultados` : 'Escriba para buscar'} />
          {clientesFiltrados.length === 0 && !mostrarResults && (
            <p className="text-xs text-text-muted text-center py-8">Utilice el buscador para encontrar clientes.</p>
          )}
          {clientesFiltrados.length > 0 && (
            <ul className="space-y-1">
              {clientesFiltrados.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleSelect(c)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border transition-colors text-xs',
                      selected?.id === c.id
                        ? 'border-accent bg-accent/5 text-text'
                        : 'border-transparent hover:bg-surface-alt text-text-secondary hover:text-text',
                    )}
                  >
                    <p className="font-semibold">{c.nombre}</p>
                    <p className="text-xxs text-text-muted mt-0.5">{c.email} · {c.expedientesCount} expedientes</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <Card padding="md">
              <EmptyState icon={<User size={24} />} title="Seleccione un cliente" description="Seleccione un cliente de la lista para ver sus datos y enlaces." />
            </Card>
          ) : (
            <>
              <Card padding="md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-accent/15 flex items-center justify-center">
                      <User size={19} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-primary">{selected.nombre}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xxs text-text-secondary mt-0.5">
                        <span className="inline-flex items-center gap-1"><Mail size={11} /> {selected.email}</span>
                        <span className="inline-flex items-center gap-1"><Phone size={11} /> {selected.telefono}</span>
                        <span className="inline-flex items-center gap-1"><FileText size={11} /> {selected.expedientesCount} expedientes</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowGenerate(true)} disabled>
                    <Plus size={14} /> Generar nuevo enlace
                  </Button>
                </div>
              </Card>

              {showGenerate && (
                <Card padding="md">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-border-light">
                    <h3 className="text-sm font-bold text-primary">Nuevo enlace de portal</h3>
                    <button type="button" onClick={() => setShowGenerate(false)} className="p-1 rounded hover:bg-surface-alt text-text-muted" aria-label="Cerrar">
                      <AlertTriangle size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <select className="w-full h-10 rounded-md border border-border bg-surface text-sm px-3 outline-none">
                      <option value="">Seleccionar expediente...</option>
                    </select>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" disabled>Generar enlace</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowGenerate(false)}>Cancelar</Button>
                    </div>
                  </div>
                </Card>
              )}

              <Card padding="md">
                <CardHeader
                  title="Enlaces del portal"
                  subtitle={`${selected.enlaces.length} enlace${selected.enlaces.length !== 1 ? 's' : ''}`}
                />
                {selected.enlaces.length === 0 ? (
                  <EmptyState icon={<Link size={24} />} title="Sin enlaces" description="Este cliente no tiene enlaces generados aún." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-light text-text-muted text-xxs uppercase tracking-wider">
                          <th className="text-left py-2 px-2 font-semibold">Expediente</th>
                          <th className="text-left py-2 px-2 font-semibold">Creado</th>
                          <th className="text-left py-2 px-2 font-semibold">Estado</th>
                          <th className="text-left py-2 px-2 font-semibold">Link</th>
                          <th className="text-right py-2 px-2 font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.enlaces.map((enl) => (
                          <tr key={enl.id} className="border-b border-border-light/50 hover:bg-surface-alt transition-colors">
                            <td className="py-2.5 px-2 font-mono font-semibold text-text">{enl.expedienteNumero}</td>
                            <td className="py-2.5 px-2 text-text-secondary">{formatFecha(enl.creado)}</td>
                            <td className="py-2.5 px-2">
                              <Badge tone={ESTADO_ENLACE_TONE[enl.estado]}>{enl.estado}</Badge>
                            </td>
                            <td className="py-2.5 px-2">
                              <Badge tone={LINK_STATUS_TONE[enl.linkStatus]} variant="outline">{enl.linkStatus}</Badge>
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button title="Copiar enlace" aria-label="Copiar enlace" className="p-1 rounded hover:bg-accent/15 text-accent-dark">
                                  <Copy size={13} />
                                </button>
                                {enl.estado === 'activo' && (
                                  <button title="Revocar enlace" aria-label="Revocar enlace" className="p-1 rounded hover:bg-danger/15 text-danger">
                                    <XCircle size={13} />
                                  </button>
                                )}
                                <button title="Abrir enlace" aria-label="Abrir enlace" className="p-1 rounded hover:bg-info/15 text-info">
                                  <ExternalLink size={13} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
