'use client';

/**
 * PromptDialog — diálogo modal del design system con entrada de texto.
 *
 * Alternativa accesible a `prompt()` nativo del navegador. A diferencia de
 * `useConfirm` (que sólo devuelve boolean), éste devuelve el texto introducido
 * por el usuario o `null` si cancela.
 *
 * Caso de uso canónico: pedir un motivo (rechazo de documento, motivo de
 * bloqueo, etc.) con validación de longitud.
 *
 * Patrón idéntico a `components/ui/confirm.tsx`: contexto + provider + hook,
 * focus trap, cerrado por Escape/overlay, foco al primer campo, accesible
 * (role="alertdialog", aria-modal).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { cn } from '@/lib/ui';

export interface PromptInput {
  title: string;
  description?: string;
  placeholder?: string;
  /** Texto inicial del campo (vacío por defecto). */
  defaultValue?: string;
  /** Etiqueta del botón de confirmación. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tono visual del icono y botón de confirmación. */
  tone?: 'danger' | 'warning' | 'primary';
  /** Longitud mínima requerida (default 1). El botón se deshabilita si no se cumple. */
  minLength?: number;
  maxLength?: number;
  /** true → textarea multilínea; false → input de una línea. Default true. */
  multiline?: boolean;
}

interface PromptContextValue {
  prompt: (input: PromptInput) => Promise<string | null>;
}

const PromptContext = createContext<PromptContextValue | null>(null);

export function usePromptDialog(): (input: PromptInput) => Promise<string | null> {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error('usePromptDialog must be used within PromptDialogProvider');
  return ctx.prompt;
}

interface PendingPrompt extends PromptInput {
  value: string;
}

export function PromptDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolverRef = useRef<((v: string | null) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(pending));

  const minLength = pending?.minLength ?? 1;
  const isValid = pending ? pending.value.trim().length >= minLength : false;

  const close = useCallback((value: string | null) => {
    setPending(null);
    setError(null);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  }, []);

  const prompt = useCallback((input: PromptInput) => {
    setPending({ ...input, value: input.defaultValue ?? '' });
    setError(null);
    return new Promise<string | null>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, close]);

  useEffect(() => {
    if (pending) cancelRef.current?.focus();
  }, [pending]);

  const value = useMemo(() => ({ prompt }), [prompt]);

  const submit = () => {
    if (!pending) return;
    const trimmed = pending.value.trim();
    if (trimmed.length < minLength) {
      setError(`Introduzca al menos ${minLength} carácter(es).`);
      return;
    }
    if (pending.maxLength && trimmed.length > pending.maxLength) {
      setError(`Máximo ${pending.maxLength} caracteres.`);
      return;
    }
    close(trimmed);
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
      {pending && (
        <div
          className="no-print fixed inset-0 z-[95] flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => close(null)}
            aria-hidden="true"
          />
          <div
            ref={trapRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="prompt-title"
            aria-describedby={pending.description ? 'prompt-desc' : undefined}
            className="relative bg-surface rounded-lg shadow-xl border border-border-light w-full max-w-md p-5"
          >
            <button
              type="button"
              onClick={() => close(null)}
              aria-label="Cerrar"
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-alt"
            >
              <X size={16} />
            </button>

            <div className="flex gap-3 mb-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  pending.tone === 'danger' && 'bg-danger-bg text-danger',
                  pending.tone === 'warning' && 'bg-warning-bg text-warning',
                  (!pending.tone || pending.tone === 'primary') && 'bg-info-bg text-info',
                )}
              >
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h2 id="prompt-title" className="text-base font-bold text-text">
                  {pending.title}
                </h2>
                {pending.description && (
                  <p id="prompt-desc" className="text-sm text-text-secondary mt-1">
                    {pending.description}
                  </p>
                )}
              </div>
            </div>

            {pending.multiline === false ? (
              <input
                type="text"
                value={pending.value}
                autoFocus
                placeholder={pending.placeholder}
                maxLength={pending.maxLength}
                onChange={(e) => {
                  setPending(p => (p ? { ...p, value: e.target.value } : p));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
              />
            ) : (
              <textarea
                value={pending.value}
                autoFocus
                rows={4}
                placeholder={pending.placeholder}
                maxLength={pending.maxLength}
                onChange={(e) => {
                  setPending(p => (p ? { ...p, value: e.target.value } : p));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-all resize-y min-h-[88px] hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
              />
            )}

            {error && (
              <p role="alert" className="text-xxs text-danger mt-1.5 font-semibold">
                {error}
              </p>
            )}
            {pending.maxLength && (
              <p className="text-xxs text-text-muted mt-1 text-right tabular-nums">
                {pending.value.length}/{pending.maxLength}
              </p>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(null)}
                className="px-4 py-2 rounded-md border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt"
              >
                {pending.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!isValid}
                className={cn(
                  'px-4 py-2 rounded-md text-white text-sm font-bold transition-opacity',
                  pending.tone === 'danger' && 'bg-danger hover:opacity-90',
                  pending.tone === 'warning' && 'bg-warning hover:opacity-90',
                  (!pending.tone || pending.tone === 'primary') && 'bg-primary hover:bg-primary-light',
                  !isValid && 'opacity-50 cursor-not-allowed hover:opacity-50',
                )}
              >
                {pending.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PromptContext.Provider>
  );
}
