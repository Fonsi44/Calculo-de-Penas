/**
 * Infraestructura de revisión jurídica/editorial (FASE 1 — Exactitud jurídica).
 *
 * Modelo declarativo y auditable para registrar el estado de revisión legal de
 * cada página o bloque de contenido YMYL del sitio. Diseñado para coexistir con
 * la arquitectura existente (`lib/site.ts`, `lib/legal-disclaimer.ts`,
 * `lib/legal-content.ts`) sin competir con ellas: la fuente única de identidad
 * sigue siendo `lib/site.ts`; este módulo solo aporta metadatos de revisión.
 *
 * Principios (AGENTS.md §7, R4, R11):
 *  - `verified` requiere revisor humano real y fecha válida. No se acepta
 *    GLM-5.2 (ni ningún modelo de IA) como revisor jurídico.
 *  - Una página `pending` NO muestra atribución "Revisado por".
 *  - No se inventan fechas de revisión.
 *  - Las marcas internas (`[REVISIÓN PENDIENTE]`) son internas: nunca se
 *    exponen en producción. El componente público <LegalReviewNotice> emite un
 *    aviso jurídico general prudente, no marcas internas.
 *  - El sistema no obliga a tocar el blog; el registro es por página de
 *    servicios/landing/FAQ, opcional.
 */

export type LegalReviewStatus = 'pending' | 'verified' | 'needs_update';

/**
 * Conjunto de estados equivalente al modelo de 6 valores del plan maestro
 * SEO/GEO (§6):
 *   draft | documentary_review | lawyer_review_pending | lawyer_verified
 *   | outdated | withdrawn
 *
 * El repositorio opera históricamente con tres estados (`pending | verified |
 * needs_update`) coordinados con la DB (`lib/db/schema/core.ts`) y los tests
 * (tests/legal-review.test.ts). En lugar de migrar la DB (restringido por
 * AGENTS.md §7), este mapa declara la equivalencia semántica exigida por el
 * plan maestro y la expone para tests, documentación y consumidores futuros
 * sin romper el contrato vigente.
 *
 * Cualquier estado del plan NO contemplado en la tabla existente se trata
 * como `pending` (no indexable por defecto), cumpliendo el gate de Fase 0
 * del propio plan: "ningún artículo indexable declara revisión pendiente".
 */
const PLAN_REVIEW_STATUS_MAP: Record<
  'draft' | 'documentary_review' | 'lawyer_review_pending' | 'lawyer_verified' | 'outdated' | 'withdrawn',
  LegalReviewStatus
> = {
  draft: 'pending',
  documentary_review: 'pending',
  lawyer_review_pending: 'pending',
  lawyer_verified: 'verified',
  outdated: 'needs_update',
  withdrawn: 'needs_update',
} as const;

type PlanLegalReviewStatus = keyof typeof PLAN_REVIEW_STATUS_MAP;

export type LegalJurisdiction = 'HN' | 'ES' | 'HN_ES' | 'general';

export interface LegalReviewSource {
  title: string;
  institution: string;
  url: string;
  consultedAt?: string;
}

export interface LegalReview {
  /** Revisor humano real (nombre). Para `verified` es obligatorio. NO usar
   *  nombres de modelos de IA. Si se omite, el estado DEBE ser `pending`. */
  reviewedBy?: string;
  /** Fecha ISO (YYYY-MM-DD) de la revisión. Para `verified` es obligatoria y
   *  debe ser válida y no futura. */
  reviewedAt?: string;
  jurisdiction: LegalJurisdiction;
  reviewStatus: LegalReviewStatus;
  sources?: LegalReviewSource[];
  /** Nota editorial interna (no se muestra en producción). */
  note?: string;
}

/**
 * Nombres del equipo profesional canónicos (fuente única: `lib/site.ts`).
 * Cualquier atribución "revisado por" debe coincidir con uno de estos nombres,
 * o quedar vacío (`pending`). Esto impide firmar con nombres inventados o con
 * variantes incorrectas (p. ej. "Thania Pineda").
 */
import { FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE } from './site';

export const CANONICAL_REVIEWERS: readonly string[] = [
  FOUNDER_PROFILE.name,
  THANIA_PROFILE.name,
  EMIL_PROFILE.name,
] as const;

