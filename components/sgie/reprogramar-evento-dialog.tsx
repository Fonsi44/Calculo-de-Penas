'use client';

/**
 * SGIE — Modal "Reprogramar evento" (Sprint 4, tarea 2).
 *
 * Reutiliza el endpoint PATCH /api/sgie/agenda/[id] cambiando `fecha`.
 * Validación de fecha/hora obligatoria. Motivo opcional. Auditoría
 * `evento_updated` con metadata `reprogramado: true` (la gestiona el endpoint).
 *
 * Sprint 4.
 */
import { useState, useEffect } from 'react';
import { CalendarClock, X as XIcon } from 'lucide-react';
import { Input, Textarea, Field } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

type MotivoCategoria = 'conflicto_agenda' | 'solicitud_cliente' | 'requerimiento_juzgado' | 'falta_documentacion' | 'otro';

const MOTIVOS: { value: MotivoCategoria; label: string }[] = [
  { value: 'conflicto_agenda', label: 'Conflicto de agenda' },
  { value: 'solicitud_cliente', label: 'Solicitud del cliente' },
  { value: 'requerimiento_juzgado', label: 'Requerimiento del juzgado' },
  { value: 'falta_documentacion', label: 'Falta de documentación' },
  { value: 'otro', label: 'Otro' },
];

interface EventoReprogramar {
  id: string;
  titulo: string;
  fecha: string;
}

export function ReprogramarEventoDialog({
  evento, onClose, onHecho,
}: {
  evento: EventoReprogramar | null;
  onClose: () => void;
  onHecho: () => void;
}) {
  const toast = useToast();
  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(evento));
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [motivoCategoria, setMotivoCategoria] = useState<MotivoCategoria | ''>('');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar fecha/hora al abrir el modal.
  useEffect(() => {
    if (evento) {
      const d = new Date(evento.fecha);
      const pad = (n: number) => String(n).padStart(2, '0');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- inicialización desde prop
      setFecha(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setHora(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  }, [evento]);

  const guardar = async () => {
    if (!evento) return;
    if (!fecha || !hora) { setError('La fecha y hora son obligatorias.'); return; }
    if (!motivoCategoria) { setError('Seleccione un motivo.'); return; }
    if (motivoCategoria === 'otro' && !motivoDetalle.trim()) { setError('Indique el detalle del motivo.'); return; }
    const fechaIso = new Date(`${fecha}T${hora}:00`);
    if (isNaN(fechaIso.getTime())) { setError('Fecha u hora inválidas.'); return; }

    setGuardando(true);
    try {
      const res = await fetch(`/api/sgie/agenda/${evento.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: fechaIso.toISOString(),
          motivoCategoria,
          motivoDetalle: motivoDetalle.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success('Evento reprogramado', `Motivo: ${MOTIVOS.find((m) => m.value === motivoCategoria)?.label}`);
      onHecho();
      limpiar();
    } catch {
      toast.danger('No se pudo reprogramar el evento');
    } finally {
      setGuardando(false);
    }
  };

  const limpiar = () => { setFecha(''); setHora('10:00'); setMotivoCategoria(''); setMotivoDetalle(''); setError(null); };

  if (!evento) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-overlay" onClick={() => { onClose(); limpiar(); }} aria-hidden="true" />
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Reprogramar evento"
        className="relative bg-surface rounded-lg shadow-xl border border-border-light w-full max-w-md p-5">
        <button onClick={() => { onClose(); limpiar(); }} aria-label="Cerrar"
          className="absolute top-3 right-3 p-1 rounded hover:bg-surface-alt text-text-muted">
          <XIcon size={16} />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock size={18} className="text-accent-dark" />
          <h2 className="text-sm font-bold text-primary">Reprogramar evento</h2>
        </div>
        <p className="text-xs text-text-secondary mb-3 truncate">«{evento.titulo}»</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nueva fecha" required htmlFor="rep-fecha" error={error && !fecha ? error : undefined}>
              <Input id="rep-fecha" type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setError(null); }} invalid={Boolean(error && !fecha)} />
            </Field>
            <Field label="Hora" required htmlFor="rep-hora" error={error && !hora ? error : undefined}>
              <Input id="rep-hora" type="time" value={hora} onChange={(e) => { setHora(e.target.value); setError(null); }} invalid={Boolean(error && !hora)} />
            </Field>
          </div>
          <Field label="Motivo" required htmlFor="rep-motivo" hint="Quedará registrado en la auditoría del cambio.">
            <select id="rep-motivo" value={motivoCategoria}
              onChange={(e) => { setMotivoCategoria(e.target.value as MotivoCategoria); setError(null); }}
              className={cn('w-full h-10 rounded-md border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]',
                error && !motivoCategoria ? 'border-danger' : 'border-border')}>
              <option value="">— Seleccione un motivo —</option>
              {MOTIVOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          {motivoCategoria === 'otro' && (
            <Field label="Detalle del motivo" required htmlFor="rep-detalle">
              <Textarea id="rep-detalle" value={motivoDetalle} maxLength={500} rows={2} onChange={(e) => setMotivoDetalle(e.target.value)}
                placeholder="Describa el motivo…" />
            </Field>
          )}
          {error && <p className="text-xxs text-danger font-semibold">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm" loading={guardando} onClick={guardar}>Reprogramar</Button>
            <Button variant="ghost" size="sm" onClick={() => { onClose(); limpiar(); }}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
