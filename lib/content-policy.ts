/**
 * Motor común de política de contenido público (fuente única).
 *
 * Consolida las reglas que deben aplicar en TODOS los puntos de entrada de
 * contenido administrable/publicable:
 *
 *   - Admin (PATCH/POST de `page_content`);
 *   - seeds y fixtures (evitar que una inicialización restaure claims);
 *   - scripts de datos (auditorías, remediación, importaciones);
 *   - API y formularios;
 *   - validaciones de build (gates SEO/GEO);
 *   - auditorías de base de datos.
 *
 * Devuelve resultados estructurados (`ContentPolicyViolation`) en lugar de
 * lanzar excepciones, de modo que cada consumidor decida cómo actuar
 * (bloquear, registrar, remediar o elevar a revisión manual).
 *
 * Reglas cubiertas:
 *   1. Claims comerciales no autorizados (consulta gratuita/sin costo/sin
 *      compromiso como gratuidad) → `lib/marketing-policy.ts`.
 *   2. Testimonios no autorizados (ficticios o de ejemplo) sin reseñas reales.
 *   3. Garantías de éxito / resultados asegurados.
 *   4. Superlativos no verificados (mejores abogados, líderes, nº 1).
 *   5. Porcentajes de éxito sin evidencia.
 *   6. Clientes o casos ficticios/de ejemplo.
 *
 * Los textos jurídicos legítimos donde «gratuito»/«sin costo» describen un
 * trámite, beneficio público o concepto legal real NO se alteran (la
 * formulación canónica comercial es «Evaluación inicial confidencial»).
 */
import {
  EVALUACION_INICIAL_CONFIDENCIAL,
  scanProhibitedClaims,
  type ClaimMatch,
} from '@/lib/marketing-policy';

export type ContentPolicySeverity = 'error' | 'warning';

export type ContentPolicyCode =
  | 'prohibited_commercial_claim'
  | 'unauthorized_testimonial'
  | 'unauthorized_success_guarantee'
  | 'unauthorized_superlative'
  | 'unauthorized_success_rate'
  | 'fictional_client_case';

export interface ContentPolicyViolation {
  code: ContentPolicyCode;
  severity: ContentPolicySeverity;
  /** Campo donde se encontró (archivo, sección.campo, columna, tabla). */
  field: string;
  /** Fragmento coincidente (acotado). */
  match: string;
  /** Contexto breve (página, ruta, origen). */
  context: string;
  /** Reemplazo sugerido cuando el reemplazo es inequívoco. */
  suggestedReplacement?: string;
}

export interface ContentPolicyScanOptions {
  field?: string;
  context?: string;
  /** Sección del contenido (p. ej. `testimonials` desde Admin). */
  section?: string;
  /** Modo de consumo: admin | seed | script | api | form | build | database. */
  mode?: 'admin' | 'seed' | 'script' | 'api' | 'form' | 'build' | 'database';
}

export interface ContentPolicyRule {
  code: ContentPolicyCode;
  severity: ContentPolicySeverity;
  /** Nombre legible de la regla. */
  label: string;
  /** Devuelve los fragmentos coincidentes (sin importar mayúsculas/tildes). */
  test: (text: string) => string[];
  suggestedReplacement?: string;
}

/** Testimonios: sección reservada hasta que existan reseñas reales autorizadas. */
const TESTIMONIALS_SECTION = 'testimonials';