/**
 * Valida que un objeto LegalReview sea internamente coherente.
 * Lanza Error descriptivo si encuentra una violación. Usado por los tests y
 * por el helper isLegalReviewPubliclySound (no lanza, devuelve boolean).
 */
export function assertLegalReviewValid(review: LegalReview): void {
  if (review.reviewStatus === 'verified') {
    if (!review.reviewedBy || review.reviewedBy.trim() === '') {
      throw new Error(
        'LegalReview inválido: estado "verified" requiere revisor humano (reviewedBy).',
      );
    }
    if (review.reviewedBy.includes('GLM') || /modelo|IA\b/i.test(review.reviewedBy)) {
      throw new Error(
        `LegalReview inválido: "${review.reviewedBy}" no es un revisor jurídico humano válido (no se aceptan modelos de IA).`,
      );
    }
    if (!review.reviewedAt || !isValidIsoDate(review.reviewedAt)) {
      throw new Error(
        'LegalReview inválido: estado "verified" requiere fecha válida (reviewedAt ISO YYYY-MM-DD).',
      );
    }
    if (isFutureDate(review.reviewedAt)) {
      throw new Error(
        `LegalReview inválido: reviewedAt "${review.reviewedAt}" es posterior a hoy (no se inventan fechas futuras).`,
      );
    }
    if (!CANONICAL_REVIEWERS.includes(review.reviewedBy)) {
      throw new Error(
        `LegalReview inválido: revisor "${review.reviewedBy}" no figura en la fuente única de identidad (lib/site.ts). Revisores válidos: ${CANONICAL_REVIEWERS.join(', ')}.`,
      );
    }
  }
  // pending y needs_update no exigen revisor/fecha, pero si los aportan deben
  // cumplir las mismas reglas de coherencia (mismo nombre canónico, fecha válida).
  if (review.reviewedBy && !CANONICAL_REVIEWERS.includes(review.reviewedBy)) {
    throw new Error(
      `LegalReview inválido: revisor "${review.reviewedBy}" no canónico. Revisores válidos: ${CANONICAL_REVIEWERS.join(', ')}.`,
    );
  }
  if (review.reviewedAt && !isValidIsoDate(review.reviewedAt)) {
    throw new Error(`LegalReview inválido: reviewedAt "${review.reviewedAt}" no es fecha ISO válida.`);
  }
}

/** ¿Es seguro mostrar públicamente la atribución "Revisado por" de esta review? */
export function isReviewAttributable(review: LegalReview): boolean {
  try {
    assertLegalReviewValid(review);
    return review.reviewStatus === 'verified' && !!review.reviewedBy && !!review.reviewedAt;
  } catch {
    return false;
  }
}

function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime());
}

function isFutureDate(s: string): boolean {
  const d = new Date(s + 'T00:00:00Z');
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  return d.getTime() > today.getTime();
}

/**
 * Registro de revisión por página pública (clave = path o slug de servicio).
 *
 * Estado inicial FASE 1: todo `pending` salvo correcciones ya aplicadas y
 * trazadas en docs/seo/fase-1/revision-juridica-fase1.md. Ninguna página YMYL
 * queda como `verified` sin revisión humana expresa del despacho, porque eso
 * requeriría que un abogado firme — y ese paso queda pendiente de validación
 * humana (ver informe final FASE 1, punto 3).
 *
 * Añadir entradas aquí a medida que el despacho revise páginas concretas.
 * El registro es la única fuente de verdad para la atribución pública de
 * revisión; el componente <LegalReviewNotice> lo consulta vía getLegalReview().
 */
