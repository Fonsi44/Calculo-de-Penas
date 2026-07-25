'use client';

import { useEffect } from 'react';
import { trackViewLocalPage } from '@/lib/analytics';

/**
 * Dispara el evento `view_local_page` al montar una página local
 * (/abogados-en-{slug}). Es el equivalente local de ViewServiceTracker.
 *
 * Reglas (AGENTS.md §3, §6): sin PII. El único parámetro es el slug de la
 * localidad (categoría), nunca la dirección o ciudad exacta del usuario.
 * isAnalyticsExcludedPath (dentro de trackViewLocalPage vía trackEvent) ya
 * filtra preview e intranet; además el componente solo se monta en páginas
 * públicas. No renderiza nada.
 */
export function ViewLocalPageTracker({ locationSlug }: { locationSlug: string }) {
  useEffect(() => {
    trackViewLocalPage(locationSlug);
  }, [locationSlug]);
  return null;
}
