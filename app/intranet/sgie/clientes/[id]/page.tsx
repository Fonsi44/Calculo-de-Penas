'use client';

/**
 * SGIE — Ficha de cliente (Sprint 1, tarea 3).
 *
 * Muestra datos del cliente, expedientes asociados (accesibles) y acciones
 * rápidas. Permite edición básica (PATCH). Estados: loading (skeleton),
 * vacío, error, éxito.
 *
 * Fuentes:
 *   - GET   /api/sgie/clientes/:id
 *   - PATCH /api/sgie/clientes/:id
 *   - GET   /api/sgie/expedientes?...  (no filtrado por cliente en API; se
 *     filtra en cliente por clienteId del resultado)
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, Mail, Phone, Contact, Building2, FileSignature,
  Pencil, Save, X as XIcon, FolderKanban, Ban, RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { DetailSkeleton, TableSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { usePromptDialog } from '@/components/ui/prompt-dialog';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { traducirEstadoExpediente } from '@/lib/sgie/estados';

interface ClienteDetalle {
  id: string;
  nombre: string;
  identidad: string | null;
  rtn: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  creadoEn: string | null;
  expedientesCount: number;
  // Sprint 5 — baja lógica.
  activo: boolean | null;
  desactivadoEn: string | null;
  motivoDesactivacion: string | null;
}

interface ExpedienteItem {
  id: string;
  numeroInterno: string;
  estado: string;
  prioridad: string;
  tipoProcedimientoNombre: string | null;
  actualizadoEn: string | null;
}

const MAX = { nombre: 300, identidad: 50, rtn: 50, email: 255, telefono: 50, notas: 2000 };

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

export default function SgieClienteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const promptDialog = usePromptDialog();
  const { user, loading: authLoading } = useAuth();
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [expedientes, setExpedientes] = useState<ExpedienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClienteDetalle | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ClienteDetalle, string>>>({});
  const mounted = useRef(false);

  const fetchCliente = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [cliRes, expRes] = await Promise.all([
        fetch(`/api/sgie/clientes/${params.id}`, { credentials: 'include' }),
        fetch(`/api/sgie/expedientes?limit=100`, { credentials: 'include' }),
      ]);
      if (cliRes.status === 404) { setError(true); return; }
      if (!cliRes.ok) throw new Error('Error');
      const cliData = await cliRes.json();
      setCliente(cliData.cliente);
      if (expRes.ok) {
        const expData = await expRes.json();
        // Filtrar expedientes del cliente (la API no filtra por clienteId).
        setExpedientes((expData.expedientes ?? []).filter(
          // El listado de expedientes no incluye clienteId en el payload público,
          // pero sí clienteNombre; usamos el nombre como heurística de filtrado
          // seguro (el scope ya se aplica en backend). Esto es presentación.
          (e: ExpedienteItem & { clienteNombre?: string | null }) =>
            (e as { clienteNombre?: string | null }).clienteNombre === cliData.cliente.nombre,
        ));
      }
    } catch {
      setError(true);
      toast.danger('No se pudo cargar el cliente');
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    if (!authLoading && user && !mounted.current) {
      mounted.current = true;
      fetchCliente();
    }
  }, [authLoading, user, fetchCliente]);

  if (authLoading || (loading && !cliente)) {
    return (
      <div className="space-y-4">
        <DetailSkeleton />
      </div>
    );
  }
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }
  if (error || !cliente) {
    return (
      <Card padding="md">
        <ErrorState
          title="Cliente no disponible"
          description="No existe o no tiene permisos para verlo."
          onRetry={() => router.push('/intranet/sgie/clientes')}
        />
      </Card>
    );
  }

  const iniciarEdicion = () => {
    setForm({ ...cliente });
    setErrors({});
    setEditando(true);
  };

  const validar = (f: ClienteDetalle): Partial<Record<keyof ClienteDetalle, string>> => {
    const e: Partial<Record<keyof ClienteDetalle, string>> = {};
    if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Email no válido.';
    return e;
  };

  const guardarEdicion = async () => {
    if (!form) return;
    const v = validar(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/sgie/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          identidad: form.identidad?.trim() || '',
          rtn: form.rtn?.trim() || '',
          email: form.email?.trim() || '',
          telefono: form.telefono?.trim() || '',
          notas: form.notas?.trim() || '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      toast.success('Cliente actualizado');
      setEditando(false);
      fetchCliente();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Sprint 5 — baja lógica.
  const desactivar = async () => {
    const motivo = await promptDialog({
      title: 'Desactivar cliente',
      description: 'El cliente quedará inactivo. No se borrarán sus expedientes ni documentos. No se podrán crear expedientes nuevos hasta reactivarlo.',
      placeholder: 'Motivo de la desactivación (obligatorio)…',
      confirmLabel: 'Desactivar',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      minLength: 3,
      maxLength: 500,
      multiline: true,
    });
    if (motivo === null) return;
    try {
      const res = await fetch(`/api/sgie/clientes/${cliente.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: false, motivoDesactivacion: motivo }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success('Cliente desactivado');
      fetchCliente();
    } catch {
      toast.danger('No se pudo desactivar');
    }
  };

  const reactivar = async () => {
    const ok = await confirm({
      title: 'Reactivar cliente',
      description: 'El cliente volverá a estar activo y podrá asociarse a expedientes nuevos.',
      confirmLabel: 'Reactivar',
      tone: 'primary',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/sgie/clientes/${cliente.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: true }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success('Cliente reactivado');
      fetchCliente();
    } catch {
      toast.danger('No se pudo reactivar');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={cliente.nombre}
        subtitle={
          <span className="flex items-center gap-2 flex-wrap">
            <span>{`${cliente.expedientesCount} ${cliente.expedientesCount === 1 ? 'expediente asociado' : 'expedientes asociados'}`}</span>
            <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border',
              cliente.activo ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20')}>
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </span>
          </span> as unknown as string
        }
        metadata={`Cliente desde ${formatFecha(cliente.creadoEn)}`}
        icon={<Users size={20} className="text-accent" />}
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push('/intranet/sgie/clientes')}>
            <ArrowLeft size={14} /> Volver
          </Button>
        }
      />

      {/* Aviso de inactivo + motivo (Sprint 5) */}
      {cliente.activo === false && (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger flex items-start gap-2">
          <Ban size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cliente inactivo</p>
            {cliente.motivoDesactivacion && <p className="mt-0.5">Motivo: {cliente.motivoDesactivacion}</p>}
            {cliente.desactivadoEn && <p className="text-xxs mt-0.5 opacity-80">Desactivado el {formatFecha(cliente.desactivadoEn)}</p>}
          </div>
        </div>
      )}

      {/* Datos principales */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-light">
          <h2 className="font-bold text-sm text-primary">Datos del cliente</h2>
          {!editando ? (
            <Button variant="secondary" size="sm" onClick={iniciarEdicion}><Pencil size={14} /> Editar</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="primary" size="sm" loading={saving} onClick={guardarEdicion}><Save size={14} /> Guardar</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditando(false)}><XIcon size={14} /> Cancelar</Button>
            </div>
          )}
        </div>

        {!editando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Dato icon={<Contact size={11} />} label="Identidad" value={cliente.identidad} />
            <Dato icon={<Building2 size={11} />} label="RTN" value={cliente.rtn} />
            <Dato icon={<Mail size={11} />} label="Email" value={cliente.email} />
            <Dato icon={<Phone size={11} />} label="Teléfono" value={cliente.telefono} />
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xxs uppercase tracking-wider text-text-muted mb-0.5">Notas internas</p>
              <p className="text-sm text-text whitespace-pre-wrap">{cliente.notas || '—'}</p>
            </div>
          </div>
        ) : (
          form && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Nombre o razón social" required htmlFor="ed-nombre" error={errors.nombre}>
                <Input id="ed-nombre" value={form.nombre} maxLength={MAX.nombre} invalid={Boolean(errors.nombre)}
                  onChange={(e) => { setForm({ ...form, nombre: e.target.value }); if (errors.nombre) setErrors({ ...errors, nombre: undefined }); }} />
              </Field>
              <Field label="Identidad (DNI)" htmlFor="ed-identidad" error={errors.identidad}>
                <Input id="ed-identidad" value={form.identidad ?? ''} maxLength={MAX.identidad}
                  onChange={(e) => setForm({ ...form, identidad: e.target.value })} />
              </Field>
              <Field label="RTN" htmlFor="ed-rtn" error={errors.rtn}>
                <Input id="ed-rtn" value={form.rtn ?? ''} maxLength={MAX.rtn}
                  onChange={(e) => setForm({ ...form, rtn: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor="ed-email" error={errors.email}>
                <Input id="ed-email" type="email" value={form.email ?? ''} maxLength={MAX.email} invalid={Boolean(errors.email)}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }} />
              </Field>
              <Field label="Teléfono" htmlFor="ed-telefono" error={errors.telefono}>
                <Input id="ed-telefono" value={form.telefono ?? ''} maxLength={MAX.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notas internas" htmlFor="ed-notas" error={errors.notas}>
                  <Textarea id="ed-notas" value={form.notas ?? ''} maxLength={MAX.notas}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })} />
                </Field>
              </div>
            </div>
          )
        )}
      </Card>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={cliente.activo === false}
          onClick={() => router.push(`/intranet/sgie/expedientes?clienteId=${cliente.id}&clienteNombre=${encodeURIComponent(cliente.nombre)}`)}
          title={cliente.activo === false ? 'Reactive el cliente para crear expedientes' : undefined}
        >
          <FileSignature size={14} /> Crear expediente
        </Button>
        {cliente.activo ? (
          <Button variant="ghost" size="sm" onClick={desactivar} className="text-danger hover:bg-danger/10">
            <Ban size={14} /> Desactivar
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={reactivar}>
            <RotateCcw size={14} /> Reactivar
          </Button>
        )}
      </div>

      {/* Expedientes asociados */}
      <Card padding="none">
        <div className="flex items-center justify-between p-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <FolderKanban size={16} className="text-accent-dark" />
            <h2 className="text-sm font-bold text-text">Expedientes ({expedientes.length})</h2>
          </div>
        </div>
        {loading ? (
          <div className="p-3"><TableSkeleton rows={3} columns={4} /></div>
        ) : expedientes.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={28} />}
            title="Sin expedientes"
            description="Este cliente aún no tiene expedientes asociados a su cargo."
            action={
              <Button variant="primary" size="sm" onClick={() => router.push(`/intranet/sgie/expedientes?clienteId=${cliente.id}&clienteNombre=${encodeURIComponent(cliente.nombre)}`)}>
                <FileSignature size={14} /> Crear expediente
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border-light">
            {expedientes.map((e) => (
              <Link key={e.id} href={`/intranet/sgie/expedientes/${e.id}`} className="flex items-center gap-3 p-3 hover:bg-surface-alt transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <FolderKanban size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">{e.numeroInterno}</p>
                  <p className="text-xxs text-text-muted truncate">{e.tipoProcedimientoNombre ?? 'Sin procedimiento'}</p>
                </div>
                <EstadoBadge estado={e.estado} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Dato({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xxs uppercase tracking-wider text-text-muted flex items-center gap-1 mb-0.5">{icon}{label}</p>
      <p className="text-sm text-text break-words">{value || '—'}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const tono = (() => {
    if (estado === 'validado' || estado === 'finalizado' || estado === 'archivado') return 'success';
    if (estado === 'pendiente_validacion_abogado' || estado === 'analisis_completado') return 'info';
    if (estado.includes('inconsisten') || estado === 'pendiente_de_firma') return 'warning';
    return 'neutral';
  })();
  const tonoClass = {
    success: 'bg-success/10 text-success border-success/20',
    info: 'bg-info/10 text-info border-info/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    neutral: 'bg-surface-alt text-text-secondary border-border',
  }[tono];
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border whitespace-nowrap', tonoClass)}>
      {traducirEstadoExpediente(estado)}
    </span>
  );
}