/** Dedupe preservando orden. */
function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** Acota un fragmento coincidente a un contexto legible y sin datos sensibles. */
function clip(match: string, max = 90): string {
  const normalized = match.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

/**
 * Reglas de política de contenido. Cada regla es una función pura sobre el
 * texto, de modo que el mismo conjunto se usa en Admin, scripts, seeds,
 * API, formularios, build y auditorías de DB sin duplicar expresiones.
 */
export const CONTENT_POLICY_RULES: readonly ContentPolicyRule[] = [
  {
    code: 'prohibited_commercial_claim',
    severity: 'error',
    label: 'Claim comercial no autorizado (consulta gratuita/sin costo/sin compromiso)',
    test: (text) => scanProhibitedClaims(text).map((m: ClaimMatch) => clip(m.matched)),
    suggestedReplacement: EVALUACION_INICIAL_CONFIDENCIAL,
  },
  {
    code: 'unauthorized_testimonial',
    severity: 'error',
    label: 'Testimonio no autorizado (solo reseñas reales autorizadas por el propietario)',
    test: (text) => {
      if (!text.trim()) return [];
      const markers = [
        /testimoni[oa]s?\s+de\s+(clientes?|nuestros\s+clientes?)/gi,
        /rese[ñn]as?\s+de\s+clientes?/gi,
        /\bcliente\s+dice\b[^.\n]{0,60}/gi,
        /\blogramos\s+una\s+resoluci[oó]n\s+favorable\b/gi,
        /\bresultado\s+favorable\s+para\s+(nuestro|el)\s+cliente\b/gi,
        /\b(?:él|ella|mi\s+cliente)\s+qued[oó]\s+satisfech[oa]\b[^.\n]{0,60}/gi,
        /\bcasos?\s+de\s+[ée]xito\s+(?:de\s+)?(?:nuestros\s+)?clientes?\b/gi,
      ];
      return unique(markers.flatMap((re) => Array.from(text.matchAll(re), (m) => clip(m[0]))));
    },
  },
  {
    code: 'unauthorized_success_guarantee',
    severity: 'error',
    label: 'Garantía de éxito / resultados asegurados sin evidencia',
    test: (text) => {
      const markers = [
        /[ée]xito\s+garantizado/gi,
        /resultados?\s+asegurados?/gi,
        /garantizamos?\s+(el\s+)?[ée]xito/gi,
        /resultado\s+garantizado/gi,
        /sin\s+[ée]xito\s+no\s+pagas?/gi,
      ];
      return unique(markers.flatMap((re) => Array.from(text.matchAll(re), (m) => clip(m[0]))));
    },
  },
  {
    code: 'unauthorized_success_rate',
    severity: 'error',
    label: 'Porcentaje de éxito sin evidencia',
    test: (text) => {
      const markers = [
        /\b\d{1,3}\s*%\s*(?:de\s+)?(?:[ée]xito|casos?\s+ganados?|resultados?|victorias?)\b/gi,
        /\btasa\s+de\s+[ée]xito\b/gi,
      ];
      return unique(markers.flatMap((re) => Array.from(text.matchAll(re), (m) => clip(m[0]))));
    },
  },
  {
    code: 'unauthorized_superlative',
    severity: 'warning',
    label: 'Superlativo no verificado (mejores/líderes/nº 1)',
    test: (text) => {
      const markers = [
        /\blos\s+mejores\s+abogados\b/gi,
        /\bespecialistas?\s+l[íi]deres\b/gi,
        /\bl[íi]deres?\s+en\s+(el\s+)?(?:derecho|asuntos?|defensa)\b/gi,
        /\bn[úu]mero\s*1\s+en\b/gi,
        /\bprimera\s+consultor[ií]a\s+legal\b/gi,
      ];
      return unique(markers.flatMap((re) => Array.from(text.matchAll(re), (m) => clip(m[0]))));
    },
  },
  {
    code: 'fictional_client_case',
    severity: 'warning',
    label: 'Cliente o caso ficticio/de ejemplo',
    test: (text) => {
      const markers = [
        /\bcliente\s+(?:ficticio|de\s+ejemplo)\b/gi,
        /\bcaso\s+(?:ficticio|de\s+ejemplo|hipot[ée]tico)\b/gi,
        /\bnombres?\s+ficticios?\b/gi,
        /\b(?:ejemplo|ilustraci[oó]n)\s*(?:con\s*)?(?:nombre|cliente|caso)\b/gi,
      ];
      return unique(markers.flatMap((re) => Array.from(text.matchAll(re), (m) => clip(m[0]))));
    },
  },
];

/**
 * Escanea un texto y devuelve todas las violaciones de política estructuradas.
 * Es la función central que usan Admin, seeds, scripts, API, formularios,
 * build y auditorías de base de datos.
 */
export function scanContentPolicyViolations(
  content: string,
  opts: ContentPolicyScanOptions = {},
): ContentPolicyViolation[] {
  const field = opts.field ?? 'contenido';
  const context = opts.context ?? 'contenido público';
  const violations: ContentPolicyViolation[] = [];

  for (const rule of CONTENT_POLICY_RULES) {
    for (const match of rule.test(content)) {
      violations.push({
        code: rule.code,
        severity: rule.severity,
        field,
        match,
        context,
        suggestedReplacement: rule.suggestedReplacement,
      });
    }
  }

  // Bloqueo total de la sección testimonials con contenido (no pueden
  // publicarse testimonios hasta que existan reseñas reales autorizadas).
  if (opts.section === TESTIMONIALS_SECTION && content.trim()) {
    violations.push({
      code: 'unauthorized_testimonial',
      severity: 'error',
      field,
      match: clip(content),
      context: `${context} (sección testimonials)`,
      suggestedReplacement: undefined,
    });
  }

  return violations;
}

export interface ContentPolicyResult {
  ok: boolean;
  violations: ContentPolicyViolation[];
}

/**
 * Valida contenido y devuelve `{ ok, violations }` sin lanzar.
 * `ok === false` cuando existe al menos una violación de severidad `error`.
 */
export function validateContentPolicy(
  content: string,
  opts: ContentPolicyScanOptions = {},
): ContentPolicyResult {
  const violations = scanContentPolicyViolations(content, opts);
  return {
    ok: violations.every((v) => v.severity !== 'error'),
    violations,
  };
}

/** Lanza la primera violación de severidad error como Error descriptivo. */
export function assertContentPolicySafe(
  content: string,
  opts: ContentPolicyScanOptions = {},
): void {
  const { ok, violations } = validateContentPolicy(content, opts);
  if (!ok) {
    const first = violations.find((v) => v.severity === 'error') ?? violations[0];
    throw new Error(
      `[content-policy] Violación ${first.code} (${first.severity}) en ${first.context}`
      + `${first.field ? ` [${first.field}]` : ''}: "${first.match}".`
      + (first.suggestedReplacement
        ? ` Usar la formulación canónica: "${first.suggestedReplacement}".`
        : ''),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibilidad Admin (page_content)
// ─────────────────────────────────────────────────────────────────────────────

const INTERNAL_SECTIONS = new Set(['_meta', '_layout', '_visibility']);
const CONFIG_PAGE = 'configuracion';

/** Las secciones internas y la página de configuración no son contenido público. */
export function isPublicEditableField(page: string, section: string): boolean {
  return page !== CONFIG_PAGE && !INTERNAL_SECTIONS.has(section);
}

/**
 * Valida el contenido de un campo editable antes de persistirlo (Admin).
 * Lanza con el motivo si infringe la política (contrato histórico intacto).
 */
export function validateEditablePageContent(
  page: string,
  section: string,
  field: string,
  content: string,
): void {
  if (!isPublicEditableField(page, section)) return;
  assertContentPolicySafe(content, {
    field: `${page} / ${section}.${field}`,
    context: `página ${page}`,
    section,
    mode: 'admin',
  });
}
