'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tabla de contenidos dinámica.
 * Genera un índice a partir de los H2 del artículo.
 * Solo se muestra si hay al menos 2 H2.
 */
export function BlogTOC() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Array<{ id: string; text: string }>>([]);

  useEffect(() => {
    const article = document.querySelector('.article-body');
    if (!article) return;

    const h2s = article.querySelectorAll('h2');
    if (h2s.length < 2) return;

    const items: Array<{ id: string; text: string }> = [];
    h2s.forEach((h2, i) => {
      if (!h2.id) {
        h2.id = `section-${i + 1}`;
      }
      items.push({ id: h2.id, text: h2.textContent?.trim() || '' });
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadings(items);
  }, []);

  if (headings.length < 2) return null;

  return (
    <div ref={containerRef} className="mb-8 p-5 rounded-xl border border-border/40 bg-surface-alt border-l-3 border-l-accent">
      <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">📑 Tabla de contenidos</p>
      <nav aria-label="Tabla de contenidos">
        <ul className="space-y-1.5">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className="text-sm text-text-secondary hover:text-primary transition-colors no-underline border-b border-dotted border-border/30 hover:border-accent/50"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.id);
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top, behavior: 'smooth' });
                    history.pushState(null, '', `#${h.id}`);
                  }
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
