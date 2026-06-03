import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { IconButton } from './icon-button';
import { cn } from '@/lib/ui';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  full: 'max-w-[min(96vw,1100px)]',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }: ModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" role="presentation">
      <div
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-desc' : undefined}
        className={cn(
          'relative bg-surface w-full shadow-2xl flex flex-col overflow-hidden',
          'rounded-t-xl sm:rounded-lg border border-border-light',
          'max-h-[92vh] sm:max-h-[88vh]',
          SIZE[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border-light">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-bold text-primary">{title}</h2>
            {description && (
              <p id="modal-desc" className="text-xs text-text-secondary mt-0.5">{description}</p>
            )}
          </div>
          <IconButton label="Cerrar" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="px-5 py-3 border-t border-border-light bg-surface-alt flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
