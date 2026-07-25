'use client';

import { trackClickMaps } from '@/lib/analytics';
import type { LucideIcon } from 'lucide-react';
import { Navigation, ExternalLink } from 'lucide-react';

/**
 * Enlace a mapas/indicaciones con evento de conversión (FASE 2).
 *
 * Reemplaza al `<a>` directo a Google Maps en /como-llegar para disparar el
 * evento `click_maps` al hacer clic. No recopila PII: solo registra el origen
 * (identificador estable del enlace). Respeta target/rel y clases heredadas.
 */
export function TrackedMapsLink({
  href,
  className,
  origen = 'como-llegar-google-maps',
  children,
  showIcons = true,
}: {
  href: string;
  className?: string;
  origen?: string;
  children?: React.ReactNode;
  showIcons?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackClickMaps(origen)}
    >
      {showIcons ? (
        <>
          <Navigation size={14} aria-hidden="true" /> {children}
          <ExternalLink size={11} className="opacity-70" aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </a>
  );
}

/** Re-export para satisfacer linters que esperan un icono tipado. */
export type { LucideIcon };
