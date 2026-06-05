'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  value: string;
  variant?: 'default' | 'inverse';
  label?: string;
}

export function CopyableAddress({ value, variant = 'default', label = 'Copiar' }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
    }
  };

  const isInverse = variant === 'inverse';

  return (
    <div
      className={`flex items-center gap-2 rounded-md p-2 ${
        isInverse ? 'bg-primary-light/30' : 'bg-surface-alt'
      }`}
    >
      <p
        className={`text-[12px] leading-snug flex-1 break-words ${
          isInverse ? 'text-text-inverse/90' : 'text-text'
        }`}
      >
        {value}
      </p>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-opacity ${
          isInverse
            ? 'bg-accent text-primary hover:opacity-90'
            : 'bg-primary text-text-inverse hover:opacity-90'
        }`}
        aria-label={copied ? 'Dirección copiada' : 'Copiar dirección'}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        <span>{copied ? 'Copiado' : label}</span>
      </button>
    </div>
  );
}
