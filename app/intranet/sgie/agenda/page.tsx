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
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Plus, Check, X as XIcon, CheckCheck, Ban, CalendarClock } from 'lucide-react';
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

interface EventoItem {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  estado: string;
  expedienteId: string | null;
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
  const mounted = useRef(false);

  // Sprint 3: mutaciones.
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha: '', hora: '10:00', expedienteId: '' });
  const [errores, setErrores] = useState<{ titulo?: string; fecha?: string }>({});
  const [reprogramando, setReprogramando] = useState<{ id: string; titulo: string; fecha: string } | null>(null);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/sgie/agenda?limit=200', { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const d = await res.json();
      setEventos(d.eventos ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && !mounted.current) { mounted.current = true; fetchEventos(); }
  }, [authLoading, user, fetchEventos]);

  const dias: DiaCalendario[] = useMemo(() => {
    return vista === 'mes'
      ? rejillaMes(referencia.getFullYear(), referencia.getMonth())
      : rejillaSemana(referencia);
  }, [vista, referencia]);

  // Eventos por día (mapa fecha-iso → eventos).
  const eventosPorDia = useMemo(() => {
    const m = new Map<string, EventoItem[]>();
    for (const e of eventos) {
      const d = new Date(e.fecha);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return m;
  }, [eventos]);

  const eventosDiaSeleccionado = seleccionada
    ? eventosPorDia.get(`${seleccionada.getFullYear()}-${seleccionada.getMonth()}-${seleccionada.getDate()}`) ?? []
    : [];

  // Próximos eventos (futuros, ordenados).
  const proximosEventos = useMemo(() => {
    const ahora = new Date();
    return eventos
      .filter((e) => new Date(e.fecha) >= ahora)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 6);
  }, [eventos]);

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
      const res = await fetch('/api/sgie/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim() || undefined,
          fecha: fechaIso,
          expedienteId: form.expedienteId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear el evento');
      }
      toast.success('Evento creado');
      setShowForm(false);
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
      const nuevoEstado = estadoTrasAccion(accion, evento.estado as never);
      const res = await fetch(`/api/sgie/agenda/${evento.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
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
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
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
              <h2 className="font-bold text-sm text-primary">Nuevo evento</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-surface-alt text-text-muted" aria-label="Cerrar">
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
            <Field label="Descripción" htmlFor="ev-desc">
              <Textarea id="ev-desc" value={form.descripcion} maxLength={2000} rows={2}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Notas del evento (opcional)" />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={saving}>Crear evento</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

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
                      onReprogramar={(ev) => setReprogramando({ id: ev.id, titulo: ev.titulo, fecha: ev.fecha })}
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
    </div>
  );
}

function EventoCardDetalle({
  evento, accionId,
  onConfirmar, onCancelar, onCompletar, onReprogramar,
}: {
  evento: EventoItem;
  accionId: string | null;
  onConfirmar: (e: EventoItem) => void;
  onCancelar: (e: EventoItem) => void;
  onCompletar: (e: EventoItem) => void;
  onReprogramar: (e: EventoItem) => void;
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
