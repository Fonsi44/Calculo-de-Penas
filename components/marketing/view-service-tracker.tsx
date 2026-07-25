'use client';

/**
 * Dispara el evento `view_service` al montar la página de un servicio
 * prioritario (FASE 3 §19). Sin PII: el único parámetro es el slug/identificador
 * del servicio (no contenido del usuario).
 *
 * Se excluye automáticamente de preview e intranet vía `isAnalyticsExcludedPath`
 * aplicado dentro del helper `trackViewService` (lib/analytics.ts), que a su vez
 * consulta `ANALYTICS_EXCLUDED_PREFIXES`.
 *
 * Uso (una sola vez por página, dentro del árbol público):
 *   <ViewServiceTracker serviceSlug="derecho-penal" />
 */
import { useEffect } from 'react';
import { trackViewService } from '@/lib/analytics';

export function ViewServiceTracker({ serviceSlug }: { serviceSlug: string }) {
  useEffect(() => {
    trackViewService(serviceSlug);
  }, [serviceSlug]);
  return null;
}
