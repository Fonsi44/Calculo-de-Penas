'use client';

import { MessageCircle, RotateCcw } from 'lucide-react';

type Props = {
  whatsappDraft?: string;
  retrying?: boolean;
  onRetry: () => void;
  onWhatsApp: (draft: string) => void;
};

/** Acciones únicas tras error de consulta legal (sin duplicar chips ni copiar). */
export function ChatLegalErrorActions({
  whatsappDraft,
  retrying = false,
  onRetry,
  onWhatsApp,
}: Props) {
  const draft = whatsappDraft?.trim();

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent text-primary hover:bg-accent-light disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-shadow-accent"
      >
        <RotateCcw size={14} className={retrying ? 'animate-spin' : ''} aria-hidden="true" />
        <span>{retrying ? 'Reintentando…' : 'Reintentar consulta'}</span>
      </button>
      {draft && (
        <button
          type="button"
          onClick={() => onWhatsApp(draft)}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-lg text-xs font-semibold border border-success/40 bg-success/10 text-success hover:bg-success/15 disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MessageCircle size={14} aria-hidden="true" />
          <span>Enviar por WhatsApp</span>
        </button>
      )}
    </div>
  );
}
