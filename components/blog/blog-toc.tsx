'use client';

import type { TocHeading } from '@/lib/blog-toc';

/**
 * Tabla de contenidos del artículo de blog.
 *
 * Cambio SEO/GEO: antes este componente era client-only y generaba los IDs de
 * los H2 en useEffect, por lo que el HTML servidor no contenía anchors
 * (#section-1) ni el TOC visible para crawlers/LLMs. Ahora:
 *   - Los IDs se asignan en el servidor (lib/blog-toc.ts injectHeadingIds).
 *   - Este componente recibe `headings` como prop y se renderiza en SSR.
 *   - El smooth-scroll al hacer clic se mantiene como enhancement progresivo.
 *
 * El componente sigue siendo `'use client'` porque necesita `onClick` para el
 * scroll suave y el pushState, pero el HTML inicial (el que ven crawlers y
 * LLMs) ya contiene el TOC completo con los anchors correctos.
 *
 * Solo se muestra si hay ≥2 H2.
 */

interface BlogTOCProps {
  /** Headings extraídos en el servidor vía lib/blog-toc.ts. */
  headings: TocHeading[];
}

export function BlogTOC({ headings }: BlogTOCProps) {
  const h2s = headings.filter((h) => h.level === 2);
  if (h2s.length < 2) return null;

  return (
    <div className="mb-8 p-5 rounded-xl border border-border/40 bg-surface-alt border-l-3 border-l-accent">
      <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">📑 Tabla de contenidos</p>
      <nav aria-label="Tabla de contenidos">
        <ul className="space-y-1.5">
          {h2s.map((h) => (
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
