/**
 * Política única de mensajes comerciales sobre la evaluación inicial.
 *
 * El propietario no ha confirmado que todas las consultas sean gratuitas.
 * Por tanto, la formulación canónica es NEUTRA:
 *
 *   «Evaluación inicial confidencial»
 *
 * Queda prohibido publicar variantes comerciales no confirmadas (consulta
 * gratuita, sin costo, sin compromiso como gratuidad garantizada, etc.).
 * No se alteran textos jurídicos donde «gratuito»/«sin costo» describen
 * legítimamente un trámite, beneficio público o concepto legal.
 */

export const EVALUACION_INICIAL_CONFIDENCIAL = 'Evaluación inicial confidencial';

/** Variantes comerciales prohibidas (claims del despacho, no textos jurídicos). */
export const PROHIBITED_CONSULTATION_CLAIM_PATTERNS: readonly RegExp[] = [
  /consulta\s+gratuit[oa]s?\b/gi,
  /consulta\s+sin\s+cost[oe]\b/gi,
  /consulta\s+(sin\s+cost[oe]|gratis|gratuit[oa])\b/gi,
  /primera\s+consulta\s+(de\s+evaluaci[oó]n\s+)?(es\s+)?(sin\s+cost[oe]|gratis|gratuit[oa]|no\s+tiene\s+costo|no\s+es\s+gratuit[oa])\b/gi,
  /evaluaci[oó]n\s+inicial\s+(sin\s+cost[oe]|gratis|gratuit[oa])\b/gi,
  /evaluaci[oó]n\s+gratuit[oa]s?\b/gi,
  /consulta\s+inicial\s+(confidencial\s+)?(sin\s+cost[oe]|gratis|gratuit[oa])\b/gi,
  /(primera\s+consulta|consulta\s+inicial|primera\s+evaluaci[oó]n|evaluaci[oó]n\s+inicial)[^.\n¡!]{0,45}?\bsin\s+compromiso\b/gi,
  /\bconsulta\b[^.\n¡!]{0,45}?\bsin\s+compromiso\b/gi,
  /(evaluamos?|evaluaci[oó]n)[^.\n]{0,45}?\bsin\s+cost[oe]\b/gi,
];

export interface ClaimMatch {
  patternIndex: number;
  matched: string;
}

/** Escanea un texto y devuelve las coincidencias de claims prohibidos. */
export function scanProhibitedClaims(text: string): ClaimMatch[] {
  const matches: ClaimMatch[] = [];
  PROHIBITED_CONSULTATION_CLAIM_PATTERNS.forEach((re, index) => {
    for (const match of text.matchAll(re)) {
      matches.push({ patternIndex: index, matched: match[0] });
    }
  });
  return matches;
}

/** Lanza si el texto contiene una variante comercial no autorizada. */
export function assertNoProhibitedClaims(
  text: string,
  context = 'texto',
): void {
  const matches = scanProhibitedClaims(text);
  if (matches.length > 0) {
    const found = [...new Set(matches.map((m) => m.matched))].join(' | ');
    throw new Error(
      `[marketing-policy] Claim comercial no autorizado en ${context}: "${found}". `
      + `Usar la formulación canónica: "${EVALUACION_INICIAL_CONFIDENCIAL}".`,
    );
  }
}
