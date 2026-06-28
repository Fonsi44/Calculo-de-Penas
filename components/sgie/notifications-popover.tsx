'use client';

/**
 * SGIE — Centro de notificaciones in-app (Sprint 2, tarea 5).
 *
 * Badge + popover que muestra notificaciones derivadas (tareas vencidas,
 * alertas críticas, documentos pendientes, eventos próximos, enlaces por
 * expirar). Refresca cada 60 s. Sin persistencia de lectura (notificaciones
 * virtuales).
 *
 * Sprint 2.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, AlertTriangle, FileText, Calendar, Link2, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/ui';
import { Spinner } from '@/components/ui/spinner';
import { SEVERIDAD_TONO, type NotificacionItem, type TipoNotificacion } from '@/lib/sgie/notificaciones';

const ICONO_TIPO: Record<TipoNotificacion, React.ComponentType<{ size?: number; className?: string }>> = {
  tarea_vencida: AlertTriangle,
  alerta_critica: AlertTriangle,
  documento_pendiente: FileText,
  evento_proximo: Calendar,
  enlace_expirando: Link2,
};

interface NotificacionConLeida extends NotificacionItem {
  leida?: boolean;
}

export function NotificationsPopover() {
  const router = useRouter();
  const [abrir, setAbrir] = useState(false);
  const [items, setItems] = useState<NotificacionConLeida[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const fetchNotif = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sgie/notificaciones', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setItems(d.notificaciones ?? []);
        setNoLeidas(d.noLeidas ?? 0);
      }
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarLeida = async (key: string) => {
    setMarcando(true);
    try {
      await fetch('/api/sgie/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      fetchNotif();
    } finally {
      setMarcando(false);
    }
  };

  const marcarTodas = async () => {
    setMarcando(true);
    try {
      await fetch('/api/sgie/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      fetchNotif();
    } finally {
      setMarcando(false);
    }
  };

  // Carga inicial + refresco cada 60 s.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de notificaciones
    fetchNotif();
    const t = setInterval(fetchNotif, 60_000);
    return () => clearInterval(t);
  }, [fetchNotif]);

  // Cerrar al clicar fuera.
  useEffect(() => {
    if (!abrir) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbrir(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [abrir]);

  const abrirItem = (item: NotificacionItem) => {
    router.push(item.href);
    setAbrir(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setAbrir(!abrir); if (!abrir) fetchNotif(); }}
        className="relative p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors"
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
      >
        <Bell size={18} />
        {noLeidas > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-xxs font-bold flex items-center justify-center',
            items.some((i) => i.severidad === 'danger' && !i.leida) ? 'bg-danger text-surface' : 'bg-accent text-surface',
          )}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abrir && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border-light rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-light">
            <h2 className="text-sm font-bold text-text flex items-center gap-1.5">
              <Bell size={14} /> Notificaciones
              {noLeidas > 0 && <span className="text-xxs text-accent-dark font-semibold">({noLeidas} sin leer)</span>}
            </h2>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                disabled={marcando}
                className="inline-flex items-center gap-1 text-xxs text-info hover:underline disabled:opacity-50"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={12} /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CheckCircle size={24} className="mx-auto text-success mb-2 opacity-60" />
                <p className="text-sm font-semibold text-text">Todo al día</p>
                <p className="text-xs text-text-secondary mt-1">No tiene notificaciones pendientes.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border-light">
                {items.map((item) => {
                  const Icono = ICONO_TIPO[item.tipo];
                  const esCritica = item.severidad === 'danger';
                  // Las críticas siguen visibles aunque leídas, pero diferenciadas.
                  const difuminar = item.leida && !esCritica;
                  return (
                    <li key={item.id} className={cn(difuminar && 'opacity-50')}>
                      <div className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors">
                        <button onClick={() => abrirItem(item)} className="flex items-start gap-2.5 flex-1 min-w-0 text-left">
                          <Icono size={15} className={cn('flex-shrink-0 mt-0.5', SEVERIDAD_TONO[item.severidad], item.leida && 'opacity-60')} />
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-xs leading-snug', item.leida ? 'font-normal text-text-secondary' : 'font-semibold text-text')}>{item.titulo}</p>
                            {item.subtitulo && <p className="text-xxs text-text-muted mt-0.5 truncate">{item.subtitulo}</p>}
                          </div>
                        </button>
                        {!item.leida && (
                          <button
                            onClick={() => marcarLeida(item.id)}
                            disabled={marcando}
                            title="Marcar como leída"
                            aria-label={`Marcar como leída: ${item.titulo}`}
                            className="p-1 rounded text-text-muted hover:text-success hover:bg-success/10 flex-shrink-0 disabled:opacity-50"
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border-light bg-surface-alt/40">
              <p className="text-xxs text-text-muted text-center">Se actualiza cada minuto · {new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
