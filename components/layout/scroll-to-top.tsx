'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Restaura el scroll al inicio en cada cambio de ruta.
 * Solo scrolla si la navegación no incluye un hash (ancla interna).
 * Next.js App Router ya hace esto por defecto, pero este componente
 * actúa como guarda para casos donde la restauración nativa no dispare.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Si la URL tiene hash, no interferir (el navegador lo maneja).
    if (window.location.hash) return;

    // Forzar scroll al inicio.
    window.scrollTo(0, 0);
  }, [pathname, searchParams]);

  return null;
}
