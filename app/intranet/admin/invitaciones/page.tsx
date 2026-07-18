'use client';

import { useCallback, useEffect, useState } from 'react';
import { MailPlus, RefreshCw, ShieldX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

type Invitation = {
  id: string; nombre: string; email: string; rolInicial: string; accesoSgie: boolean;
  estado: string; expiraEn: string; emailEstado: string;
};

const CAPACIDADES = [
  'admin.access', 'users.read', 'users.manage', 'invitations.manage',
  'roles.manage', 'teams.manage', 'audit.read', 'system.health.read',
  'sgie.access', 'cases.read', 'cases.create', 'cases.assign', 'cases.manage',
  'calendar.read', 'calendar.manage_own', 'calendar.manage_team', 'communications.manage',
] as const;

const INITIAL = {
  nombre: '',
  email: '',
  rolInicial: 'abogado',
  accesoSgie: true,
  capacidades: [] as string[],
};

export default function InvitationsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Invitation[]>([]);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/invitaciones');
    const body = await response.json();
    if (response.ok) setRows(body.invitaciones ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- carga remota inicial

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo crear la invitación');
      const emailState = body.invitacion.emailEstado;
      if (emailState === 'enviado') toast.success('Invitación enviada');
      else toast.warning('Invitación guardada; el correo no fue enviado');
      setForm(INITIAL);
      await load();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Error al invitar');
    } finally {
      setSaving(false);
    }
  }

  async function action(id: string, kind: 'reenviar' | 'revocar') {
    const response = await fetch(`/api/admin/invitaciones/${id}/${kind}`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.danger(body.error || 'No se pudo completar la acción');
      return;
    }
    toast.success(kind === 'reenviar' ? 'Invitación reemplazada' : 'Invitación revocada');
    await load();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Invitaciones" subtitle="Alta exclusiva mediante enlace seguro"
        icon={<MailPlus size={20} className="text-accent" />} />
      <Card padding="md">
        <form onSubmit={invite} className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="Nombre" required><Input value={form.nombre}
            onChange={(event) => setForm({ ...form, nombre: event.target.value })} required /></Field>
          <Field label="Correo" required><Input type="email" value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })} required /></Field>
          <Field label="Rol inicial" required>
            <select value={form.rolInicial} onChange={(event) => setForm({ ...form, rolInicial: event.target.value })}
              className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm">
              <option value="abogado">Abogado</option>
              <option value="supervisor">Supervisor</option>
              <option value="administrador">Administrador</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={form.accesoSgie}
              onChange={(event) => setForm({ ...form, accesoSgie: event.target.checked })} />
            Habilitar acceso SGIE al aceptar
          </label>
          <fieldset className="md:col-span-2 mb-4">
            <legend className="text-xs font-semibold text-text-secondary mb-2">
              Capacidades adicionales
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {CAPACIDADES.map((capacidad) => (
                <label key={capacidad}
                  className="flex items-center gap-2 rounded-md border border-border p-2 text-xs">
                  <input type="checkbox" checked={form.capacidades.includes(capacidad)}
                    onChange={(event) => setForm((actual) => ({
                      ...actual,
                      capacidades: event.target.checked
                        ? [...actual.capacidades, capacidad]
                        : actual.capacidades.filter((item) => item !== capacidad),
                    }))} />
                  <span className="font-mono">{capacidad}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" loading={saving}><MailPlus size={14} /> Enviar invitación</Button>
          </div>
        </form>
      </Card>
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3">Persona</th><th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Estado</th><th className="text-left p-3">Correo</th>
              <th className="text-right p-3">Acciones</th>
            </tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border-light">
                  <td className="p-3"><p className="font-semibold">{row.nombre}</p><p className="text-xs text-text-muted">{row.email}</p></td>
                  <td className="p-3">{row.rolInicial}{row.accesoSgie ? ' · SGIE' : ''}</td>
                  <td className="p-3"><Badge tone={row.estado === 'pendiente' ? 'warning' : row.estado === 'aceptada' ? 'success' : 'neutral'}>{row.estado}</Badge></td>
                  <td className="p-3">{row.emailEstado}</td>
                  <td className="p-3"><div className="flex justify-end gap-1">
                    {row.estado === 'pendiente' && <>
                      <Button variant="ghost" size="sm" onClick={() => action(row.id, 'reenviar')} aria-label="Reenviar"><RefreshCw size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => action(row.id, 'revocar')} aria-label="Revocar"><ShieldX size={14} /></Button>
                    </>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
