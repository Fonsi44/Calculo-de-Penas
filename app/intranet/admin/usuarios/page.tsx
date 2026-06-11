'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2, Key, Shield, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  creadoEn: string;
}

export default function AdminUsuariosPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '', rol: 'abogado' });
  const [saving, setSaving] = useState(false);

  const fetchUsuarios = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (q) params.set('q', q);
    fetch(`/api/admin/usuarios?${params}`)
      .then(r => r.json())
      .then(data => {
        setUsuarios(data.usuarios ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => toast.danger('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsuarios(); }, [page]); // eslint-disable-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsuarios();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Usuario creado');
      setShowForm(false);
      setFormData({ email: '', password: '', nombre: '', rol: 'abogado' });
      fetchUsuarios();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    const ok = await confirm({ title: `¿Eliminar a ${nombre}?`, description: 'Esta acción no se puede deshacer.' });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Usuario eliminado');
      fetchUsuarios();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const handlePasswordReset = async (id: string, nombre: string) => {
    const pwd = prompt(`Nueva contraseña para ${nombre} (mínimo 6 caracteres):`);
    if (!pwd || pwd.length < 6) {
      if (pwd) toast.danger('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      const res = await fetch(`/api/admin/usuarios/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success('Contraseña actualizada');
    } catch {
      toast.danger('Error al cambiar contraseña');
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Usuarios</h1>
          <p className="text-xs text-text-secondary">{total} usuarios registrados</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} className="mr-1" /> Nuevo usuario
        </Button>
      </div>

      {showForm && (
        <Card padding="md">
          <form onSubmit={handleCreate} className="space-y-3">
            <h2 className="font-bold text-sm text-primary">Crear nuevo usuario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xxs font-semibold text-text-secondary mb-1">Nombre</label>
                <Input
                  value={formData.nombre}
                  onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div>
                <label className="block text-xxs font-semibold text-text-secondary mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  placeholder="@pinedayasociadoshn.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xxs font-semibold text-text-secondary mb-1">Contraseña</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div>
                <label className="block text-xxs font-semibold text-text-secondary mb-1">Rol</label>
                <select
                  value={formData.rol}
                  onChange={e => setFormData(f => ({ ...f, rol: e.target.value }))}
                  className="w-full h-9 rounded-md border border-border-light bg-surface px-3 text-sm"
                >
                  <option value="abogado">Abogado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={saving}>Crear usuario</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre o email..."
            iconLeft={<Search size={14} />}
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : usuarios.length === 0 ? (
        <Card padding="md">
          <p className="text-center text-text-secondary text-sm">No se encontraron usuarios</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase">Nombre</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Email</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Rol</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Creado</th>
                  <th className="text-right p-3 text-xxs font-bold uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-border-light hover:bg-surface-alt">
                    <td className="p-3 font-medium text-text">{u.nombre}</td>
                    <td className="p-3 text-text-secondary">{u.email}</td>
                    <td className="p-3">
                      <Badge tone={u.rol === 'admin' ? 'warning' : 'neutral'}>
                        {u.rol === 'admin' ? <Shield size={10} className="mr-1" /> : <User size={10} className="mr-1" />}
                        {u.rol}
                      </Badge>
                    </td>
                    <td className="p-3 text-text-secondary text-xxs">{formatDate(u.creadoEn)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/intranet/admin/usuarios/${u.id}`}>
                          <Button variant="ghost" size="sm" aria-label="Editar">
                            <Edit3 size={14} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handlePasswordReset(u.id, u.nombre)} aria-label="Cambiar contraseña">
                          <Key size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id, u.nombre)} aria-label="Eliminar">
                          <Trash2 size={14} className="text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
