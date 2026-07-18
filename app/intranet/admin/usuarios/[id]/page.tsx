'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import Link from 'next/link';

export default function AdminEditarUsuarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'abogado' });
  const [capacidades, setCapacidades] = useState<string[]>([]);
  const [disponibles, setDisponibles] = useState<string[]>([]);
  const [savingCapabilities, setSavingCapabilities] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/usuarios?limit=100`)
      .then(r => r.json())
      .then(data => { const u = (data.usuarios ?? []).find((x: { id: string }) => x.id === params.id); if (u) setForm({ nombre: u.nombre, email: u.email, rol: u.rol }); })
      .catch(() => toast.danger('Error al cargar usuario'))
      .finally(() => setLoading(false));
    fetch(`/api/admin/usuarios/${params.id}/capacidades`)
      .then(r => r.json())
      .then(data => {
        setCapacidades(data.adicionales ?? []);
        setDisponibles(data.disponibles ?? []);
      })
      .catch(() => toast.danger('Error al cargar capacidades'));
  }, [params.id, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = { nombre: form.nombre, email: form.email, rol: form.rol };
      const res = await fetch(`/api/admin/usuarios/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Usuario actualizado');
      router.push('/intranet/admin/usuarios');
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const saveCapabilities = async () => {
    setSavingCapabilities(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${params.id}/capacidades`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacidades }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast.success('Capacidades adicionales actualizadas');
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al guardar capacidades');
    } finally {
      setSavingCapabilities(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4 max-w-lg">
      <PageHeader
        title="Editar Usuario"
        actions={<Link href="/intranet/admin/usuarios"><Button variant="ghost" size="sm"><ArrowLeft size={14} /> Volver</Button></Link>}
      />
      <Card padding="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Nombre</label>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Rol</label>
            <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]">
              <option value="abogado">Abogado</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <p className="text-xs text-text-secondary">
            Las contraseñas pertenecen exclusivamente al usuario. Para recuperar acceso debe utilizarse el flujo seguro de restablecimiento.
          </p>
          <Button type="submit" variant="primary" loading={saving}><Save size={14} /> Guardar cambios</Button>
        </form>
      </Card>
      <Card padding="md">
        <h2 className="font-bold text-primary mb-1">Capacidades adicionales</h2>
        <p className="text-xs text-text-secondary mb-3">
          Se suman a las capacidades heredadas del rol. Para cambiar el conjunto base, cambie el rol.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {disponibles.map((capacidad) => (
            <label key={capacidad} className="flex items-center gap-2 text-xs rounded-md border border-border p-2">
              <input
                type="checkbox"
                checked={capacidades.includes(capacidad)}
                onChange={(e) => setCapacidades((actuales) => e.target.checked
                  ? [...actuales, capacidad]
                  : actuales.filter((item) => item !== capacidad))}
              />
              <span className="font-mono">{capacidad}</span>
            </label>
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-3"
          loading={savingCapabilities} onClick={saveCapabilities}>
          Guardar capacidades
        </Button>
      </Card>
      <Card padding="md">
        <h2 className="font-bold text-primary mb-1">Historial de cambios</h2>
        <p className="text-xs text-text-secondary mb-3">
          Los cambios de rol, capacidades y estado quedan registrados en la auditoría administrativa.
        </p>
        <Link href="/intranet/admin/auditoria">
          <Button type="button" variant="ghost">Abrir auditoría</Button>
        </Link>
      </Card>
    </div>
  );
}
