'use client';

/**
 * SGIE — Tareas (Sprint 1: CRUD completo).
 *
 * Permite crear, editar, completar/reabrir y filtrar tareas. Los comentarios
 * quedan PENDIENTES (la tabla `tareas` no tiene tabla de comentarios asociada
 * en el schema; no se inventa estructura).
 *
 * Filtros: estado, prioridad, q (título/descripción).
 * Validaciones: título obligatorio, prioridad válida, vencimiento con warning
 * si es pasado (permitido).
 *
 * Fuentes:
 *   - GET   /api/sgie/tareas
 *   - POST  /api/sgie/tareas
 *   - PATCH /api/sgie/tareas/:id
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  CheckSquare, CheckCircle, Clock, ArrowLeft, Plus, Search,
  Pencil, RotateCcw, AlertTriangle, X as XIcon, MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { traducirPrioridad, traducirEstadoTarea } from '@/lib/sgie/estados';
import { ComentariosTarea } from '@/components/sgie/comentarios-tarea';

interface TareaItem {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  automatica: boolean | null;
  fechaVencimiento: string | null;
  completadaEn: string | null;
  creadaEn: string | null;
  expedienteId: string | null;
  numeroInterno: string | null;
  asignadaNombre: string | null;
}

type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';
type Estado = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

const PRIORIDAD_TONE: Record<string, string> = {
  baja: 'bg-surface-alt text-text-secondary border-border',
  media: 'bg-info/10 text-info border-info/20',
  alta: 'bg-warning/10 text-warning border-warning/20',
  urgente: 'bg-danger/10 text-danger border-danger/20',
};

interface FormState {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  fechaVencimiento: string; // formato input date (yyyy-mm-dd)
  asignadaA: string; // id de usuario asignable, o '' (sin asignar)
}

const EMPTY_FORM: FormState = { titulo: '', descripcion: '', prioridad: 'media', fechaVencimiento: '', asignadaA: '' };

function esVencida(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

function formatFechaCorta(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' }); }
  catch { return iso; }
}

export default function SgieTareasPage() {
  const toast = useToast();
  const _confirm = useConfirm();
  const { user, loading: authLoading } = useAuth();
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtros, setFiltros] = useState({ estado: '', prioridad: '', q: '' });
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<{ titulo?: string }>({});
  const [accionId, setAccionId] = useState<string | null>(null);
  const [asignables, setAsignables] = useState<{ id: string; nombre: string }[]>([]);
  const [comentariosTareaId, setComentariosTareaId] = useState<string | null>(null);
  const mounted = useRef(false);

  const fetchTareas = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filtros.estado) params.set('estado', filtros.estado);
      if (filtros.prioridad) params.set('prioridad', filtros.prioridad);
      if (filtros.q) params.set('q', filtros.q);
      const res = await fetch(`/api/sgie/tareas?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const d = await res.json();
      setTareas(d.tareas ?? []);
      setTotal(d.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    if (!authLoading && user && !mounted.current) { mounted.current = true; fetchTareas(); }
  }, [authLoading, user, fetchTareas]);

  // Refrescar al cambiar filtros.
  useEffect(() => {
    if (mounted.current) fetchTareas();
  }, [filtros, fetchTareas]);

  // Cargar usuarios asignables (abogados/admin activos) para el selector de
  // responsable. Sprint 2 — tarea 1. Una sola carga al montar.
  useEffect(() => {
    fetch('/api/sgie/usuarios/asignables?limit=50', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : { usuarios: [] })
      .then((d) => setAsignables(d.usuarios ?? []))
      .catch(() => setAsignables([]));
  }, []);

  const abrirCrear = () => { setForm(EMPTY_FORM); setEditandoId(null); setErrors({}); setShowForm(true); };
  const abrirEditar = (t: TareaItem) => {
    setForm({
      titulo: t.titulo,
      descripcion: t.descripcion ?? '',
      prioridad: t.prioridad as Prioridad,
      fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.slice(0, 10) : '',
      asignadaA: (t as TareaItem & { asignadaA?: string | null }).asignadaA ?? '',
    });
    setEditandoId(t.id);
    setErrors({});
    setShowForm(true);
  };

  const validar = (f: FormState): { titulo?: string } => {
    const e: { titulo?: string } = {};
    if (!f.titulo.trim()) e.titulo = 'El título es obligatorio.';
    else if (f.titulo.length > 300) e.titulo = 'Máximo 300 caracteres.';
    return e;
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validar(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      const body = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        prioridad: form.prioridad,
        asignadaA: form.asignadaA || undefined,
        fechaVencimiento: form.fechaVencimiento
          ? new Date(form.fechaVencimiento + 'T12:00:00').toISOString()
          : undefined,
      };
      const url = editandoId ? `/api/sgie/tareas/${editandoId}` : '/api/sgie/tareas';
      const method = editandoId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      toast.success(editandoId ? 'Tarea actualizada' : 'Tarea creada');
      setShowForm(false);
      setEditandoId(null);
      fetchTareas();
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleCompletar = async (t: TareaItem) => {
    const nuevoEstado: Estado = t.estado === 'completada' ? 'pendiente' : 'completada';
    setAccionId(t.id);
    try {
      const res = await fetch(`/api/sgie/tareas/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success(nuevoEstado === 'completada' ? 'Tarea completada' : 'Tarea reabierta');
      fetchTareas();
    } catch {
      toast.danger('No se pudo actualizar la tarea');
    } finally {
      setAccionId(null);
    }
  };

  const pendientes = tareas.filter((t) => t.estado !== 'completada' && t.estado !== 'cancelada');

  if (authLoading) return <div className="flex justify-center py-16"><ListSkeleton rows={4} /></div>;
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tareas"
        subtitle={`${pendientes.length} pendientes de ${total}`}
        icon={<CheckSquare size={20} className="text-accent" />}
        actions={<Button variant="primary" size="sm" onClick={abrirCrear}><Plus size={14} /> Nueva tarea</Button>}
      />

      {/* Formulario crear/editar */}
      {showForm && (
        <Card padding="md">
          <form onSubmit={guardar} className="space-y-1">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-light">
              <h2 className="font-bold text-sm text-primary">{editandoId ? 'Editar tarea' : 'Nueva tarea'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-surface-alt text-text-muted" aria-label="Cerrar">
                <XIcon size={16} />
              </button>
            </div>
            <Field label="Título" required htmlFor="tar-titulo" error={errors.titulo}>
              <Input id="tar-titulo" value={form.titulo} maxLength={300} invalid={Boolean(errors.titulo)}
                onChange={(e) => { setForm({ ...form, titulo: e.target.value }); if (errors.titulo) setErrors({}); }}
                placeholder="Ej.: Prearer escrito de oposición" />
            </Field>
            <Field label="Descripción" htmlFor="tar-desc" hint="Detalle interno de la tarea (opcional).">
              <Textarea id="tar-desc" value={form.descripcion} maxLength={2000} rows={2}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Notas, contexto, sub-tareas…" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Prioridad" htmlFor="tar-prio">
                <select id="tar-prio" value={form.prioridad}
                  onChange={(e) => setForm({ ...form, prioridad: e.target.value as Prioridad })}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </Field>
              <Field label="Vence" htmlFor="tar-vence" hint="Si es pasada, se guardará con aviso visual.">
                <Input id="tar-vence" type="date" value={form.fechaVencimiento}
                  onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
              </Field>
              <Field label="Responsable" htmlFor="tar-responsable" hint="Abogado al que se asigna la tarea (opcional).">
                <select id="tar-responsable" value={form.asignadaA}
                  onChange={(e) => setForm({ ...form, asignadaA: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]">
                  <option value="">— Sin asignar —</option>
                  {asignables.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" loading={saving}>{editandoId ? 'Guardar cambios' : 'Crear tarea'}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={filtros.q}
            onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
            placeholder="Buscar por título o descripción…"
            className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-surface text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
          />
        </div>
        <select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text outline-none hover:border-border-strong focus:border-accent">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="en_progreso">En progreso</option>
          <option value="completada">Completadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
        <select value={filtros.prioridad} onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
          className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text outline-none hover:border-border-strong focus:border-accent">
          <option value="">Toda prioridad</option>
          <option value="urgente">Urgente</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {/* Listado */}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <Card padding="md">
          <ErrorState title="No se pudieron cargar las tareas" description="Verifique su conexión y vuelva a intentarlo." onRetry={fetchTareas} />
        </Card>
      ) : tareas.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<CheckSquare size={28} />}
            title={filtros.q || filtros.estado || filtros.prioridad ? 'Sin resultados' : 'Sin tareas'}
            description={filtros.q || filtros.estado || filtros.prioridad
              ? 'Pruebe a cambiar los filtros.'
              : 'Cree su primera tarea para organizar su trabajo diario.'}
            action={!filtros.q && !filtros.estado && !filtros.prioridad ? (
              <Button variant="primary" size="sm" onClick={abrirCrear}><Plus size={14} /> Nueva tarea</Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {tareas.map((t) => {
            const vencida = esVencida(t.fechaVencimiento) && t.estado !== 'completada';
            return (
              <Card key={t.id} padding="sm" className={cn(t.estado === 'completada' && 'opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border', PRIORIDAD_TONE[t.prioridad] || PRIORIDAD_TONE.media)}>
                        {traducirPrioridad(t.prioridad)}
                      </span>
                      {t.automatica && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold bg-accent/10 text-accent-dark border border-accent/20">automática</span>
                      )}
                      <span className="text-xxs text-text-muted">{traducirEstadoTarea(t.estado)}</span>
                      {t.numeroInterno && (
                        <Link href={`/intranet/sgie/expedientes/${t.expedienteId}`} className="text-xxs text-info hover:underline font-mono">
                          {t.numeroInterno}
                        </Link>
                      )}
                    </div>
                    <p className={cn('text-sm font-semibold text-text', t.estado === 'completada' && 'line-through')}>{t.titulo}</p>
                    {t.descripcion && <p className="text-xs text-text-secondary mt-1">{t.descripcion}</p>}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {t.fechaVencimiento && (
                        <span className={cn('text-xxs flex items-center gap-1', vencida ? 'text-danger font-semibold' : 'text-text-muted')}>
                          {vencida ? <AlertTriangle size={10} /> : <Clock size={10} />}
                          {vencida ? 'Vencida: ' : 'Vence: '}{formatFechaCorta(t.fechaVencimiento)}
                        </span>
                      )}
                      {t.asignadaNombre && (
                        <span className="text-xxs text-text-muted">Asignada a: {t.asignadaNombre}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => abrirEditar(t)} disabled={accionId === t.id}
                      className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors disabled:opacity-50"
                      title="Editar tarea" aria-label={`Editar tarea: ${t.titulo}`}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setComentariosTareaId(t.id)}
                      className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors"
                      title="Comentarios de la tarea" aria-label={`Comentarios: ${t.titulo}`}>
                      <MessageSquare size={14} />
                    </button>
                    {t.estado === 'completada' ? (
                      <button onClick={() => toggleCompletar(t)} disabled={accionId === t.id}
                        className="p-1.5 rounded-md hover:bg-info/10 text-info transition-colors disabled:opacity-50"
                        title="Reabrir tarea" aria-label={`Reabrir tarea: ${t.titulo}`}>
                        {accionId === t.id ? <Clock size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      </button>
                    ) : (
                      <button onClick={() => toggleCompletar(t)} disabled={accionId === t.id}
                        className="p-1.5 rounded-md hover:bg-success/10 text-success transition-colors disabled:opacity-50"
                        title="Completar tarea" aria-label={`Completar tarea: ${t.titulo}`}>
                        {accionId === t.id ? <Clock size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>

      <ComentariosTarea
        tareaId={comentariosTareaId}
        abierto={comentariosTareaId !== null}
        onClose={() => setComentariosTareaId(null)}
        usuarioId={user?.id ?? ''}
      />
    </div>
  );
}
