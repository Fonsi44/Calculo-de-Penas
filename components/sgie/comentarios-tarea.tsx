'use client';

/**
 * SGIE — Comentarios de tarea (Sprint 4, tarea 3).
 *
 * Modal lateral que lista y permite añadir comentarios de una tarea. Texto
 * plano (sin HTML inseguro). El autor puede editar/eliminar los suyos.
 *
 * Sprint 4.
 */
import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Send, Trash2, Pencil, X as XIcon } from 'lucide-react';
import { Field } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { cn } from '@/lib/ui';

interface ComentarioItem {
  id: string;
  autorId: string;
  autorNombre: string | null;
  comentario: string;
  creadoEn: string;
  editadoEn: string | null;
}

export function ComentariosTarea({
  tareaId, abierto, onClose, usuarioId,
}: {
  tareaId: string | null; abierto: boolean; onClose: () => void; usuarioId: string;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [comentarios, setComentarios] = useState<ComentarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevo, setNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoTexto, setEditandoTexto] = useState('');
  const trapRef = useFocusTrap<HTMLDivElement>(abierto);

  const fetchComentarios = useCallback(async () => {
    if (!tareaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sgie/tareas/${tareaId}/comentarios`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setComentarios(d.comentarios ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [tareaId]);

  useEffect(() => {
    if (abierto && tareaId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga al abrir
      fetchComentarios();
    }
  }, [abierto, tareaId, fetchComentarios]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onClose]);

  const agregar = async () => {
    if (!tareaId || !nuevo.trim()) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/sgie/tareas/${tareaId}/comentarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: nuevo.trim() }),
      });
      if (!res.ok) throw new Error('Error');
      setNuevo('');
      fetchComentarios();
    } catch {
      toast.danger('No se pudo añadir el comentario');
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async (cid: string) => {
    if (!editandoTexto.trim()) return;
    try {
      const res = await fetch(`/api/sgie/tareas/${tareaId}/comentarios/${cid}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: editandoTexto.trim() }),
      });
      if (!res.ok) throw new Error('Error');
      setEditandoId(null);
      fetchComentarios();
    } catch {
      toast.danger('No se pudo editar');
    }
  };

  const eliminar = async (cid: string) => {
    const ok = await confirm({ title: 'Eliminar comentario', description: 'El comentario se borrará lógicamente.', confirmLabel: 'Eliminar', tone: 'danger' });
    if (!ok) return;
    try {
      const res = await fetch(`/api/sgie/tareas/${tareaId}/comentarios/${cid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      fetchComentarios();
    } catch {
      toast.danger('No se pudo eliminar');
    }
  };

  if (!abierto || !tareaId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="presentation">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden="true" />
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Comentarios de tarea"
        className="relative bg-surface w-full max-w-md h-full flex flex-col border-l border-border-light shadow-xl">
        <div className="flex items-center justify-between p-3 border-b border-border-light">
          <h2 className="text-sm font-bold text-text flex items-center gap-1.5">
            <MessageSquare size={15} /> Comentarios ({comentarios.length})
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 rounded hover:bg-surface-alt text-text-muted">
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : comentarios.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">Sin comentarios. Sea el primero en comentar.</p>
          ) : (
            comentarios.map((c) => (
              <div key={c.id} className={cn('rounded-md border border-border-light p-2.5', c.autorId === usuarioId ? 'bg-accent/5' : 'bg-surface')}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text">{c.autorNombre ?? 'Usuario'}</span>
                  <span className="text-xxs text-text-muted">
                    {new Date(c.creadoEn).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {c.editadoEn && ' · editado'}
                  </span>
                </div>
                {editandoId === c.id ? (
                  <div className="space-y-1.5">
                    <textarea value={editandoTexto} onChange={(e) => setEditandoTexto(e.target.value)} rows={2}
                      className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text resize-y" />
                    <div className="flex gap-1.5">
                      <button onClick={() => guardarEdicion(c.id)} className="text-xxs text-info hover:underline">Guardar</button>
                      <button onClick={() => setEditandoId(null)} className="text-xxs text-text-muted hover:underline">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-text whitespace-pre-wrap leading-relaxed">{c.comentario}</p>
                    {c.autorId === usuarioId && (
                      <div className="flex gap-2 mt-1.5">
                        <button onClick={() => { setEditandoId(c.id); setEditandoTexto(c.comentario); }}
                          className="inline-flex items-center gap-1 text-xxs text-text-muted hover:text-text">
                          <Pencil size={10} /> Editar
                        </button>
                        <button onClick={() => eliminar(c.id)}
                          className="inline-flex items-center gap-1 text-xxs text-text-muted hover:text-danger">
                          <Trash2 size={10} /> Eliminar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border-light">
          <Field label="Nuevo comentario" htmlFor="nuevo-comentario">
            <div className="flex gap-2">
              <textarea id="nuevo-comentario" value={nuevo} maxLength={2000} rows={2}
                onChange={(e) => setNuevo(e.target.value)}
                placeholder="Escriba un comentario…"
                className="flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text resize-y outline-none focus:border-accent" />
              <button onClick={agregar} disabled={guardando || !nuevo.trim()}
                className="self-end px-3 py-1.5 rounded-md bg-primary text-accent text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                <Send size={12} /> Enviar
              </button>
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}
