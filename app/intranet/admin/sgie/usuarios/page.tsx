'use client';

/**
 * SGIE — Usuarios y Accesos (vista administrativa, Sprint 2, tarea 1).
 *
 * Vista de gobierno de accesos SGIE para admin. Reutiliza el endpoint admin
 * existente (`GET /api/admin/usuarios`) y los endpoints de gestión (rol,
 * bloqueo, correo corp.) ya implementados en la Fase 2. No duplica lógica:
 * presenta los usuarios con foco SGIE (rol, estado, expedientes asignados,
 * último acceso) y enlaza al detalle `/intranet/admin/usuarios/[id]` para
 * acciones completas.
 *
 * Seguridad: sólo admin (layout admin ya protege la ruta). El endpoint valida
 * requireAdmin. No se muestran hashes ni secretos.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Users, Search, ShieldCheck, ShieldOff, Mail, Ban, CheckCircle,
  ArrowLeft, ExternalLink, Briefcase,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeletons';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';

interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  active: boolean | null;
  bloqueado: boolean | null;
  bloqueadoMotivo: string | null;
  ultimoAcceso: string | null;
  correoCorporativoVinculado: boolean | null;
  expedientesAsignados: number;
}

type EstadoFiltro = 'todos' | 'activos' | 'bloqueados' | 'inactivos';

function formatUltimoAcceso(iso: string | null): string {
  if (!iso) return 'Nunca';
  try {
    const d = new Date(iso);
    const ahora = new Date();
    const diffMs = ahora.getTime() - d.getTime();
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 30) return `Hace ${dias} días`;
    return d.toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function SgieAdminUsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EstadoFiltro>('todos');
  const mounted = useRef(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (q) params.set('q', q);
      if (estado !== 'todos') params.set('estado', estado);
      const res = await fetch(`/api/admin/usuarios?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const d = await res.json();
      setUsuarios(d.usuarios ?? []);
      setTotal(d.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [q, estado]);

  useEffect(() => {
    if (!authLoading && user?.rol === 'admin' && !mounted.current) {
      mounted.current = true;
      fetchUsuarios();
    }
  }, [authLoading, user, fetchUsuarios]);

  if (authLoading) return <TableSkeleton rows={6} columns={5} />;
  if (!user || user.rol !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-primary">Acceso restringido</p>
        <p className="text-sm text-text-secondary mt-2">Requiere rol de administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuarios y Accesos SGIE"
        subtitle={`${total} usuarios`}
        icon={<Users size={20} className="text-accent" />}
        actions={
          <Link href="/intranet/admin/usuarios">
            <Button variant="ghost" size="sm"><ExternalLink size={14} /> Gestión completa</Button>
          </Link>
        }
      />

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o email…" iconLeft={<Search size={14} />} />
        </div>
        <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoFiltro)}
          className="h-10 px-3 rounded-md border border-border bg-surface text-sm text-text outline-none hover:border-border-strong focus:border-accent">
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="bloqueados">Bloqueados</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : error ? (
        <Card padding="md">
          <ErrorState title="No se pudieron cargar los usuarios" description="Verifique su conexión y vuelva a intentarlo." onRetry={fetchUsuarios} />
        </Card>
      ) : usuarios.length === 0 ? (
        <Card padding="md">
          <EmptyState icon={<Users size={28} />} title="Sin usuarios" description={q || estado !== 'todos' ? 'Pruebe a cambiar los filtros.' : 'No hay usuarios registrados.'} />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Usuario</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Rol</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Estado</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden md:table-cell">Último acceso</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden lg:table-cell">SGIE</th>
                  <th className="text-right p-3 text-xxs font-bold uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {usuarios.map((u) => {
                  const activo = u.active && !u.bloqueado;
                  return (
                    <tr key={u.id} className="hover:bg-surface-alt transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            u.rol === 'admin' ? 'bg-accent/10 text-accent-dark' : 'bg-primary/10 text-primary')}>
                            <Users size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-text truncate">{u.nombre}</p>
                            <p className="text-xxs text-text-muted truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border',
                          u.rol === 'admin'
                            ? 'bg-accent/10 text-accent-dark border-accent/20'
                            : 'bg-surface-alt text-text-secondary border-border')}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.bloqueado ? (
                          <span className="inline-flex items-center gap-1 text-xxs font-semibold text-danger"><Ban size={11} /> Bloqueado</span>
                        ) : activo ? (
                          <span className="inline-flex items-center gap-1 text-xxs font-semibold text-success"><CheckCircle size={11} /> Activo</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xxs font-semibold text-text-muted"><ShieldOff size={11} /> Inactivo</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-text-secondary hidden md:table-cell">{formatUltimoAcceso(u.ultimoAcceso)}</td>
                      <td className="p-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-xxs text-text-secondary"><Briefcase size={10} /> {u.expedientesAsignados} exp.</span>
                          {u.correoCorporativoVinculado && (
                            <span className="inline-flex items-center gap-1 text-xxs text-info" title="Correo corporativo vinculado"><Mail size={10} /> Corp.</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/intranet/admin/usuarios/${u.id}`}>
                          <Button variant="ghost" size="sm"><ShieldCheck size={14} /> Gestionar</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}