export const LEGAL_REVIEW_REGISTRY: Record<string, LegalReview> = {
  // Ejemplo de plantilla (NO verified: pendiente de firma del despacho):
  '/preguntas-frecuentes': {
    jurisdiction: 'HN',
    reviewStatus: 'needs_update',
    note: 'FASE 1: corregidas horas extras (arts. 270/273/352 CT) y prescripción penal (art. 39 CP). Pendiente de firma del despacho para pasar a verified.',
  },
  '/servicios-juridicos/derecho-laboral': {
    jurisdiction: 'HN',
    reviewStatus: 'needs_update',
    note: 'FASE 1: pendiente validar cesantía máxima 25 meses, preaviso y fechas de aguinaldo (Decreto 135-80). FASE 3: enriquecida con bloques de detalle, documentos y proceso; FAQ ampliada (P03/P04 preservadas sin reforzar).',
  },
  '/servicios-juridicos/derecho-de-familia': {
    jurisdiction: 'HN',
    reviewStatus: 'needs_update',
    note: 'FASE 3: enriquecida con respuesta directa, documentos, proceso y FAQ ampliada. P01 (rango pensión) preservada sin reforzar. Pendiente firma del abogado de familia.',
  },
  '/servicios-juridicos/derecho-civil-y-notarial': {
    jurisdiction: 'HN',
    reviewStatus: 'needs_update',
    note: 'FASE 3: enriquecida con separación civil/notarial/registral, documentos y proceso. P06 (prescripción civil) preservada sin reforzar. Capacidad notarial no afirmada. Pendiente firma.',
  },
  '/derecho-penal': {
    jurisdiction: 'HN',
    reviewStatus: 'needs_update',
    note: 'FASE 3: enriquecida con respuesta directa, documentos, proceso, factores y errores. Sin plazos cerrados ni tabla de penas/prescripción. P09/P14/P15 viven en /derecho-penal/[slug] (fuera de alcance). Pendiente firma del abogado penalista.',
  },
  '/abogado-laboralista-nacaome': {
    jurisdiction: 'HN',
    reviewStatus: 'needs_update',
    note: 'FASE 1: corregido "décimo cuarto mes" → "décimo tercer mes (aguinaldo)". Pendiente firma.',
  },
  '/abogado-penalista-choluteca': {
    jurisdiction: 'HN',
    reviewStatus: 'needs_update',
    note: 'FASE 1: distancia Nacaome-Choluteca unificada a ~55 km (Rome2Rio/Travelmath). Pendiente firma.',
  },
  '/como-llegar': {
    jurisdiction: 'general',
    reviewStatus: 'needs_update',
    note: 'FASE 1: distancias Choluteca/San Lorenzo/Amapala verificadas contra cartografía. Pendiente firma.',
  },
};

/** Obtiene la revisión de una página, o un valor pending por defecto. */
export function getLegalReview(path: string): LegalReview {
  return (
    LEGAL_REVIEW_REGISTRY[path] ?? {
      jurisdiction: 'general',
      reviewStatus: 'pending',
    }
  );
}

/**
 * Áreas de práctica cuya autoría NO se asigna automáticamente porque el
 * plan maestro (§3.1) y AGENTS.md (R4) exigen confirmación humana previa del
 * responsable interno. Para estas áreas, `getEditorialResponsibility` devuelve
 * `requiresHumanAssignment: true` y el artículo debe permanecer en
 * `lawyer_review_pending` (noindex) hasta que el despacho firme la
 * asignación. No se inventa ningún abogado.
 */
const REQUIRES_HUMAN_ASSIGNMENT_AREAS: ReadonlySet<string> = new Set([
  'derecho-tributario',
  'derecho-bancario',
  'derecho-aduanero',
  'regulacion-sanitaria',
  'derecho-ambiental',
  'propiedad-intelectual',
  'extranjeria',
]);

interface EditorialResponsibility {
  /** Abogado autor principal (nombre canónico de `lib/site.ts`). */
  author: string;
  /** Revisor secundario recomendado cuando el tema es sensible/transversal. */
  defaultReviewer: string | null;
  /** true cuando el área exige asignación humana explícita (sin invención). */
  requiresHumanAssignment: boolean;
}

/**
 * Matriz central de autoría y revisión (plan maestro §10 / §3.1).
 *
 * `practiceArea` admite tanto el slug de área (p. ej. `derecho-penal`) como
 * etiquetas legibles (`Penal`, `Laboral`). La función NO marca artículos como
 * verificados: solo devuelve el par autor/revisor recomendado. La decisión de
 * marcar `verified` exige revisión humana real (R4, R12) y se rige por
 * `assertLegalReviewValid`.
 *
 * Temas mixtos:
 *  - violencia intrafamiliar con componente penal → Thania autora, Danilo
 *    revisor (se evalúa por `topic`).
 *  - conflicto mercantil con componente laboral → Thania autora, Emil revisor.
 *  - asunto civil con componente penal → autor del área principal y revisión
 *    transversal (Danilo).
 *
 * Áreas con `requiresHumanAssignment: true` (tributario, bancario, aduanero,
 * sanitario, ambiental, propiedad intelectual, extranjería) devuelven
 * `author: ''` y `defaultReviewer: null`. El consumidor debe mantener el
 * artículo en `lawyer_review_pending` y registrarlo en
 * `REQUIRES_HUMAN_ASSIGNMENT_AREAS` hasta que el despacho asigne.
 */
