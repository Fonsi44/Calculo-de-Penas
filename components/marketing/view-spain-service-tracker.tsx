'use client';

import { useEffect } from 'react';
import { trackViewSpainService } from '@/lib/analytics';

/**
 * Dispara el evento `view_spain_service` al montar una subpágina del hub
 * Honduras–España. Equivalente ibérico de ViewServiceTracker.
 *
 * Reglas (AGENTS.md §3, §6): sin PII. El único parámetro es el slug del
 * servicio (categoría). No renderiza nada. isAnalyticsExcludedPath (dentro de
 * trackViewSpainService vía trackEvent) filtra preview e intranet.
 */
export function ViewSpainServiceTracker({ serviceSlug }: { serviceSlug: string }) {
  useEffect(() => {
    trackViewSpainService(serviceSlug);
  }, [serviceSlug]);
  return null;
}
