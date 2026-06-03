'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { cn } from '@/lib/ui';

interface ConfirmInput {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
}

interface ConfirmContextValue {
  confirm: (input: ConfirmInput) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): (input: ConfirmInput) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<ConfirmInput | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(pending));

  const close = useCallback((value: boolean) => {
    setPending(null);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  }, []);

  const confirm = useCallback((input: ConfirmInput) => {
    setPending(input);
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, close]);

  useEffect(() => {
    if (pending) cancelRef.current?.focus();
  }, [pending]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <div
          className="no-print fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => close(false)}
            aria-hidden="true"
          />
          <div
            ref={trapRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={pending.description ? 'confirm-desc' : undefined}
            className="relative bg-surface rounded-lg shadow-xl border border-border-light w-full max-w-sm p-5"
          >
            <button
              type="button"
              onClick={() => close(false)}
              aria-label="Cerrar"
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-alt"
            >
              <X size={16} />
            </button>

            <div className="flex gap-3">
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
                <h2 id="confirm-title" className="text-base font-bold text-text">
                  {pending.title}
                </h2>
                {pending.description && (
                  <p id="confirm-desc" className="text-sm text-text-secondary mt-1">
                    {pending.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 rounded-md border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt"
              >
                {pending.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={cn(
                  'px-4 py-2 rounded-md text-white text-sm font-bold',
                  pending.tone === 'danger' && 'bg-danger hover:opacity-90',
                  pending.tone === 'warning' && 'bg-warning hover:opacity-90',
                  (!pending.tone || pending.tone === 'primary') && 'bg-primary hover:bg-primary-light',
                )}
              >
                {pending.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