export function getEditorialResponsibility(
  practiceArea: string,
  topic?: string,
): EditorialResponsibility {
  const area = practiceArea.trim().toLowerCase();
  const t = (topic ?? '').toLowerCase();

  // Temas mixtos: se evalúan primero porque cruzan áreas.
  if (t.includes('violencia intrafamiliar') || t.includes('violencia domestica')) {
    return { author: THANIA_PROFILE.name, defaultReviewer: FOUNDER_PROFILE.name, requiresHumanAssignment: false };
  }
  if (t.includes('mercantil') && t.includes('laboral')) {
    return { author: THANIA_PROFILE.name, defaultReviewer: EMIL_PROFILE.name, requiresHumanAssignment: false };
  }
  if (t.includes('civil') && t.includes('penal')) {
    return { author: THANIA_PROFILE.name, defaultReviewer: FOUNDER_PROFILE.name, requiresHumanAssignment: false };
  }

  if (REQUIRES_HUMAN_ASSIGNMENT_AREAS.has(area)) {
    return { author: '', defaultReviewer: null, requiresHumanAssignment: true };
  }

  switch (area) {
    case 'derecho-penal':
    case 'penal':
    case 'detenciones':
    case 'audiencias':
    case 'recursos':
    case 'ejecucion-penal':
      return { author: FOUNDER_PROFILE.name, defaultReviewer: EMIL_PROFILE.name, requiresHumanAssignment: false };
    case 'derecho-laboral':
    case 'laboral':
    case 'despidos':
    case 'prestaciones':
      return { author: EMIL_PROFILE.name, defaultReviewer: THANIA_PROFILE.name, requiresHumanAssignment: false };
    case 'derecho-de-familia':
    case 'familia':
    case 'divorcio':
    case 'custodia':
    case 'alimentos':
    case 'union-de-hecho':
      return { author: THANIA_PROFILE.name, defaultReviewer: EMIL_PROFILE.name, requiresHumanAssignment: false };
    case 'derecho-civil':
    case 'civil':
    case 'civil-y-notarial':
    case 'notarial':
    case 'arrendamientos':
    case 'herencias':
    case 'contratos':
    case 'propiedad':
      return { author: THANIA_PROFILE.name, defaultReviewer: EMIL_PROFILE.name, requiresHumanAssignment: false };
    case 'derecho-mercantil':
    case 'mercantil':
    case 'empresarial':
      return { author: THANIA_PROFILE.name, defaultReviewer: EMIL_PROFILE.name, requiresHumanAssignment: false };
    case 'derecho-administrativo':
    case 'administrativo':
    case 'servicio-civil':
      return { author: THANIA_PROFILE.name, defaultReviewer: EMIL_PROFILE.name, requiresHumanAssignment: false };
    case 'conciliacion':
    case 'arbitraje':
    case 'conciliacion-y-arbitraje':
      return { author: THANIA_PROFILE.name, defaultReviewer: EMIL_PROFILE.name, requiresHumanAssignment: false };
    default:
      return { author: '', defaultReviewer: null, requiresHumanAssignment: true };
  }
}

/**
 * Normaliza el estado de revisión que puede venir tanto del modelo histórico
 * (`pending | verified | needs_update`) como del modelo de 6 valores del plan
 * maestro (`lawyer_verified`, `lawyer_review_pending`, etc.). Devuelve el
 * estado canónico interno. Cualquier valor no reconocido se trata como
 * `pending` (gate de Fase 0: lo no verificado no se indexa).
 */
export function normalizeReviewStatus(raw: string | undefined | null): LegalReviewStatus {
  if (!raw) return 'pending';
  const key = raw.trim().toLowerCase() as PlanLegalReviewStatus;
  if (key in PLAN_REVIEW_STATUS_MAP) return PLAN_REVIEW_STATUS_MAP[key];
  if (raw === 'verified' || raw === 'pending' || raw === 'needs_update') return raw;
  // Valores sueltos de la DB (`published`, `reviewed`, …) se tratan como
  // pending hasta que exista evidencia de revisión jurídica humana.
  return 'pending';
}
