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
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'abogado', password: '' });

  useEffect(() => {
    fetch(`/api/admin/usuarios?limit=100`)
      .then(r => r.json())
      .then(data => { const u = (data.usuarios ?? []).find((x: { id: string }) => x.id === params.id); if (u) setForm({ nombre: u.nombre, email: u.email, rol: u.rol, password: '' }); })
      .catch(() => toast.danger('Error al cargar usuario'))
      .finally(() => setLoading(false));
  }, [params.id, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = { nombre: form.nombre, email: form.email, rol: form.rol };
      if (form.password) body.password = form.password;
      const res = await fetch(`/api/admin/usuarios/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Usuario actualizado');
      router.push('/intranet/admin/usuarios');
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al guardar'); }
    finally { setSaving(false); }
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
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Nueva contraseña (dejar vacío para no cambiar)</label>
            <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
          </div>
          <Button type="submit" variant="primary" loading={saving}><Save size={14} /> Guardar cambios</Button>
        </form>
      </Card>
    </div>
  );
}