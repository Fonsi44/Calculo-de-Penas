'use client';

/**
 * SGIE — Panel de seguimiento documental (Fase 2).
 *
 * Muestra el estado documental del expediente, requisitos pendientes/recibidos,
 * el enlace mágico activo, el último recordatorio y acciones: enviar solicitud
 * documental, primer/segundo recordatorio y desbloquear.
 *
 * Usa el design system existente (Card, Button, useToast, useConfirm). No es
 * un rediseño: reutiliza los tokens y patrones de EnlacesExpediente.
 *
 * Fuentes:
 *   - GET  /api/sgie/expedientes/:id/seguimiento
 *   - POST /api/sgie/expedientes/:id/seguimiento/solicitud
 *   - POST /api/sgie/expedientes/:id/seguimiento/recordatorio
 *   - POST /api/sgie/expedientes/:id/seguimiento/desbloquear
 */
import { useCallback, useEffect, useState } from 'react';
import { Mail, Send, AlertTriangle, Unlock, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

interface RequisitoItem {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  orden: number | null;
  confirmado: boolean | null;
  noAplica: boolean;
}
interface Seguimiento {
  expediente: { id: string; numeroInterno: string; estado: string };
  estadoDocumental: string;
  requisitos: RequisitoItem[];
  pendientesObligatorios: number;
  enlace: {
    id: string;
    activo: boolean;
    expiraEn: string | null;
    usosActuales: number | null;
    usosMaximos: number | null;
    creadoEn: string | null;
  } | null;
  ultimoEmail: { slug: string; estado: string; fecha: string | null } | null;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function labelEstadoDocumental(e: string): { label: string; tone: string } {
  switch (e) {
    case 'documentos_completos': return { label: 'Documentos completos', tone: 'bg-success/10 text-success border-success/20' };
    case 'documentos_parcialmente_recibidos': return { label: 'Parcialmente recibidos', tone: 'bg-warning/10 text-warning border-warning/20' };
    default: return { label: 'Pendiente de documentos', tone: 'bg-surface-alt text-text-secondary border-border' };
  }
}

function estadoRequisito(r: RequisitoItem): { label: string; tone: string } {
  if (r.noAplica) return { label: 'No aplica', tone: 'bg-surface-alt text-text-secondary border-border' };
  const SAT = ['subido', 'aprobado', 'texto_extraido', 'clasificado', 'ia_procesada'];
  if (SAT.includes(r.estado)) return { label: 'Recibido', tone: 'bg-success/10 text-success border-success/20' };
  if (r.estado === 'rechazado') return { label: 'Rechazado', tone: 'bg-danger/10 text-danger border-danger/20' };
  return { label: 'Pendiente', tone: 'bg-warning/10 text-warning border-warning/20' };
}

export function SeguimientoDocumental({ expedienteId }: { expedienteId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<Seguimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/seguimiento`);
      if (res.ok) setData(await res.json());
    } catch {
      /* ignorar */
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  /* eslint-disable react-hooks/set-state-in-effect -- carga inicial única del panel */
  useEffect(() => { cargar(); }, [cargar]);

  async function postAccion(ruta: string, body: unknown, etiqueta: string) {
    setAccion(ruta);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/seguimiento/${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.danger(json.error ?? `Error al ${etiqueta.toLowerCase()}`);
        return;
      }
      toast.success(etiqueta);
      await cargar();
    } catch {
      toast.danger(`Error al ${etiqueta.toLowerCase()}`);
    } finally {
      setAccion(null);
    }
  }

  if (loading) return (
    <Card className="p-4">
      <ListSkeleton rows={3} />
    </Card>
  );
  if (!data) return null;

  const ed = labelEstadoDocumental(data.estadoDocumental);
  const bloqueado = data.expediente.estado === 'bloqueado_por_cliente';

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Seguimiento documental</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${ed.tone}`}>
            {ed.label}
          </span>
          <Button size="sm" variant="ghost" onClick={cargar} aria-label="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {bloqueado && (
        <div className="flex items-start gap-2 p-3 rounded border border-danger/20 bg-danger/5">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-danger">Expediente bloqueado por falta de respuesta del cliente</p>
            <Button
              size="sm"
              className="mt-2"
              loading={accion === 'desbloquear'}
              onClick={async () => {
                const ok = await confirm({
                  title: 'Desbloquear expediente',
                  description: 'El expediente volverá a pendiente de documentos.',
                  confirmLabel: 'Desbloquear',
                });
                if (ok) await postAccion('desbloquear', {}, 'Expediente desbloqueado');
              }}
            >
              <Unlock className="w-4 h-4 mr-1" /> Desbloquear
            </Button>
          </div>
        </div>
      )}

      {/* Acciones de comunicación al cliente */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          loading={accion === 'solicitud'}
          onClick={() => postAccion('solicitud', {}, 'Solicitud documental enviada')}
        >
          <Send className="w-4 h-4 mr-1" /> Enviar solicitud
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={accion === 'recordatorio'}
          onClick={() => postAccion('recordatorio', { numero: 1 }, 'Primer recordatorio enviado')}
        >
          Recordatorio 1
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={accion === 'recordatorio'}
          onClick={() => postAccion('recordatorio', { numero: 2 }, 'Segundo recordatorio enviado')}
        >
          Recordatorio 2
        </Button>
      </div>

      {/* Estado del enlace y último email */}
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Enlace de carga</p>
          {data.enlace ? (
            <p className="flex items-center gap-1.5">
              {data.enlace.activo
                ? <><CheckCircle2 className="w-4 h-4 text-success" /> Activo · expira {formatFecha(data.enlace.expiraEn)}</>
                : <><Clock className="w-4 h-4 text-warning" /> Sin enlace activo</>}
            </p>
          ) : <p className="text-text-secondary">Sin enlace</p>}
        </div>
        <div className="space-y-1">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Último envío</p>
          {data.ultimoEmail ? (
            <p>{data.ultimoEmail.slug.replace(/_/g, ' ')} · {formatFecha(data.ultimoEmail.fecha)}</p>
          ) : <p className="text-text-secondary">—</p>}
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        <p className="text-text-secondary text-xs uppercase tracking-wide">
          Requisitos ({data.requisitos.filter((r) => r.tipo === 'obligatorio').length} obligatorios · {data.pendientesObligatorios} pendientes)
        </p>
        {data.requisitos.length === 0 ? (
          <EmptyState title="Sin checklist" description="Este expediente no tiene requisitos definidos." />
        ) : (
          <ul className="divide-y divide-border">
            {data.requisitos.map((r) => {
              const er = estadoRequisito(r);
              return (
                <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="text-sm">
                    {r.nombre}
                    {r.tipo === 'obligatorio' && <span className="text-danger ml-1">*</span>}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border whitespace-nowrap ${er.tone}`}>
                    {er.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
