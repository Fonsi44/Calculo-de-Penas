'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/ui';

export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toast: (input: { tone?: ToastTone; title: string; description?: string; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  danger: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TONE_STYLES: Record<ToastTone, { ring: string; icon: string; bar: string; Icon: typeof Info }> = {
  success: { ring: 'border-l-success', icon: 'text-success', bar: 'bg-success', Icon: CheckCircle2 },
  info: { ring: 'border-l-info', icon: 'text-info', bar: 'bg-info', Icon: Info },
  warning: { ring: 'border-l-warning', icon: 'text-warning', bar: 'bg-warning', Icon: AlertTriangle },
  danger: { ring: 'border-l-danger', icon: 'text-danger', bar: 'bg-danger', Icon: AlertCircle },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    ({ tone = 'info', title, description, duration = 4000 }) => {
      const id = ++idRef.current;
      setItems(prev => [...prev, { id, tone, title, description, duration }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ tone: 'success', title, description }),
      info: (title, description) => toast({ tone: 'info', title, description }),
      warning: (title, description) => toast({ tone: 'warning', title, description }),
      danger: (title, description) => toast({ tone: 'danger', title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="no-print fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)] pointer-events-none"
      >
        {items.map(t => (
          <ToastView key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const styles = TONE_STYLES[item.tone];
  const role = item.tone === 'danger' || item.tone === 'warning' ? 'alert' : 'status';
  return (
    <div
      role={role}
      className={cn(
        'relative pointer-events-auto bg-surface border border-border-light border-l-4 rounded-md shadow-md overflow-hidden',
        styles.ring,
      )}
    >
      <div className="flex gap-2 p-3 pr-9">
        <styles.Icon size={18} className={cn('flex-shrink-0 mt-0.5', styles.icon)} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text">{item.title}</p>
          {item.description && (
            <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-alt"
        >
          <X size={14} />
        </button>
      </div>
      {item.duration > 0 && (
        <div className="h-0.5 bg-surface-alt overflow-hidden">
          <div
            className={cn('h-full', styles.bar)}
            style={{
              animation: `toast-progress ${item.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
