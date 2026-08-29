'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type Props = {
  text: string;
};

/** Copia el borrador de WhatsApp generado por el asistente. */
export function ChatCopyWhatsappButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!text.trim() || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="mt-2 inline-flex items-center gap-1.5 min-h-10 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/30 hover:bg-success/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={copied ? 'Mensaje copiado' : 'Copiar mensaje para WhatsApp'}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{copied ? 'Copiado' : 'Copiar para WhatsApp'}</span>
    </button>
  );
}
