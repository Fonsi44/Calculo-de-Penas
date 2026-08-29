'use client';

import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { whatsappHref } from '@/lib/site';

type Props = {
  text: string;
  onOpenWhatsApp?: () => void;
};

/** Abre WhatsApp con el borrador y permite copiarlo al portapapeles. */
export function ChatCopyWhatsappButton({ text, onOpenWhatsApp }: Props) {
  const [copied, setCopied] = useState(false);
  const draft = text.trim();

  const onCopy = async () => {
    if (!draft || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!draft) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <a
        href={whatsappHref(draft)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpenWhatsApp}
        className="inline-flex items-center gap-1.5 min-h-10 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <MessageCircle size={14} aria-hidden="true" />
        <span>Enviar por WhatsApp</span>
      </a>
      <button
        type="button"
        onClick={() => void onCopy()}
        className="inline-flex items-center gap-1.5 min-h-10 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-dark hover:bg-surface-alt border border-border-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={copied ? 'Mensaje copiado' : 'Copiar mensaje para WhatsApp'}
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        <span>{copied ? 'Copiado' : 'Copiar mensaje'}</span>
      </button>
    </div>
  );
}
