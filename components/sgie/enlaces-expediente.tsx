'use client';

/**
 * SGIE — Bloque de enlaces mágicos de un expediente (Sprint 1, tarea 2).
 *
 * Permite ver, generar (con expiración y usos máximos), copiar y revocar
 * enlaces de carga documental. Usa el design system (tokens, ConfirmDialog,
 * toast). No expone tokens de enlaces revocados/expirados.
 *
 * Fuentes:
 *   - GET  /api/sgie/enlaces?expedienteId=...
 *   - POST /api/sgie/enlaces
 *   - POST /api/sgie/enlaces/:id/revocar
 */
import { useCallback, useEffect, useState } from 'react';
import { Link2, Plus, Copy, Ban, CheckCircle, Clock, X as XIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/input';
import { ListSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { cn } from '@/lib/ui';

interface EnlaceItem {
  id: string;
  expedienteId: string;
  requisitoExpedienteId: string | null;
  clienteEmail: string | null;
  creadoEn: string | null;
  expiraEn: string | null;
  usosMaximos: number | null;
  usosActuales: number | null;
  revocadoEn: string | null;
  revocadoMotivo: string | null;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

/** Calcula el estado de presentación de un enlace. */
function estadoEnlace(e: EnlaceItem): { label: string; tone: string } {
  if (e.revocadoEn) return { label: 'Revocado', tone: 'bg-danger/10 text-danger border-danger/20' };
  if (e.expiraEn && new Date(e.expiraEn) < new Date()) return { label: 'Expirado', tone: 'bg-warning/10 text-warning border-warning/20' };
  if (e.usosMaximos !== null && e.usosActuales !== null && e.usosActuales >= e.usosMaximos) {
    return { label: 'Agotado', tone: 'bg-surface-alt text-text-secondary border-border' };
  }
  return { label: 'Activo', tone: 'bg-success/10 text-success border-success/20' };
}

export function EnlacesExpediente({
  expedienteId,
  enlaceRecienCreado,
  onConsumirRecienCreado,
}: {
  expedienteId: string;
  enlaceRecienCreado?: { token: string } | null;
  onConsumirRecienCreado?: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [enlaces, setEnlaces] = useState<EnlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revocandoId, setRevocandoId] = useState<string | null>(null);
  const [dias, setDias] = useState('7');
  const [usos, setUsos] = useState('5');
  const [email, setEmail] = useState('');
  // Token del enlace recién creado (para copiar; no se persiste en UI más allá
  // del primer copiado, por seguridad).
  const [nuevoToken, setNuevoToken] = useState<string | null>(null);

  const fetchEnlaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sgie/enlaces?expedienteId=${expedienteId}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setEnlaces(d.enlaces ?? []);
      }
    } catch {
      /* non-critical: no bloquear el detalle */
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de enlaces
    fetchEnlaces();
  }, [fetchEnlaces]);

  // Si el padre pasa un enlace recién creado (POST desde fuera), mostrarlo.
  useEffect(() => {
    if (enlaceRecienCreado?.token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mostrar token recién creado
      setNuevoToken(enlaceRecienCreado.token);
      onConsumirRecienCreado?.();
      fetchEnlaces();
    }
  }, [enlaceRecienCreado, onConsumirRecienCreado, fetchEnlaces]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    const diasN = Number(dias);
    const usosN = Number(usos);
    if (!Number.isInteger(diasN) || diasN < 1 || diasN > 90) { toast.danger('Expiración entre 1 y 90 días'); return; }
    if (!Number.isInteger(usosN) || usosN < 1 || usosN > 50) { toast.danger('Usos máximos entre 1 y 50'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/sgie/enlaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expedienteId,
          diasExpiracion: diasN,
          usosMaximos: usosN,
          clienteEmail: email.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear el enlace');
      }
      const data = await res.json();
      setNuevoToken(data.enlace?.token ?? null);
      toast.success('Enlace generado', 'Cópialo y envíalo al cliente.');
      setShowForm(false);
      fetchEnlaces();
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : 'Error al crear el enlace');
    } finally {
      setSaving(false);
    }
  };

  const copiar = async (token: string) => {
    const url = `${window.location.origin}/cargar/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado', 'Pégalo en un correo al cliente.');
    } catch {
      // Fallback: mostrar el enlace en un prompt del design system sería ideal,
      // pero para no reintroducir un modal extra, mostramos el enlace en toast.
      toast.info('No se pudo copiar automáticamente', url);
    }
  };

  const revocar = async (id: string) => {
    const ok = await confirm({
      title: 'Revocar enlace',
      description: 'El cliente ya no podrá subir documentos con este enlace. La acción es irreversible.',
      confirmLabel: 'Revocar enlace',
      tone: 'danger',
    });
    if (!ok) return;
    setRevocandoId(id);
    try {
      const res = await fetch(`/api/sgie/enlaces/${id}/revocar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Revocado por el abogado' }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success('Enlace revocado');
      fetchEnlaces();
    } catch {
      toast.danger('No se pudo revocar el enlace');
    } finally {
      setRevocandoId(null);
    }
  };

  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-3 border-b border-border-light">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-accent-dark" />
          <h2 className="text-sm font-bold text-text">Enlaces de carga ({enlaces.filter((e) => !e.revocadoEn).length} activos)</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Nuevo enlace</Button>
      </div>

      {/* Enlace recién creado: banner para copiar */}
      {nuevoToken && (
        <div className="m-3 p-3 rounded-md border border-success/30 bg-success/10">
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">Enlace generado</p>
              <p className="text-xxs text-text-secondary mb-2">Cópialo ahora; por seguridad no se volverá a mostrar el token completo.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate text-xxs font-mono bg-surface px-2 py-1.5 rounded border border-border-light text-text">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/cargar/${nuevoToken}`}
                </code>
                <Button variant="primary" size="sm" onClick={() => copiar(nuevoToken)}><Copy size={14} /> Copiar</Button>
                <Button variant="ghost" size="sm" onClick={() => setNuevoToken(null)} aria-label="Cerrar"><XIcon size={14} /></Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario nuevo enlace */}
      {showForm && (
        <div className="m-3 p-3 rounded-md border border-border-light bg-surface-alt/40">
          <form onSubmit={crear} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Expira (días)" htmlFor="enl-dias" hint="1–90 días.">
                <input id="enl-dias" type="number" min={1} max={90} value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]" />
              </Field>
              <Field label="Usos máximos" htmlFor="enl-usos" hint="1–50 usos.">
                <input id="enl-usos" type="number" min={1} max={50} value={usos}
                  onChange={(e) => setUsos(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]" />
              </Field>
              <Field label="Email del cliente (opcional)" htmlFor="enl-email">
                <input id="enl-email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="cliente@correo.com"
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]" />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={saving}>Generar enlace</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <div className="p-3"><ListSkeleton rows={3} /></div>
      ) : enlaces.length === 0 ? (
        <EmptyState
          icon={<Link2 size={26} />}
          title="Sin enlaces"
          description="Genere un enlace para que el cliente suba documentos sin necesidad de cuenta."
        />
      ) : (
        <ul className="divide-y divide-border-light">
          {enlaces.map((e) => {
            const est = estadoEnlace(e);
            const activo = est.label === 'Activo';
            return (
              <li key={e.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border', est.tone)}>{est.label}</span>
                      {e.clienteEmail && <span className="text-xxs text-text-muted">{e.clienteEmail}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xxs text-text-muted flex-wrap">
                      <span>Creado: {formatFecha(e.creadoEn)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> Expira: {formatFecha(e.expiraEn)}</span>
                      <span>Usos: {e.usosActuales ?? 0}/{e.usosMaximos ?? '∞'}</span>
                    </div>
                    {e.revocadoMotivo && <p className="text-xxs text-danger mt-1">Motivo: {e.revocadoMotivo}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {activo && (
                      <button onClick={() => toast.info('Token no disponible', 'Por seguridad, copia el enlace justo después de generarlo desde el banner verde.')}
                        className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors"
                        title="Copiar enlace" aria-label="Copiar enlace">
                        <Copy size={14} />
                      </button>
                    )}
                    {!e.revocadoEn && (
                      <button onClick={() => revocar(e.id)} disabled={revocandoId === e.id}
                        className="p-1.5 rounded-md hover:bg-danger/10 text-danger transition-colors disabled:opacity-50"
                        title="Revocar enlace" aria-label="Revocar enlace">
                        <Ban size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
