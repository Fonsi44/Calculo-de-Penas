'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit3, Trash2, Key, Shield, User, Copy, Check,
  Lock, Unlock, Mail, Scale, Ban, Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  active: boolean | null;
  bloqueado: boolean | null;
  bloqueadoMotivo: string | null;
  bloqueadoEn: string | null;
  ultimoAcceso: string | null;
  correoCorporativoVinculado: boolean | null;
  debeCambiarPassword: boolean | null;
  creadoEn: string | null;
  expedientesAsignados: number;
}

type EstadoFiltro = 'todos' | 'activos' | 'bloqueados' | 'inactivos';

export default function AdminUsuariosPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '', rol: 'abogado' });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [tempCreds, setTempCreds] = useState<{ nombre: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
  const [bloqueoModal, setBloqueoModal] = useState<{ id: string; nombre: string } | null>(null);
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');

  const fetchUsuarios = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (q) params.set('q', q);
    if (estadoFiltro !== 'todos') params.set('estado', estadoFiltro);
    fetch(`/api/admin/usuarios?${params}`)
      .then((r) => r.json())
      .then((data) => { setUsuarios(data.usuarios ?? []); setTotal(data.total ?? 0); })
      .catch(() => toast.danger('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, [page, q, estadoFiltro, toast]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]); // eslint-disable-line react-hooks/set-state-in-effect -- carga inicial

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsuarios();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Usuario creado');
      setShowForm(false);
      setFormData({ email: '', password: '', nombre: '', rol: 'abogado' });
      fetchUsuarios();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al crear usuario'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!await confirm({ title: `¿Eliminar a ${nombre}?`, description: 'Esta acción desactiva el usuario (soft-delete). No se puede deshacer.' })) return;
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Usuario desactivado');
      fetchUsuarios();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al eliminar'); }
  };

  const handlePasswordReset = async (id: string, nombre: string) => {
    const ok = await confirm({
      title: `Restablecer contraseña de ${nombre}`,
      description: 'Se generará una contraseña temporal aleatoria. El usuario deberá cambiarla en su próximo inicio de sesión. La verás a continuación una sola vez.',
      confirmLabel: 'Generar contraseña',
      tone: 'warning',
    });
    if (!ok) return;
    setResetting(id);
    try {
      const res = await fetch(`/api/admin/usuarios/${id}/reset-password`, { method: 'POST' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Error'); }
      const data = await res.json();
      setTempCreds({ nombre, tempPassword: data.tempPassword });
      setCopied(false);
      toast.success('Contraseña temporal generada');
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al restablecer contraseña');
    } finally {
      setResetting(null);
    }
  };

  const handleToggleRol = async (u: Usuario) => {
    const nuevoRol = u.rol === 'abogado' ? 'admin' : 'abogado';
    const ok = await confirm({
      title: `Cambiar rol de ${u.nombre}`,
      description: `¿Asignar rol ${nuevoRol}? ${nuevoRol === 'abogado' ? 'Se habilitará su perfil SGIE.' : 'Tendrá acceso completo al panel de administración.'}`,
      confirmLabel: `Asignar ${nuevoRol}`,
      tone: nuevoRol === 'admin' ? 'warning' : 'primary',
    });
    if (!ok) return;
    setAccionEnCurso(u.id);
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}/rol`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol: nuevoRol }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(`Rol actualizado a ${nuevoRol}`);
      fetchUsuarios();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al cambiar rol'); }
    finally { setAccionEnCurso(null); }
  };

  const abrirBloqueoModal = (u: Usuario) => {
    setBloqueoMotivo('');
    setBloqueoModal({ id: u.id, nombre: u.nombre });
  };

  const handleBloqueo = async (bloquear: boolean) => {
    if (!bloqueoModal) return;
    setAccionEnCurso(bloqueoModal.id);
    try {
      const res = await fetch(`/api/admin/usuarios/${bloqueoModal.id}/bloqueo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloqueado: bloquear, motivo: bloquear ? bloqueoMotivo || undefined : undefined }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(bloquear ? 'Usuario bloqueado' : 'Usuario desbloqueado');
      setBloqueoModal(null);
      fetchUsuarios();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al cambiar bloqueo'); }
    finally { setAccionEnCurso(null); }
  };

  const handleVinculoCorreo = async (u: Usuario) => {
    if (u.correoCorporativoVinculado) {
      const ok = await confirm({
        title: `Desvincular correo corporativo de ${u.nombre}`,
        description: 'Se marcará el correo corporativo como no verificado.',
      });
      if (!ok) return;
    }
    setAccionEnCurso(u.id);
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}/vinculo-correo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vinculado: !u.correoCorporativoVinculado,
          correoCorporativo: !u.correoCorporativoVinculado ? u.email : undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(u.correoCorporativoVinculado ? 'Correo desvinculado' : 'Correo corporativo vinculado');
      fetchUsuarios();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al vincular correo'); }
    finally { setAccionEnCurso(null); }
  };

  const copyTempPassword = async () => {
    if (!tempCreds) return;
    try {
      await navigator.clipboard.writeText(tempCreds.tempPassword);
      setCopied(true);
      toast.success('Contraseña copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.danger('No se pudo copiar automáticamente. Selecciona el texto manualmente.');
    }
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return 'Nunca';
    try {
      return new Date(d).toLocaleString('es-HN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuarios y Accesos"
        subtitle={`${total} usuarios · gestión de roles, bloqueos y vínculos SGIE`}
        actions={<Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Nuevo usuario</Button>}
      />

      {showForm && (
        <Card padding="md">
          <form onSubmit={handleCreate} className="space-y-3">
            <h2 className="font-bold text-sm text-primary">Crear nuevo usuario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Nombre</label>
                <Input value={formData.nombre} onChange={(e) => setFormData((f) => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} placeholder="@pinedayasociadoshn.com" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Contraseña</label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Rol</label>
                <select value={formData.rol} onChange={(e) => setFormData((f) => ({ ...f, rol: e.target.value }))}
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]">
                  <option value="abogado">Abogado (acceso SGIE)</option>
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

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o email..." iconLeft={<Search size={14} />} />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-text-muted flex-shrink-0" />
          {(['todos', 'activos', 'bloqueados', 'inactivos'] as EstadoFiltro[]).map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => { setEstadoFiltro(est); setPage(1); }}
              className={`h-9 px-3 rounded-md text-xs font-semibold capitalize transition-colors ${
                estadoFiltro === est
                  ? 'bg-accent/15 text-primary border border-accent/30'
                  : 'bg-surface-alt text-text-secondary border border-border-light hover:bg-surface'
              }`}
            >
              {est}
            </button>
          ))}
          <Button type="submit" variant="secondary" size="sm" className="ml-1">Buscar</Button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : usuarios.length === 0 ? (
        <Card padding="md"><p className="text-center text-text-secondary text-sm">No se encontraron usuarios con los filtros actuales</p></Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase">Nombre</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Rol</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Estado</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Último acceso</th>
                  <th className="text-center p-3 text-xxs font-bold uppercase">Exp.</th>
                  <th className="text-right p-3 text-xxs font-bold uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const estaBloqueado = Boolean(u.bloqueado);
                  const inactivo = !u.active;
                  return (
                    <tr key={u.id} className="border-b border-border hover:bg-surface-alt">
                      <td className="p-3">
                        <div className="font-medium text-text">{u.nombre}</div>
                        <div className="text-xxs text-text-muted flex items-center gap-1">
                          <Mail size={10} /> {u.email}
                          {u.correoCorporativoVinculado && (
                            <span className="text-success flex items-center gap-0.5" title="Correo corporativo vinculado">
                              <Check size={10} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge tone={u.rol === 'admin' ? 'warning' : 'neutral'}>
                          {u.rol === 'admin' ? <Shield size={10} className="mr-1" /> : <Scale size={10} className="mr-1" />}{u.rol}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {estaBloqueado ? (
                          <Badge tone="danger"><Ban size={10} className="mr-1" />Bloqueado</Badge>
                        ) : inactivo ? (
                          <Badge tone="neutral"><User size={10} className="mr-1" />Inactivo</Badge>
                        ) : (
                          <Badge tone="success"><Check size={10} className="mr-1" />Activo</Badge>
                        )}
                        {u.debeCambiarPassword && (
                          <div className="text-xxs text-warning mt-0.5">Debe cambiar contraseña</div>
                        )}
                      </td>
                      <td className="p-3 text-text-secondary text-xxs">{formatDateTime(u.ultimoAcceso)}</td>
                      <td className="p-3 text-center">
                        {u.rol === 'abogado' ? (
                          <span className="font-bold text-text">{u.expedientesAsignados}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Link href={`/intranet/admin/usuarios/${u.id}`}>
                            <Button variant="ghost" size="sm" aria-label="Editar"><Edit3 size={14} /></Button>
                          </Link>
                          {/* Toggle rol abogado/admin */}
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={accionEnCurso === u.id}
                            onClick={() => handleToggleRol(u)}
                            aria-label={u.rol === 'abogado' ? 'Promover a admin' : 'Bajar a abogado'}
                            title={u.rol === 'abogado' ? 'Promover a administrador' : 'Cambiar a abogado (SGIE)'}
                          >
                            {u.rol === 'abogado' ? <Shield size={14} /> : <Scale size={14} />}
                          </Button>
                          {/* Bloquear / desbloquear */}
                          {estaBloqueado ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={accionEnCurso === u.id}
                              onClick={() => { setBloqueoModal(null); handleBloqueoDirect(u.id, false); }}
                              aria-label="Desbloquear"
                              title="Desbloquear acceso"
                            >
                              <Unlock size={14} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={accionEnCurso === u.id}
                              onClick={() => abrirBloqueoModal(u)}
                              aria-label="Bloquear"
                              title="Bloquear acceso"
                            >
                              <Lock size={14} className="text-warning" />
                            </Button>
                          )}
                          {/* Vincular correo corporativo (solo abogados) */}
                          {u.rol === 'abogado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={accionEnCurso === u.id}
                              onClick={() => handleVinculoCorreo(u)}
                              aria-label={u.correoCorporativoVinculado ? 'Desvincular correo' : 'Vincular correo corporativo'}
                              title={u.correoCorporativoVinculado ? 'Desvincular correo corporativo' : 'Vincular correo corporativo'}
                            >
                              <Mail size={14} className={u.correoCorporativoVinculado ? 'text-success' : ''} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" loading={resetting === u.id} onClick={() => handlePasswordReset(u.id, u.nombre)} aria-label="Restablecer contraseña"><Key size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id, u.nombre)} aria-label="Eliminar"><Trash2 size={14} className="text-danger" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal bloqueo con motivo */}
      <Modal
        open={Boolean(bloqueoModal)}
        onClose={() => setBloqueoModal(null)}
        title={`Bloquear acceso de ${bloqueoModal?.nombre ?? ''}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setBloqueoModal(null)}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={accionEnCurso === bloqueoModal?.id} onClick={() => handleBloqueo(true)}>
              <Lock size={14} /> Bloquear acceso
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-md bg-warning-bg border border-warning/30">
            <Ban className="text-warning flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-text">
              El usuario <strong>{bloqueoModal?.nombre}</strong> no podrá iniciar sesión ni mantener una sesión activa.
              La acción queda registrada en auditoría. Es reversible.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Motivo del bloqueo (opcional)</label>
            <textarea
              value={bloqueoMotivo}
              onChange={(e) => setBloqueoMotivo(e.target.value)}
              placeholder="Ej: baja voluntaria, auditoría, sospecha de acceso indebido..."
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal contraseña temporal */}
      <Modal
        open={Boolean(tempCreds)}
        onClose={() => setTempCreds(null)}
        title="Contraseña temporal generada"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setTempCreds(null)}>Cerrar</Button>
            <Button variant="primary" size="sm" onClick={copyTempPassword}>
              {copied ? <><Check size={14} /> Copiada</> : <><Copy size={14} /> Copiar contraseña</>}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md bg-warning-bg border border-warning/30">
            <Shield className="text-warning flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-text">
              Esta contraseña de <strong>{tempCreds?.nombre}</strong> se muestra <strong>una sola vez</strong>.
              El usuario deberá cambiarla al iniciar sesión.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Contraseña temporal</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={tempCreds?.tempPassword ?? ''}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 h-9 rounded-md border border-border bg-surface-alt px-3 text-sm font-mono text-text outline-none"
              />
              <Button variant="secondary" size="sm" onClick={copyTempPassword} aria-label="Copiar">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
          <p className="text-xxs text-text-muted">
            Comunica esta contraseña al usuario por un canal seguro (en persona o teléfono). No la envíes por email sin cifrar.
          </p>
        </div>
      </Modal>
    </div>
  );

  // Helper para desbloqueo directo (sin modal).
  async function handleBloqueoDirect(id: string, bloquear: boolean) {
    setAccionEnCurso(id);
    try {
      const res = await fetch(`/api/admin/usuarios/${id}/bloqueo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloqueado: bloquear }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Usuario desbloqueado');
      fetchUsuarios();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al desbloquear'); }
    finally { setAccionEnCurso(null); }
  }
}
