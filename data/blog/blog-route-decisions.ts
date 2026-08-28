export type BlogRouteDecision = {
  source: string;
  destination: string;
  contract: 'HISTORICAL_REDIRECT';
  evidence: string;
};

/**
 * Decisiones editoriales que requieren evidencia adicional a la configuración
 * técnica. No contiene cuerpos ni puede cambiar estados de publicación.
 */
export const BLOG_ROUTE_DECISIONS: Readonly<Record<string, BlogRouteDecision>> = {
  '/blog/derecho-civil/herencias-honduras-fallece-familiar': {
    source: '/blog/derecho-civil/herencias-honduras-fallece-familiar',
    destination: '/blog/derecho-civil/testamentos-sucesiones-herencia-honduras',
    contract: 'HISTORICAL_REDIRECT',
    evidence:
      'Production read-only: published=false; Preview DB: slug ausente; '
      + 'restaurarlo exigiría cambiar estado editorial o incorporar un body.',
  },
};
