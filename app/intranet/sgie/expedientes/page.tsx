'use client';

/**
 * SGIE — Listado y alta de expedientes (Sprint 0).
 *
 * Sprint 0 corrige el alta: ahora asocia cliente y tipo de procedimiento real,
 * e instancia el checklist desde la definición del procedimiento (no hardcodeado).
 *
 * Fuentes:
 *   - GET  /api/sgie/expedientes?q=...                (listado con scope)
 *   - POST /api/sgie/expedientes                      (alta; backend siembra requisitos)
 *   - GET  /api/sgie/clientes                          (selector de cliente)
 *   - GET  /api/sgie/tipos-procedimiento               (selector de procedimiento activo)
 *
 * Query param soportado: ?clienteId=...&clienteNombre=...  (preselección desde Clientes).
 *
 * Diseño: design tokens. Responsive. Traducción de estados vía lib/sgie/estados.
 */
import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, FolderKanban, Search, Scale, ArrowLeft, Users, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { traducirEstadoExpediente, traducirPrioridad } from '@/lib/sgie/estados';

interface ExpedienteItem {
  id: string;
  numeroInterno: string;
  estado: string;
  prioridad: string;
  clienteNombre: string | null;
  tipoProcedimientoNombre: string | null;
  actualizadoEn: string | null;
}

interface ClienteOpcion {
  id: string;
  nombre: string;
}

interface ProcedimientoOpcion {
  id: string;
  nombre: string;
  areaJuridica: string | null;
}

type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';

interface FormState {
  clienteId: string;
  tipoProcedimientoId: string;
  resumen: string;
  prioridad: Prioridad;
}

export default function SgieExpedientesPage() {
  // useSearchParams requiere Suspense (Next.js 16 App Router). Patrón canónico
  // del repo: ver app/intranet/admin/delito-form/page.tsx.
  return (
    <Suspense fallback={
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    }>
      <SgieExpedientesInner />
    </Suspense>
  );
}

function SgieExpedientesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const [expedientes, setExpedientes] = useState<ExpedienteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  // showForm se inicializa abierto si viene clienteId en query param (desde /clientes).
  const [showForm, setShowForm] = useState(() => Boolean(searchParams.get('clienteId')));
  const [saving, setSaving] = useState(false);
  // Preselección desde query param (vengo desde Clientes). Se lee UNA sola vez
  // en el estado inicial (sin effect) para evitar setState síncrono en effect.
  const [form, setForm] = useState<FormState>(() => ({
    clienteId: searchParams.get('clienteId') ?? '',
    tipoProcedimientoId: '',
    resumen: '',
    prioridad: 'media',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Selectores.
  const [clientes, setClientes] = useState<ClienteOpcion[]>([]);
  const [procedimientos, setProcedimientos] = useState<ProcedimientoOpcion[]>([]);
  const [cargandoSelectores, setCargandoSelectores] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(searchParams.get('clienteNombre') ?? '');
  const mounted = useRef(false);

  const fetchExpedientes = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (q) params.set('q', q);
    fetch(`/api/sgie/expedientes?${params}`)
      .then((r) => r.json())
      .then((data) => { setExpedientes(data.expedientes ?? []); setTotal(data.total ?? 0); })
      .catch(() => toast.danger('Error al cargar expedientes'))
      .finally(() => setLoading(false));
  }, [q, toast]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fetchExpedientes();
    }
  }, [fetchExpedientes]);

  // La preselección desde query param (clienteId/clienteNombre) se resuelve en
  // los inicializadores de useState de `form`, `showForm` y `buscandoCliente`,
  // sin effect, para evitar setState síncrono en effect.

  /** Carga perezosa de clientes y procedimientos al abrir el formulario. */
  const cargarSelectores = useCallback(async () => {
    setCargandoSelectores(true);
    try {
      const [cliRes, procRes] = await Promise.all([
        fetch('/api/sgie/clientes?limit=100', { credentials: 'include' }),
        fetch('/api/sgie/tipos-procedimiento?limit=200', { credentials: 'include' }),
      ]);
      if (cliRes.ok) {
        const d = await cliRes.json();
        setClientes((d.clientes ?? []).map((c: { id: string; nombre: string }) => ({ id: c.id, nombre: c.nombre })));
      }
      if (procRes.ok) {
        const d = await procRes.json();
        setProcedimientos((d.tiposProcedimiento ?? []).map((p: { id: string; nombre: string; areaJuridica: string | null }) => ({
          id: p.id, nombre: p.nombre, areaJuridica: p.areaJuridica,
        })));
      }
    } catch {
      toast.danger('No se pudieron cargar clientes y procedimientos');
    } finally {
      setCargandoSelectores(false);
    }
  }, [toast]);

  useEffect(() => {
    if (showForm && clientes.length === 0 && procedimientos.length === 0) {
      cargarSelectores(); // eslint-disable-line react-hooks/set-state-in-effect -- carga perezosa al abrir formulario
    }
  }, [showForm, clientes.length, procedimientos.length, cargarSelectores]);

  /** Búsqueda reactiva de cliente dentro del selector. */
  useEffect(() => {
    if (!showForm) return;
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (buscandoCliente.trim()) params.set('q', buscandoCliente.trim());
      try {
        const res = await fetch(`/api/sgie/clientes?${params}`, { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          setClientes((d.clientes ?? []).map((c: { id: string; nombre: string }) => ({ id: c.id, nombre: c.nombre })));
        }
      } catch { /* non-critical */ }
    }, 300);
    return () => clearTimeout(t);
  }, [buscandoCliente, showForm]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const v: Partial<Record<keyof FormState, string>> = {};
    if (!form.clienteId) v.clienteId = 'Seleccione un cliente.';
    if (!form.tipoProcedimientoId) v.tipoProcedimientoId = 'Seleccione un tipo de procedimiento.';
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/sgie/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: form.clienteId,
          tipoProcedimientoId: form.tipoProcedimientoId,
          resumen: form.resumen.trim() || undefined,
          prioridad: form.prioridad,
          // NO se envían requisitosIniciales: el backend los siembra desde la
          // definición del procedimiento (lib/sgie/expedientes-db.ts, Sprint 0).
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Error al crear expediente'); }
      const data = await res.json();
      toast.success(`Expediente ${data.expediente.numeroInterno} creado`, 'Se ha asociado al cliente y procedimiento.');
      // Redirige al detalle si la API devuelve id.
      if (data.expediente?.id) {
        router.push(`/intranet/sgie/expedientes/${data.expediente.id}`);
      } else {
        setShowForm(false);
        setForm({ clienteId: '', tipoProcedimientoId: '', resumen: '', prioridad: 'media' });
        fetchExpedientes();
      }
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : 'Error al crear expediente');
    } finally {
      setSaving(false);
    }
  };

  const prioridadTone = (p: string) => {
    switch (p) {
      case 'urgente': return 'text-danger';
      case 'alta': return 'text-warning';
      case 'media': return 'text-info';
      default: return 'text-text-muted';
    }
  };

  const clienteSeleccionado = clientes.find((c) => c.id === form.clienteId);
  const procedimientoSeleccionado = procedimientos.find((p) => p.id === form.tipoProcedimientoId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expedientes"
        subtitle={`${total} expedientes ${user?.rol === 'admin' ? '(vista administrador)' : 'asignados'}`}
        icon={<FolderKanban size={20} className="text-accent" />}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Nuevo expediente
          </Button>
        }
      />

      {showForm && (
        <Card padding="md">
          <form onSubmit={handleCrear} className="space-y-3">
            <div className="flex items-center gap-2 mb-1 pb-3 border-b border-border-light">
              <ClipboardList size={16} className="text-accent-dark" />
              <h2 className="font-bold text-sm text-primary">Crear nuevo expediente</h2>
            </div>
            <p className="text-xxs text-text-muted">
              El expediente se crea con usted como responsable y estado inicial <code className="text-text-secondary">creado</code>.
              El checklist documental se instancia automáticamente desde el procedimiento elegido.
              Las transiciones críticas (validar, firmar, finalizar) requerirán su acción explícita.
            </p>

            {cargandoSelectores && (
              <div className="flex items-center gap-2 text-xxs text-text-muted py-2">
                <Spinner size="sm" /> Cargando clientes y procedimientos…
              </div>
            )}

            {/* Selector de cliente */}
            <Field label="Cliente" required htmlFor="exp-cliente" error={errors.clienteId}>
              <div className="space-y-2">
                <Input
                  id="exp-cliente-buscar"
                  value={buscandoCliente}
                  onChange={(e) => setBuscandoCliente(e.target.value)}
                  placeholder="Buscar cliente por nombre, identidad o email…"
                  iconLeft={<Search size={14} />}
                />
                <select
                  id="exp-cliente"
                  value={form.clienteId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, clienteId: e.target.value }));
                    if (errors.clienteId) setErrors((er) => ({ ...er, clienteId: undefined }));
                  }}
                  className={cn(
                    'w-full h-10 rounded-md border bg-surface px-3 text-sm text-text outline-none transition-all',
                    'hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]',
                    errors.clienteId ? 'border-danger' : 'border-border',
                    !form.clienteId && 'text-text-muted',
                  )}
                >
                  <option value="">— Seleccione un cliente —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                {clienteSeleccionado && (
                  <p className="text-xxs text-success flex items-center gap-1">
                    <Users size={11} /> Se creará el expediente para: <strong>{clienteSeleccionado.nombre}</strong>
                  </p>
                )}
              </div>
            </Field>

            {/* Selector de procedimiento */}
            <Field label="Tipo de procedimiento" required htmlFor="exp-procedimiento" error={errors.tipoProcedimientoId}
              hint="El checklist documental se genera desde la definición del procedimiento elegido.">
              {procedimientos.length === 0 && !cargandoSelectores ? (
                <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xxs text-warning">
                  No hay procedimientos activos todavía. Un administrador debe activar procedimientos desde el panel de administración para poder asociarlos a nuevos expedientes.
                </div>
              ) : (
                <select
                  id="exp-procedimiento"
                  value={form.tipoProcedimientoId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, tipoProcedimientoId: e.target.value }));
                    if (errors.tipoProcedimientoId) setErrors((er) => ({ ...er, tipoProcedimientoId: undefined }));
                  }}
                  className={cn(
                    'w-full h-10 rounded-md border bg-surface px-3 text-sm text-text outline-none transition-all',
                    'hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]',
                    errors.tipoProcedimientoId ? 'border-danger' : 'border-border',
                    !form.tipoProcedimientoId && 'text-text-muted',
                  )}
                >
                  <option value="">— Seleccione un procedimiento —</option>
                  {procedimientos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.areaJuridica ? ` · ${p.areaJuridica}` : ''}
                    </option>
                  ))}
                </select>
              )}
              {procedimientoSeleccionado && (
                <p className="text-xxs text-info mt-1.5">
                  Procedimiento: <strong>{procedimientoSeleccionado.nombre}</strong>
                </p>
              )}
            </Field>

            {/* Resumen */}
            <Field label="Resumen / motivo" htmlFor="exp-resumen" hint="Breve descripción del asunto (opcional).">
              <textarea
                id="exp-resumen"
                value={form.resumen}
                onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
                placeholder="Describa brevemente el asunto del expediente"
                rows={2}
                maxLength={2000}
                className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-all resize-y min-h-[72px] hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
              />
            </Field>

            {/* Prioridad */}
            <Field label="Prioridad" htmlFor="exp-prioridad">
              <select
                id="exp-prioridad"
                value={form.prioridad}
                onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as Prioridad }))}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </Field>

            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" loading={saving}>Crear expediente</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <form onSubmit={(e) => { e.preventDefault(); fetchExpedientes(); }} className="flex gap-2">
        <div className="flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número, cliente o resumen..." iconLeft={<Search size={14} />} />
        </div>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : expedientes.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<FolderKanban size={28} />}
            title={q ? 'Sin resultados' : 'No tiene expedientes todavía'}
            description={q ? 'Pruebe con otros términos de búsqueda.' : 'Cree su primer expediente para empezar a gestionar su cartera.'}
            action={!q ? <Button variant="primary" size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> Nuevo expediente</Button> : undefined}
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">N.º interno</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Cliente</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden sm:table-cell">Procedimiento</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Estado</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Prioridad</th>
                  <th className="text-right p-3 text-xxs font-bold uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {expedientes.map((e) => (
                  <tr key={e.id} className="border-b border-border hover:bg-surface-alt transition-colors">
                    <td className="p-3 font-mono text-xs font-semibold text-text">{e.numeroInterno}</td>
                    <td className="p-3 text-text-secondary">{e.clienteNombre ?? '—'}</td>
                    <td className="p-3 text-text-secondary hidden sm:table-cell">{e.tipoProcedimientoNombre ?? '—'}</td>
                    <td className="p-3"><EstadoBadge estado={e.estado} /></td>
                    <td className="p-3">
                      <span className={cn('text-xxs font-bold uppercase', prioridadTone(e.prioridad))}>{traducirPrioridad(e.prioridad)}</span>
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/intranet/sgie/expedientes/${e.id}`}>
                        <Button variant="ghost" size="sm">Abrir <Scale size={12} /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
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
