'use client';

import { useState } from 'react';

export function RssButton() {
  const [copied, setCopied] = useState(false);

  const feedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/feed.xml`;

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
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/5 text-xs font-bold uppercase tracking-wider text-accent-dark hover:bg-accent/10 hover:border-accent/50 transition-all cursor-pointer"
        aria-label="Copiar enlace RSS al portapapeles"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-dark">
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1" />
        </svg>
        {copied ? '¡Enlace copiado!' : 'Copiar enlace RSS'}
      </button>
      {copied && <p className="text-xxs text-success font-semibold">Péguelo en su lector RSS favorito</p>}
      {!copied && (
        <a
          href="/blog/feed.xml"
          className="text-xxs text-text-muted hover:text-accent-dark underline underline-offset-2"
        >
          Abrir feed XML
        </a>
      )}
    </div>
  );
}
