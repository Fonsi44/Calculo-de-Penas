/**
 * Utilidad común y tipada para construir FAQ visibles y su schema FAQPage
 * desde la MISMA fuente, garantizando:
 *   - sin preguntas duplicadas en una misma URL;
 *   - sin respuestas vacías;
 *   - schema generado únicamente a partir de las parejas que se renderizan;
 *   - sin claims comerciales no autorizados en preguntas/respuestas.
 */
import { scanProhibitedClaims } from '@/lib/marketing-policy';

export interface FaqPair {
  pregunta: string;
  respuesta: string;
}

/**
 * Normaliza y deduplica una lista de FAQ. Solo devuelve parejas visibles
 * (pregunta y respuesta no vacías). El orden de aparición se conserva.
 */
export function prepareFaqPairs(faqs: readonly FaqPair[]): FaqPair[] {
  const seen = new Set<string>();
  const out: FaqPair[] = [];
  for (const faq of faqs) {
    const pregunta = (faq.pregunta ?? '').trim();
    const respuesta = (faq.respuesta ?? '').trim();
    const key = pregunta.toLocaleLowerCase('es-HN');
    if (!pregunta || !respuesta || seen.has(key)) continue;
    seen.add(key);
    out.push({ pregunta, respuesta });
  }
  return out;
}

/**
 * Verifica que ninguna pregunta/respuesta contenga un claim comercial no
 * autorizado. Lanza con el texto conflictivo.
 */
export function assertFaqPairsPolicySafe(faqs: readonly FaqPair[]): void {
  for (const faq of faqs) {
    scanProhibitedClaims(`${faq.pregunta} ${faq.respuesta}`).forEach((match) => {
      throw new Error(
        `[faq-policy] Claim comercial no autorizado en FAQ: "${match.matched}". `
        + 'Usar la formulación canónica «Evaluación inicial confidencial».',
      );
    });
  }
}

/**
 * Construye el schema FAQPage a partir de las parejas PREPARADAS (las mismas
 * que se renderizan). Devuelve null si no hay parejas, para no emitir schema
 * de contenido oculto o vacío.
 */
export function faqPageSchemaFromPairs(
  faqs: readonly FaqPair[],
  url: string,
): Record<string, unknown> | null {
  const prepared = prepareFaqPairs(faqs);
  if (prepared.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faqpage`,
    url,
    mainEntity: prepared.map((faq) => ({
      '@type': 'Question',
      name: faq.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.respuesta,
      },
    })),
  };
}
