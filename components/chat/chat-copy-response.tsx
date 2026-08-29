'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type Props = {
  text: string;
  label?: string;
};

/** Copia texto del asistente al portapapeles. */
export function ChatCopyResponseButton({ text, label = 'Copiar respuesta' }: Props) {
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
      className="mt-3 inline-flex items-center gap-1.5 min-h-10 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-dark hover:bg-surface-alt border border-transparent hover:border-border-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={copied ? 'Texto copiado al portapapeles' : label}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{copied ? 'Copiado' : label}</span>
    </button>
  );
}
