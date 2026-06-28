'use client';

/**
 * SGIE — Buscador global ⌘K (Sprint 1, tarea 4).
 *
 * Modal accesible que busca en clientes, expedientes, documentos y tareas con
 * scope por abogado (backend /api/sgie/buscar). Agrupa resultados por tipo.
 *
 * Teclado:
 *   - Ctrl/⌘+K abre (registro global de keydown).
 *   - ↑/↓ navega, Enter abre, Esc cierra.
 *
 * Seguridad: el endpoint aplica scope; aquí sólo se renderiza y navega.
 * No expón datos fuera de lo que devuelve la API.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, Users, FolderKanban, FileText, CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/ui';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { Spinner } from '@/components/ui/spinner';
import type { TipoResultado, ResultadoBusqueda } from '@/lib/sgie/buscar-db';

const TIPO_META: Record<TipoResultado, {
  label: string;
  plural: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = {
  cliente: { label: 'Cliente', plural: 'Clientes', icon: Users },
  expediente: { label: 'Expediente', plural: 'Expedientes', icon: FolderKanban },
  documento: { label: 'Documento', plural: 'Documentos', icon: FileText },
  tarea: { label: 'Tarea', plural: 'Tareas', icon: CheckSquare },
};

export function GlobalSearch({ externalOpen, onExternalOpenChange }: {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
} = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  // setOpen unificado: acepta boolean o updater (compat con useState y con props controladas).
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value;
      if (onExternalOpenChange) onExternalOpenChange(next);
      else setInternalOpen(next);
    },
    [open, onExternalOpenChange],
  );
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [activo, setActivo] = useState(0);
  const [modoHibrido, setModoHibrido] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  // Abrir con Ctrl/⌘+K. Cerrar con Escape (lo gestiona el overlay + input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  // Foco al input al abrir + reset del estado de búsqueda.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset inicial al abrir el modal
      setQ('');
      setResultados([]);
      setActivo(0);
      // microtask para asegurar que el input está montado
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounce de búsqueda.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset al vaciar el término
      setResultados([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const endpoint = modoHibrido
          ? `/api/sgie/buscar/semantica?q=${encodeURIComponent(term)}&limite=15`
          : `/api/sgie/buscar?q=${encodeURIComponent(term)}&porTipo=5`;
        const res = await fetch(endpoint, { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          setResultados(d.resultados ?? []);
        } else {
          setResultados([]);
        }
      } catch {
        setResultados([]);
      } finally {
        setLoading(false);
        setActivo(0);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, modoHibrido]);

  // Resultados aplanados para navegación por teclado (orden estable).
  const planos = useMemo(() => resultados, [resultados]);

  const cerrar = useCallback(() => setOpen(false), [setOpen]);

  const abrirResultado = useCallback((r: ResultadoBusqueda) => {
    router.push(r.href);
    cerrar();
  }, [router, cerrar]);

  const onKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { cerrar(); return; }
    if (planos.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((a) => (a + 1) % planos.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => (a - 1 + planos.length) % planos.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = planos[activo];
      if (r) abrirResultado(r);
    }
  };

  // Agrupar por tipo preservando orden.
  const grupos = useMemo(() => {
    const m = new Map<TipoResultado, ResultadoBusqueda[]>();
    for (const r of planos) {
      if (!m.has(r.tipo)) m.set(r.tipo, []);
      m.get(r.tipo)!.push(r);
    }
    return Array.from(m.entries());
  }, [planos]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-20 px-4" role="presentation">
      <div className="absolute inset-0 bg-overlay" onClick={cerrar} aria-hidden="true" />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
        className="relative bg-surface rounded-lg shadow-xl border border-border-light w-full max-w-xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border-light">
          <Search size={16} className="text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyNav}
            placeholder="Buscar clientes, expedientes, documentos, tareas…"
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
            aria-label="Término de búsqueda"
            aria-controls="sgie-search-results"
          />
          {loading ? <Spinner size="sm" /> : (
            <button onClick={cerrar} aria-label="Cerrar búsqueda" className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-alt">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-light bg-surface-alt/40">
          <label className="flex items-center gap-1.5 text-xxs text-text-secondary cursor-pointer select-none">
            <input type="checkbox" checked={modoHibrido} onChange={(e) => setModoHibrido(e.target.checked)} className="accent-accent" />
            Búsqueda inteligente (ranking por relevancia)
          </label>
          {modoHibrido && <span className="text-xxs text-text-muted">Resultado asistido; verificar fuente.</span>}
        </div>

        {/* Resultados */}
        <div id="sgie-search-results" className="max-h-[60vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto text-text-muted mb-2 opacity-50" />
              <p className="text-sm text-text-secondary">Escriba al menos 2 caracteres para buscar.</p>
              <p className="text-xxs text-text-muted mt-2">Clientes · Expedientes · Documentos · Tareas</p>
            </div>
          ) : !loading && planos.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-text">Sin resultados</p>
              <p className="text-xs text-text-secondary mt-1">No se encontraron coincidencias para «{q}».</p>
            </div>
          ) : (
            <ul className="py-1.5">
              {grupos.map(([tipo, items]) => {
                const meta = TIPO_META[tipo];
                const Icono = meta.icon;
                return (
                  <li key={tipo}>
                    <p className="px-3 pt-2 pb-1 text-xxs font-bold uppercase tracking-wider text-text-muted">
                      {meta.plural}
                    </p>
                    <ul>
                      {items.map((r) => {
                        const idx = planos.indexOf(r);
                        const sel = idx === activo;
                        const ItemIcon = TIPO_META[r.tipo].icon;
                        return (
                          <li key={`${r.tipo}-${r.id}`}>
                            <button
                              type="button"
                              onClick={() => abrirResultado(r)}
                              onMouseEnter={() => setActivo(idx)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                                sel ? 'bg-accent/10' : 'hover:bg-surface-alt',
                              )}
                              aria-current={sel ? 'true' : undefined}
                            >
                              <ItemIcon size={15} className={cn('flex-shrink-0', sel ? 'text-accent-dark' : 'text-text-muted')} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-text truncate">{r.titulo}</p>
                                {r.subtitulo && <p className="text-xxs text-text-muted truncate">{r.subtitulo}</p>}
                              </div>
                              <Icono size={12} className="text-text-muted flex-shrink-0 opacity-50" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie con atajos */}
        <div className="px-3 py-1.5 border-t border-border-light bg-surface-alt/50 flex items-center justify-between text-xxs text-text-muted">
          <span><kbd className="font-mono">↑↓</kbd> navegar · <kbd className="font-mono">↵</kbd> abrir</span>
          <span><kbd className="font-mono">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
