'use client';

/**
 * SGIE — Agenda con vista calendario (Sprint 2, tarea 3).
 *
 * Vista mensual y semanal propia (CSS/Tailwind, sin librerías de calendario).
 * Lee eventos del endpoint existente `GET /api/sgie/agenda` y los proyecta
 * sobre la rejilla. Lista lateral de próximos eventos.
 *
 * Mutaciones de evento (confirmar/cancelar/reprogramar/crear): PENDIENTES. El
 * endpoint actual es sólo lectura y no existe PATCH/POST seguro confirmado.
 * No se inventa estructura ni endpoint.
 *
 * Diseño con tokens. Responsive. Estados loading/error/vacío.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Plus, Check, X as XIcon, CheckCheck, Ban, CalendarClock, Pencil, Trash2, Users, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field } from '@/components/ui/input';
import { ErrorState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { traducirEstadoAgenda } from '@/lib/sgie/estados';
import { etiquetaAccion, estadoTrasAccion } from '@/lib/sgie/agenda-helpers';
import { ReprogramarEventoDialog } from '@/components/sgie/reprogramar-evento-dialog';
import {
  rejillaMes, rejillaSemana, esMismoDia, formatRangoSemana,
  MESES_ES, DIAS_ES_CORTO, type DiaCalendario,
} from '@/lib/sgie/calendario';
import { buildAgendaQuery } from '@/lib/sgie/agenda-query';

interface EventoItem {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  estado: string;
  expedienteId: string | null;
  version: number;
}

type Vista = 'mes' | 'semana';

const ESTADO_TONE: Record<string, string> = {
  propuesta: 'bg-warning/10 text-warning border-warning/20',
  confirmada: 'bg-success/10 text-success border-success/20',
  descartada: 'bg-surface-alt text-text-muted border-border',
  completada: 'bg-info/10 text-info border-info/20',
};

function formatHora(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export default function SgieAgendaPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user, loading: authLoading } = useAuth();
  const [eventos, setEventos] = useState<EventoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [vista, setVista] = useState<Vista>('mes');
  const [referencia, setReferencia] = useState(() => new Date());
  const [seleccionada, setSeleccionada] = useState<Date | null>(null);

  // Sprint 3: mutaciones.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVersion, setEditingVersion] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha: '', hora: '10:00', expedienteId: '' });
  const [allDay, setAllDay] = useState(false);
  const [visibilidad, setVisibilidad] = useState<'privado' | 'expediente' | 'equipo'>('privado');
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [errores, setErrores] = useState<{ titulo?: string; fecha?: string }>({});
  const [reprogramando, setReprogramando] = useState<{ id: string; titulo: string; fecha: string; version: number } | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [tipoFiltro, setTipoFiltro] = useState('todos');

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const first = await fetch(`/api/sgie/agenda?${buildAgendaQuery(referencia, vista)}`, { credentials: 'include' });
      if (!first.ok) throw new Error('Error');
      const firstBody = await first.json();
      const collected: EventoItem[] = firstBody.eventos ?? [];
      const pages = Math.ceil(Number(firstBody.total ?? 0) / 100);
      for (let page = 2; page <= pages; page += 1) {
        const response = await fetch(`/api/sgie/agenda?${buildAgendaQuery(referencia, vista, page)}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Error');
        const body = await response.json();
        collected.push(...(body.eventos ?? []));
      }
      setEventos(collected);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [referencia, vista]);

  useEffect(() => {
    if (!authLoading && user) void fetchEventos(); // eslint-disable-line react-hooks/set-state-in-effect -- carga remota al cambiar el rango visible
  }, [authLoading, user, fetchEventos]);

  const dias: DiaCalendario[] = useMemo(() => {
    return vista === 'mes'
      ? rejillaMes(referencia.getFullYear(), referencia.getMonth())
      : rejillaSemana(referencia);
  }, [vista, referencia]);

  // Eventos por día (mapa fecha-iso → eventos).
  const eventosFiltrados = useMemo(() => eventos.filter((evento) =>
    (estadoFiltro === 'todos' || evento.estado === estadoFiltro)
    && (tipoFiltro === 'todos' || evento.tipo === tipoFiltro)
  ), [estadoFiltro, eventos, tipoFiltro]);

  const eventosPorDia = useMemo(() => {
    const m = new Map<string, EventoItem[]>();
    for (const e of eventosFiltrados) {
      const d = new Date(e.fecha);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return m;
  }, [eventosFiltrados]);

  const eventosDiaSeleccionado = seleccionada
    ? eventosPorDia.get(`${seleccionada.getFullYear()}-${seleccionada.getMonth()}-${seleccionada.getDate()}`) ?? []
    : [];

  // Próximos eventos (futuros, ordenados).
  const proximosEventos = useMemo(() => {
    const ahora = new Date();
    return eventosFiltrados
      .filter((e) => new Date(e.fecha) >= ahora)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 6);
  }, [eventosFiltrados]);

  const navegar = (delta: number) => {
    const nueva = new Date(referencia);
    if (vista === 'mes') nueva.setMonth(nueva.getMonth() + delta);
    else nueva.setDate(nueva.getDate() + delta * 7);
    setReferencia(nueva);
  };

  const irHoy = () => { setReferencia(new Date()); setSeleccionada(new Date()); };

  // ─── Sprint 3: mutaciones ────────────────────────────────────────────────
  const abrirCrear = (fechaPreset?: Date) => {
    const f = fechaPreset ?? new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setForm({
      titulo: '', descripcion: '',
      fecha: `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`,
      hora: '10:00', expedienteId: '',
    });
    setErrores({});
    setEditingId(null);
    setEditingVersion(null);
    setAllDay(false);
    setVisibilidad('privado');
    setParticipantes([]);
    setShowForm(true);
  };

  const abrirEditar = (evento: EventoItem) => {
    const date = new Date(evento.fecha);
    const pad = (value: number) => String(value).padStart(2, '0');
    setForm({
      titulo: evento.titulo,
      descripcion: evento.descripcion ?? '',
      fecha: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      hora: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
      expedienteId: evento.expedienteId ?? '',
    });
    setEditingId(evento.id);
    setEditingVersion(evento.version);
    setErrores({});
    setAllDay(false);
    setVisibilidad('privado');
    setParticipantes([]);
    setShowForm(true);
  };

  const validarForm = (f: typeof form) => {
    const e: { titulo?: string; fecha?: string } = {};
    if (!f.titulo.trim()) e.titulo = 'El título es obligatorio.';
    if (!f.fecha) e.fecha = 'La fecha es obligatoria.';
    return e;
  };

  const crearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validarForm(form);
    setErrores(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      const fechaIso = new Date(`${form.fecha}T${form.hora || '10:00'}:00`).toISOString();
      const res = await fetch(editingId ? `/api/sgie/agenda/${editingId}` : '/api/sgie/agenda', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          ...(editingId ? { version: editingVersion } : {}),
          descripcion: form.descripcion.trim() || undefined,
          inicio: fechaIso,
          allDay,
          ...(!editingId ? {
            tipo: form.expedienteId ? 'cita_cliente' : 'personal',
            visibilidad,
          } : {}),
          expedienteId: form.expedienteId || undefined,
          participantes: participantes.length > 0 ? participantes : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear el evento');
      }
      toast.success(editingId ? 'Evento actualizado' : 'Evento creado');
      setShowForm(false);
      setEditingId(null);
      setEditingVersion(null);
      fetchEventos();
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const aplicarAccion = async (evento: EventoItem, accion: 'confirmar' | 'cancelar' | 'completar') => {
    if (accion === 'cancelar') {
      const ok = await confirm({
        title: 'Cancelar evento',
        description: `¿Cancelar «${evento.titulo}»? Esta acción se puede revertir editando el evento.`,
        confirmLabel: 'Cancelar evento',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setAccionId(evento.id);
    try {
      const nuevoEstado = accion === 'cancelar'
        ? 'cancelada'
        : estadoTrasAccion(accion, evento.estado as never);
      const res = await fetch(`/api/sgie/agenda/${evento.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, version: evento.version }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success(etiquetaAccion(accion));
      fetchEventos();
    } catch {
      toast.danger('No se pudo actualizar el evento');
    } finally {
      setAccionId(null);
    }
  };

  if (authLoading) return <ListSkeleton rows={5} />;
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin' && user.rol !== 'supervisor')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }

  const tituloVista = vista === 'mes'
    ? `${MESES_ES[referencia.getMonth()]} ${referencia.getFullYear()}`
    : formatRangoSemana(dias);

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Calendar size={20} className="text-accent" /> Agenda
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">{tituloVista}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button onClick={() => setVista('mes')}
              className={cn('px-3 py-1.5 text-xs font-semibold transition-colors',
                vista === 'mes' ? 'bg-primary text-accent' : 'bg-surface text-text-secondary hover:bg-surface-alt')}>
              Mes
            </button>
            <button onClick={() => setVista('semana')}
              className={cn('px-3 py-1.5 text-xs font-semibold transition-colors',
                vista === 'semana' ? 'bg-primary text-accent' : 'bg-surface text-text-secondary hover:bg-surface-alt')}>
              Semana
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navegar(-1)} aria-label="Anterior"><ChevronLeft size={16} /></Button>
          <Button variant="secondary" size="sm" onClick={irHoy}>Hoy</Button>
          <Button variant="ghost" size="sm" onClick={() => navegar(1)} aria-label="Siguiente"><ChevronRight size={16} /></Button>
          <Button variant="primary" size="sm" onClick={() => abrirCrear(seleccionada ?? undefined)}><Plus size={14} /> Nuevo evento</Button>
        </div>
      </div>

      {/* Formulario crear evento (Sprint 3) */}
      {showForm && (
        <Card padding="md">
          <form onSubmit={crearEvento} className="space-y-3">
            <div className="flex items-center justify-between mb-1 pb-3 border-b border-border-light">
              <h2 className="font-bold text-sm text-primary">{editingId ? 'Editar evento' : 'Nuevo evento'}</h2>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 rounded hover:bg-surface-alt text-text-muted" aria-label="Cerrar">
                <XIcon size={16} />
              </button>
            </div>
            <Field label="Título" required htmlFor="ev-titulo" error={errores.titulo}>
              <Input id="ev-titulo" value={form.titulo} maxLength={300} invalid={Boolean(errores.titulo)}
                onChange={(e) => { setForm({ ...form, titulo: e.target.value }); if (errores.titulo) setErrores({}); }}
                placeholder="Ej.: Audiencia preliminar" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Fecha" required htmlFor="ev-fecha" error={errores.fecha}>
                <Input id="ev-fecha" type="date" value={form.fecha} invalid={Boolean(errores.fecha)}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </Field>
              <Field label="Hora" htmlFor="ev-hora">
                <Input id="ev-hora" type="time" value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Visibilidad" htmlFor="ev-vis">
                <div className="flex gap-1.5">
                  {(['privado', 'expediente', 'equipo'] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setVisibilidad(v)}
                      className={`flex-1 h-10 rounded-md border text-xs font-semibold transition-colors ${
                        visibilidad === v
                          ? 'border-accent bg-accent/10 text-accent-dark'
                          : 'border-border bg-surface text-text-secondary hover:border-border-strong'
                      }`}>
                      {v === 'privado' && <EyeOff size={13} className="inline mr-1" />}
                      {v === 'expediente' && <Eye size={13} className="inline mr-1" />}
                      {v === 'equipo' && <Users size={13} className="inline mr-1" />}
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Día completo">
                <label className="flex items-center gap-2 h-10 cursor-pointer">
                  <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-accent" />
                  <span className="text-xs text-text-secondary">Evento de día completo</span>
                </label>
              </Field>
            </div>
            <Field label="Participantes" htmlFor="ev-parts">
              <div className="flex flex-wrap items-center gap-1.5">
                {participantes.length === 0 && (
                  <span className="text-xs text-text-muted">Sin participantes añadidos.</span>
                )}
                {participantes.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-xxs font-semibold text-accent-dark border border-accent/20">
                    {p}
                    <button type="button" onClick={() => setParticipantes(participantes.filter((_, j) => j !== i))}
                      className="hover:text-danger" aria-label={`Eliminar ${p}`}>
                      <XIcon size={10} />
                    </button>
                  </span>
                ))}
                <button type="button" onClick={() => {
                  const name = prompt('Nombre del participante:');
                  if (name?.trim()) setParticipantes([...participantes, name.trim()]);
                }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-border text-xxs text-text-secondary hover:border-accent hover:text-accent-dark transition-colors">
                  <UserPlus size={12} /> Añadir
                </button>
              </div>
            </Field>
            <Field label="Descripción" htmlFor="ev-desc">
              <Textarea id="ev-desc" value={form.descripcion} maxLength={2000} rows={2}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Notas del evento (opcional)" />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={saving}>{editingId ? 'Guardar cambios' : 'Crear evento'}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap gap-2" aria-label="Filtros de agenda">
        <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-3 text-xs">
          <option value="todos">Todos los estados</option><option value="confirmada">Confirmados</option>
          <option value="propuesta">Propuestos</option><option value="completada">Completados</option>
          <option value="cancelada">Cancelados</option>
        </select>
        <select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-3 text-xs">
          <option value="todos">Todos los tipos</option><option value="personal">Personal</option>
          <option value="cita_cliente">Cita con cliente</option><option value="audiencia">Audiencia</option>
          <option value="plazo">Plazo</option><option value="revision_interna">Revisión interna</option>
          <option value="firma">Firma</option><option value="tarea_hito">Tarea o hito</option><option value="ausencia">Ausencia</option>
        </select>
      </div>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <Card padding="md">
          <ErrorState title="No se pudo cargar la agenda" description="Verifique su conexión y vuelva a intentarlo." onRetry={fetchEventos} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendario */}
          <Card padding="sm" className="lg:col-span-2">
            {/* Cabecera días */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS_ES_CORTO.map((d) => (
                <div key={d} className="text-center text-xxs font-bold uppercase tracking-wider text-text-muted py-1.5">{d}</div>
              ))}
            </div>
            {/* Rejilla */}
            <div className="grid grid-cols-7 gap-px bg-border-light rounded-md overflow-hidden">
              {dias.map((dia, i) => {
                const key = `${dia.fecha.getFullYear()}-${dia.fecha.getMonth()}-${dia.fecha.getDate()}`;
                const evs = eventosPorDia.get(key) ?? [];
                const esSeleccionada = seleccionada && esMismoDia(dia.fecha, seleccionada);
                return (
                  <button
                    key={i}
                    onClick={() => setSeleccionada(dia.fecha)}
                    className={cn(
                      'min-h-[68px] sm:min-h-[88px] p-1 text-left transition-colors bg-surface',
                      !dia.enMes && vista === 'mes' && 'opacity-40',
                      dia.esHoy && 'ring-1 ring-inset ring-accent',
                      esSeleccionada ? 'ring-2 ring-inset ring-primary' : 'hover:bg-surface-alt',
                    )}
                  >
                    <div className={cn(
                      'text-xxs font-semibold mb-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full',
                      dia.esHoy ? 'bg-accent text-surface' : 'text-text-secondary',
                    )}>
                      {dia.fecha.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {evs.slice(0, 3).map((e) => (
                        <div key={e.id} className={cn('text-xxs truncate px-1 py-0.5 rounded border', ESTADO_TONE[e.estado] || ESTADO_TONE.propuesta)}>
                          {formatHora(e.fecha)} {e.titulo}
                        </div>
                      ))}
                      {evs.length > 3 && <div className="text-xxs text-text-muted px-1">+{evs.length - 3} más</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Panel lateral: día seleccionado + próximos */}
          <div className="space-y-4">
            <Card padding="sm">
              <h2 className="text-sm font-bold text-text mb-2 pb-2 border-b border-border-light">
                {seleccionada
                  ? seleccionada.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Seleccione un día'}
              </h2>
              {eventosDiaSeleccionado.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">Sin eventos este día.</p>
              ) : (
                <ul className="space-y-2">
                  {eventosDiaSeleccionado.map((e) => (
                    <EventoCardDetalle
                      key={e.id}
                      evento={e}
                      accionId={accionId}
                      onConfirmar={(ev) => aplicarAccion(ev, 'confirmar')}
                      onCancelar={(ev) => aplicarAccion(ev, 'cancelar')}
                      onCompletar={(ev) => aplicarAccion(ev, 'completar')}
                      onReprogramar={(ev) =>
                        setReprogramando({
                          id: ev.id,
                          titulo: ev.titulo,
                          fecha: ev.fecha,
                          version: ev.version,
                        })
                      }
                      onEditar={abrirEditar}
                      onEliminar={(ev) => setDeleteConfirmId(ev.id)}
                    />
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="sm">
              <h2 className="text-sm font-bold text-text mb-2 pb-2 border-b border-border-light">Próximos eventos</h2>
              {proximosEventos.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No hay eventos próximos.</p>
              ) : (
                <ul className="space-y-2">
                  {proximosEventos.map((e) => (
                    <EventoCard key={e.id} evento={e} compacto />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>

      <ReprogramarEventoDialog
        evento={reprogramando}
        onClose={() => setReprogramando(null)}
        onHecho={() => { setReprogramando(null); fetchEventos(); }}
      />

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="presentation">
          <div className="absolute inset-0 bg-overlay" onClick={() => setDeleteConfirmId(null)} aria-hidden="true" />
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title"
            className="relative bg-surface rounded-lg shadow-xl border border-border-light w-full max-w-sm p-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-danger/15 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-danger" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h2 id="delete-confirm-title" className="text-base font-bold text-text">Eliminar evento</h2>
                <p className="text-sm text-text-secondary mt-1">¿Está seguro de eliminar este evento? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button type="button" onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-md border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt">
                Cancelar
              </button>
              <button type="button" onClick={() => {
                setDeleteConfirmId(null);
                toast.danger('Función de eliminación no implementada');
              }}
                className="px-4 py-2 rounded-md bg-danger text-white text-sm font-bold hover:opacity-90">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventoCardDetalle({
  evento, accionId,
  onConfirmar, onCancelar, onCompletar, onReprogramar, onEditar, onEliminar,
}: {
  evento: EventoItem;
  accionId: string | null;
  onConfirmar: (e: EventoItem) => void;
  onCancelar: (e: EventoItem) => void;
  onCompletar: (e: EventoItem) => void;
  onReprogramar: (e: EventoItem) => void;
  onEditar: (e: EventoItem) => void;
  onEliminar: (e: EventoItem) => void;
}) {
  const activo = evento.estado === 'propuesta' || evento.estado === 'confirmada';
  return (
    <li className={cn('rounded-md border p-2', ESTADO_TONE[evento.estado] || ESTADO_TONE.propuesta)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{evento.titulo}</p>
          {evento.descripcion && <p className="text-xxs opacity-80 mt-0.5 line-clamp-2">{evento.descripcion}</p>}
        </div>
        <span className="text-xxs font-mono whitespace-nowrap flex-shrink-0">{formatHora(evento.fecha)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <span className="text-xxs opacity-70">{traducirEstadoAgenda(evento.estado)}</span>
        {activo && (
          <div className="flex items-center gap-1">
            <button onClick={() => onEditar(evento)} disabled={accionId === evento.id}
              title="Editar evento" aria-label={`Editar: ${evento.titulo}`}
              className="p-1 rounded hover:bg-info/15 text-info disabled:opacity-50">
              <Pencil size={13} />
            </button>
            <button onClick={() => onReprogramar(evento)} disabled={accionId === evento.id}
              title="Reprogramar evento" aria-label={`Reprogramar: ${evento.titulo}`}
              className="p-1 rounded hover:bg-warning/15 text-warning disabled:opacity-50">
              <CalendarClock size={13} />
            </button>
            {evento.estado === 'propuesta' && (
              <button onClick={() => onConfirmar(evento)} disabled={accionId === evento.id}
                title="Confirmar evento" aria-label={`Confirmar: ${evento.titulo}`}
                className="p-1 rounded hover:bg-success/15 text-success disabled:opacity-50">
                <Check size={13} />
              </button>
            )}
            {evento.estado === 'confirmada' && (
              <button onClick={() => onCompletar(evento)} disabled={accionId === evento.id}
                title="Marcar completado" aria-label={`Completar: ${evento.titulo}`}
                className="p-1 rounded hover:bg-info/15 text-info disabled:opacity-50">
                <CheckCheck size={13} />
              </button>
            )}
            <button onClick={() => onCancelar(evento)} disabled={accionId === evento.id}
              title="Cancelar evento" aria-label={`Cancelar: ${evento.titulo}`}
              className="p-1 rounded hover:bg-danger/15 text-danger disabled:opacity-50">
              <Ban size={13} />
            </button>
            <button onClick={() => onEliminar(evento)}
              title="Eliminar evento" aria-label={`Eliminar: ${evento.titulo}`}
              className="p-1 rounded hover:bg-danger/15 text-danger opacity-50 hover:opacity-100">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function EventoCard({ evento, compacto }: { evento: EventoItem; compacto?: boolean }) {
  // Hooks se declaran aquí via props pasadas desde el padre para evitar
  // violación de reglas de hooks en condicionales del padre.
  const _acciones = !compacto && evento.estado !== 'completada' && evento.estado !== 'descartada';
  return (
    <li className={cn('rounded-md border p-2', ESTADO_TONE[evento.estado] || ESTADO_TONE.propuesta)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{evento.titulo}</p>
          {!compacto && evento.descripcion && <p className="text-xxs opacity-80 mt-0.5 line-clamp-2">{evento.descripcion}</p>}
        </div>
        <span className="text-xxs font-mono whitespace-nowrap flex-shrink-0">{formatHora(evento.fecha)}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xxs opacity-70">{traducirEstadoAgenda(evento.estado)}</span>
        <span className="text-xxs opacity-50">· {evento.tipo.replace(/_/g, ' ')}</span>
      </div>
    </li>
  );
}
