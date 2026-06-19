'use client';

import { useState } from 'react';

export function RssSidebar() {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = `${window.location.origin}/blog/feed.xml`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2.5 p-4 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all w-full text-left cursor-pointer"
      aria-label="Copiar enlace RSS al portapapeles"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-dark flex-shrink-0">
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-bold text-text leading-tight">
          {copied ? '¡Enlace copiado!' : 'Suscribirse al RSS'}
        </p>
        <p className="text-xxs text-text-muted mt-0.5">
          {copied ? 'Péguelo en su lector RSS' : 'Reciba nuevos artículos'}
        </p>
      </div>
    </button>
  );
}
