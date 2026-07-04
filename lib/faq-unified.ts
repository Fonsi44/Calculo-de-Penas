/**
 * Arquitectura FAQ unificada — superficie de imports canónica.
 *
 * El sitio tiene CUATRO orígenes de preguntas frecuentes, cada uno con un
 * rol distinto y legítimo. Este módulo los documenta y expone helpers
 * tipados para que las páginas no acoplen su import al origen concreto.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ Origen                  │ Rol                                         │
 * ├─────────────────────────┼─────────────────────────────────────────────┤
 * │ DB `faq_entries`        │ Repositorio global edit vía intranet.       │
 * │ (lib/faq-db.ts)         │ Fuente de /preguntas-frecuentes.            │
 * │                         │ Fallback estático: data/faq.ts (73 preg.).  │
 * ├─────────────────────────┼─────────────────────────────────────────────┤
 * │ data/faqs-hubs.ts       │ FAQ editorial AEO específica por hub        │
 * │                         │ comercial (servicios-juridicos, despacho,   │
 * │                         │ solicitar-consulta). Optimizada para rich   │
 * │                         │ results FAQPage y asistentes IA.            │
 * ├─────────────────────────┼─────────────────────────────────────────────┤
 * │ area.faqs embebidas     │ FAQ propia de cada área jurídica, vive en  │
 * │ (data/areas-juridicas)  │ su página de detalle /servicios-juridicos/  │
 * │                         │ [slug] y /derecho-penal/[slug].             │
 * ├─────────────────────────┼─────────────────────────────────────────────┤
 * │ i18n home inline        │ DEPRECADA: la home debe consumir            │
 * │ (app/(public)/page.tsx) │ getFaqsForHub('home') o enlazar a          │
 * │                         │ /preguntas-frecuentes, no duplicar en i18n. │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Reglas (AGENTS.md R4, R13, R14):
 *  - No se inventan datos legales, plazos exactos ni costos fijos.
 *  - Las FAQs comerciales pueden mencionar "depende del caso" + CTA consulta.
 *  - Una sola instancia visible de FAQ por página (R14 vía <LegalDisclaimer>).
 */
import { cache } from 'react';
import {
  FAQ_SERVICIOS_JURIDICOS,
  FAQ_DESPACHO,
  FAQ_SOLICITAR_CONSULTA,
  type HubFaqItem,
} from '@/data/faqs-hubs';
import { getFaqsForPublicPage, type FaqCategoryPublic, type FaqQuestion } from './faq-db';

export type { FaqQuestion, FaqCategoryPublic, HubFaqItem };

/** Identificadores de hub comercial con FAQ editorial propia. */
export type HubFaqId =
  | 'servicios-juridicos'
  | 'despacho'
  | 'solicitar-consulta';

const HUB_FAQ_MAP: Record<HubFaqId, HubFaqItem[]> = {
  'servicios-juridicos': FAQ_SERVICIOS_JURIDICOS,
  despacho: FAQ_DESPACHO,
  'solicitar-consulta': FAQ_SOLICITAR_CONSULTA,
};

/**
 * Devuelve la FAQ editorial de un hub comercial.
 * Es contenido estático curado (no DB): optimizado para AEO y rich results.
 */
export function getFaqsForHub(hub: HubFaqId): HubFaqItem[] {
  return HUB_FAQ_MAP[hub] ?? [];
}

/**
 * Devuelve el repositorio FAQ global (DB → fallback data/faq.ts).
 * Es la fuente de /preguntas-frecuentes y de cualquier bloque que necesite
 * mostrar preguntas agrupadas por categoría.
 */
export const getFaqsGlobal = cache(async (): Promise<FaqCategoryPublic[]> => {
  return getFaqsForPublicPage();
});

/**
 * Devuelve las N preguntas más recientes del repositorio global,
 * aplanadas (sin categoría). Útil para bloques "preguntas relacionadas"
 * en páginas que no son el hub FAQ principal.
 */
export const getRecentFaqs = cache(async (limit = 6): Promise<FaqQuestion[]> => {
  const categorias = await getFaqsForPublicPage();
  const todas: FaqQuestion[] = [];
  for (const cat of categorias) {
    for (const p of cat.preguntas) todas.push(p);
    if (todas.length >= limit * 2) break;
  }
  return todas.slice(0, limit);
});
