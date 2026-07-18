'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Ban, CalendarClock, CheckCircle, Edit3, MailPlus, Search, Shield, ShieldOff, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

type UserRow = {
  id: string; nombre: string; email: string; rol: string; active: boolean;
  bloqueado: boolean; activoSgie: boolean; equipo: string | null;
  ultimoAcceso: string | null; expedientesAsignados: number;
};

export default function UsersPage() {
  const toast = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100', estado });
      if (q.trim()) params.set('q', q.trim());
      const response = await fetch(`/api/admin/usuarios?${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setRows(body.usuarios ?? []);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [estado, q, toast]);

  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- carga remota inicial

  async function patch(id: string, path: string, body: unknown, success: string) {
    setBusy(`${id}:${path}`);
    try {
      const response = await fetch(`/api/admin/usuarios/${id}/${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      toast.success(success);
      await load();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'No se pudo completar la acción');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Usuarios" subtitle="Identidad, estado de cuenta y acceso SGIE"
        icon={<Users size={20} className="text-accent" />}
        actions={<Link href="/intranet/admin/invitaciones"><Button variant="primary" size="sm"><MailPlus size={14} /> Invitar</Button></Link>} />

      <Card padding="sm">
        <form onSubmit={(event) => { event.preventDefault(); void load(); }} className="flex flex-col sm:flex-row gap-2">
          <Input value={q} onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre o correo" iconLeft={<Search size={14} />} />
          <select value={estado} onChange={(event) => setEstado(event.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm">
            <option value="todos">Todos</option><option value="activos">Activos</option>
            <option value="bloqueados">Suspendidos</option><option value="inactivos">Inactivos</option>
          </select>
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3">Usuario</th><th className="text-left p-3">Cuenta</th>
              <th className="text-left p-3">SGIE / rol</th><th className="text-left p-3">Equipo</th>
              <th className="text-left p-3">Actividad</th><th className="text-right p-3">Acciones</th>
            </tr></thead>
            <tbody>
              {!loading && rows.map((user) => (
                <tr key={user.id} className="border-b border-border-light align-top">
                  <td className="p-3"><p className="font-semibold">{user.nombre}</p><p className="text-xs text-text-muted">{user.email}</p></td>
                  <td className="p-3">{user.bloqueado
                    ? <Badge tone="danger"><Ban size={10} className="mr-1" />Suspendida</Badge>
                    : user.active ? <Badge tone="success"><CheckCircle size={10} className="mr-1" />Activa</Badge>
                      : <Badge tone="neutral">Inactiva</Badge>}</td>
                  <td className="p-3"><p className="capitalize">{user.rol}</p>
                    <Badge tone={user.activoSgie ? 'success' : 'neutral'}>{user.activoSgie ? 'SGIE habilitado' : 'SGIE deshabilitado'}</Badge></td>
                  <td className="p-3">{user.equipo ?? 'Sin equipo'}</td>
                  <td className="p-3 text-xs text-text-secondary">
                    <p>{user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString('es-HN') : 'Sin actividad'}</p>
                    <p>{user.expedientesAsignados} expedientes</p>
                  </td>
                  <td className="p-3"><div className="flex justify-end gap-1 flex-wrap">
                    <Button variant="ghost" size="sm"
                      loading={busy === `${user.id}:acceso-sgie`}
                      onClick={() => patch(user.id, 'acceso-sgie', { habilitado: !user.activoSgie }, user.activoSgie ? 'Acceso SGIE deshabilitado' : 'Acceso SGIE habilitado')}
                      aria-label="Cambiar acceso SGIE">{user.activoSgie ? <ShieldOff size={14} /> : <Shield size={14} />}</Button>
                    <Button variant="ghost" size="sm"
                      loading={busy === `${user.id}:bloqueo`}
                      onClick={() => patch(user.id, 'bloqueo', { bloqueado: !user.bloqueado }, user.bloqueado ? 'Cuenta reactivada' : 'Cuenta suspendida')}
                      aria-label="Suspender o reactivar"><Ban size={14} /></Button>
                    <Button variant="ghost" size="sm"
                      loading={busy === `${user.id}:sesiones`}
                      onClick={() => patch(user.id, 'sesiones', {}, 'Sesiones revocadas')}
                      aria-label="Revocar sesiones"><CalendarClock size={14} /></Button>
                    <Link href={`/intranet/admin/usuarios/${user.id}`}><Button variant="ghost" size="sm" aria-label="Gestionar"><Edit3 size={14} /></Button></Link>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-6 text-center text-sm text-text-muted">Cargando usuarios…</p>}
          {!loading && rows.length === 0 && <p className="p-6 text-center text-sm text-text-muted">No hay resultados.</p>}
        </div>
      </Card>
    </div>
  );
}
