/**
 * Clasificación de procedencia de fuentes normativas (Fase 3C).
 *
 * Resuelve el problema detectado en la auditoría Fase 3B: el sistema contaba
 * como "oficial" cualquier URL abierta, sin diferenciar entre una fuente
 * oficial primaria hondureña (p. ej. poderjudicial.gob.hn), una reproducción
 * académica (Georgetown, OEA como espejo) o un JSON interno del repositorio.
 *
 * Las 7 categorías están alineadas con el enunciado Fase 3C §2:
 *
 *   - official_primary:          organismo público emisor de la norma
 *                                (Poder Judicial, TSC, Congreso, La Gaceta).
 *   - official_secondary:        reproducción íntegra publicada por otro
 *                                organismo público (no emisor original).
 *   - institutional_academic:    Georgetown, OEA, UNICEF, CEPAL, RAE, universidades.
 *                                NO son oficiales hondureñas; reproducen la norma.
 *   - canonical_internal_verified: archivo interno del repo (data/*.json) con
 *                                  trazabilidad documentada hacia la norma
 *                                  oficial (URL, decreto, fecha, método de
 *                                  comparación). Requiere auditoría explícita.
 *   - canonical_internal_unverified: archivo interno sin trazabilidad
 *                                     verificable hacia la norma oficial.
 *   - commercial_secondary:      sitios comerciales (todolegal.app, etc.) que
 *                                reproducen la norma pero no son fuente oficial.
 *   - unverified:                fuente sin clasificar o que no resuelve a un
 *                                dominio conocible.
 *
 * Reglas rectoras:
 *   - Georgetown NUNCA es oficial hondureña (es institutional_academic).
 *   - Un archivo interno NO es oficial por defecto; requiere trazabilidad
 *     explícita para ser canonical_internal_verified.
 *   - Solo official_primary y official_secondary cuentan como "oficiales"
 *     en los conteos de `ai_official_sources_count`.
 */

export type SourceProvenance =
  | 'official_primary'
  | 'official_secondary'
  | 'institutional_academic'
  | 'canonical_internal_verified'
  | 'canonical_internal_unverified'
  | 'commercial_secondary'
  | 'unverified';

/**
 * Conjunto canónico para validación (p. ej. en tests y schemas).
 */
export const SOURCE_PROVENANCE_VALUES: readonly SourceProvenance[] = [
  'official_primary',
  'official_secondary',
  'institutional_academic',
  'canonical_internal_verified',
  'canonical_internal_unverified',
  'commercial_secondary',
  'unverified',
] as const;

/**
 * Devuelve true si la procedencia cuenta como "oficial" para los conteos
 * de `ai_official_sources_count`. Solo las dos categorías oficiales cuentan.
 *
 * Esto cambia la semántica anterior (que contaba cualquier URL con dominio).
 * Institutional_academic, internal y commercial NO cuentan como oficiales.
 */
export function countsAsOfficial(provenance: SourceProvenance): boolean {
  return (
    provenance === 'official_primary' || provenance === 'official_secondary'
  );
}

/**
 * Devuelve la categoría agrupada para reporting:
 *   - oficial       = official_primary + official_secondary
 *   - institucional = institutional_academic
 *   - interna       = canonical_internal_verified + canonical_internal_unverified
 *   - comercial     = commercial_secondary
 *   - sin_verificar = unverified
 */
export type ProvenanceGroup =
  | 'oficial'
  | 'institucional'
  | 'interna'
  | 'comercial'
  | 'sin_verificar';

export function groupProvenance(provenance: SourceProvenance): ProvenanceGroup {
  switch (provenance) {
    case 'official_primary':
    case 'official_secondary':
      return 'oficial';
    case 'institutional_academic':
      return 'institucional';
    case 'canonical_internal_verified':
    case 'canonical_internal_unverified':
      return 'interna';
    case 'commercial_secondary':
      return 'comercial';
    case 'unverified':
      return 'sin_verificar';
  }
}

/**
 * Dominios de organismos oficiales hondureños emisores de normas.
 * Solo estos resuelven a official_primary/official_secondary.
 */
const OFFICIAL_HN_DOMAINS: readonly string[] = [
  'poderjudicial.gob.hn',
  'tsc.gob.hn',
  'congreso.gob.hn',
  'congresonacional.gob.hn',
  'gacetaoficial.hn',
  'laprensa.hn.gaceta', // alias antiguos (raro)
  'presidencia.gob.hn',
  'ministeriopublico.gob.hn',
  'registro-nacional-personas.gob.hn',
  'sernac.gob.hn',
  'edefensores.gob.hn',
] as const;

/**
 * Dominios de instituciones académicas/internacionales que reproducen
 * normativa hondureña pero NO son oficiales hondureñas.
 */
const INSTITUTIONAL_ACADEMIC_DOMAINS: readonly string[] = [
  'pdba.georgetown.edu', // Georgetown — NO oficial hondureña
  'oas.org', // OEA — reproducción, no emisor hondureño
  'unicef.org',
  'cepal.org',
  'oig.cepal.org',
  'acnur.org',
  'refworld.org',
  'dpej.rae.es', // RAE Diccionario Español Jurídico
  'siteal.iiep.unesco.org',
  'ecolex.org', // FAO Ecolex — ficha legislativa
  'ilo.org', // OIT
  'hrlibrary.umn.edu', // U. Minnesota
  'constituteproject.org',
] as const;

/**
 * Dominios comerciales que reproducen legislación pero no son oficiales.
 */
const COMMERCIAL_DOMAINS: readonly string[] = [
  'todolegal.app',
  'vlex.com',
  'leyes.fun',
  'leyesvivas.com',
  'buscalegales.com',
] as const;

/**
 * Marcadores de que una URL apunta a un archivo interno del repositorio.
 * Estos NO son URLs http; son rutas relativas a data/*.json.
 */
const INTERNAL_PATH_PREFIXES: readonly string[] = [
  'data/',
  './data/',
  '../data/',
];

/**
 * Extrae el host (sin puerto, sin www, minúsculas) de una URL.
 * Devuelve null si la URL no resuelve a un http(s) host.
 */
function extractHost(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Las rutas internas (data/...) no tienen host.
  if (INTERNAL_PATH_PREFIXES.some((p) => trimmed.startsWith(p))) {
    return null;
  }

  try {
    const u = new URL(trimmed);
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch {
    return null;
  }
}

/**
 * Comprueba si un host coincide con alguno de los dominios oficiales,
 * considerando subdominios (p. ej. legislacion.poderjudicial.gob.hn).
 */
function hostMatches(host: string, domains: readonly string[]): boolean {
  return domains.some((d) => host === d || host.endsWith('.' + d));
}

export interface ClassifyOptions {
  /** Marcar explícitamente la fuente como interna del repositorio. */
  isInternal?: boolean;
  /** Override explícito de procedencia (p. ej. trazabilidad verificada). */
  override?: SourceProvenance;
}

/**
 * Clasifica la procedencia de una fuente a partir de su URL/institución.
 *
 * Heurística:
 *   1. Si override está presente → se respeta (el llamador ha hecho la
 *      verificación de trazabilidad y declara la categoría).
 *   2. Si la URL apunta a data/*.json (interna):
 *      - canonical_internal_unverified por defecto
 *      - canonical_internal_verified si isInternal=true Y override lo declara
 *        (la trazabilidad la documenta el llamador en el informe, no aquí).
 *   3. Si el host es oficial hondureño:
 *      - official_primary si es el emisor canónico (poderjudicial, congreso,
 *        gacetaoficial, presidencia).
 *      - official_secondary si es TSC (reproduce pero no emite).
 *   4. Si el host es institucional/académico → institutional_academic.
 *   5. Si el host es comercial → commercial_secondary.
 *   6. En caso contrario → unverified.
 *
 * IMPORTANTE: el override es la única forma de marcar una fuente interna como
 * canonical_internal_verified. La trazabilidad no se puede deducir del host;
 * debe documentarse en el informe de auditoría correspondiente.
 */
export function classifySourceProvenance(
  url: string,
  _institution?: string,
  options?: ClassifyOptions,
): SourceProvenance {
  if (options?.override) {
    return options.override;
  }

  const trimmed = (url || '').trim();

  // Caso interno (data/*.json)
  if (
    options?.isInternal ||
    INTERNAL_PATH_PREFIXES.some((p) => trimmed.startsWith(p))
  ) {
    return 'canonical_internal_unverified';
  }

  const host = extractHost(trimmed);
  if (!host) {
    return 'unverified';
  }

  if (hostMatches(host, OFFICIAL_HN_DOMAINS)) {
    // TSC reproduce leyes pero no es emisor primario → secondary.
    // Congreso, Presidencia, Poder Judicial, La Gaceta → primary.
    if (host === 'tsc.gob.hn' || host.endsWith('.tsc.gob.hn')) {
      return 'official_secondary';
    }
    return 'official_primary';
  }

  if (hostMatches(host, INSTITUTIONAL_ACADEMIC_DOMAINS)) {
    return 'institutional_academic';
  }

  if (hostMatches(host, COMMERCIAL_DOMAINS)) {
    return 'commercial_secondary';
  }

  return 'unverified';
}

/**
 * Normaliza una URL para deduplicación.
 *
 * Reglas:
 *   - scheme a minúsculas (HTTP → http)
 *   - host a minúsculas, sin www.
 *   - elimina trailing slash en el path (salvo raíz)
 *   - elimina fragmentos (#...)
 *   - conserva query string (puede diferenciar documentos)
 *   - elimina slashes múltiples en el path
 *
 * Ejemplo:
 *   HTTPS://WWW.poderjudicial.gob.hn/Cedij/Codigos/Codigo.pdf
 *   → http://poderjudicial.gob.hn/Cedij/Codigos/Codigo.pdf
 *
 *   https://tsc.gob.hn/biblioteca/
 *   → http://tsc.gob.hn/biblioteca
 */
export function normalizeSourceForDedup(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';

  // Las rutas internas se normalizan como rutas relativas.
  if (INTERNAL_PATH_PREFIXES.some((p) => trimmed.startsWith(p))) {
    const cleaned = trimmed.replace(/^\.\/+/, '').replace(/^\.+\/+/, '');
    // Normaliza slashes múltiples.
    return cleaned.replace(/\/{2,}/g, '/');
  }

  try {
    const u = new URL(trimmed);
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);

    // Path: sin trailing slash (salvo raíz), sin slashes dobles.
    let path = u.pathname.replace(/\/{2,}/g, '/');
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Reconstruir sin fragmento, conservando query.
    let normalized = `${u.protocol.toLowerCase()}//${host}${path}`;
    if (u.search) {
      normalized += u.search;
    }
    return normalized;
  } catch {
    // URL inválida: devolver trimmed para no colisionar.
    return trimmed.toLowerCase();
  }
}

/**
 * Resultado del recuento de fuentes por procedencia.
 */
export interface SourceProvenanceCount {
  /** Total de URLs únicas (todas las categorías). */
  total: number;
  /** Solo official_primary + official_secondary (cuenta como oficiales). */
  official: number;
  /** Desglose por categoría. */
  byProvenance: Record<SourceProvenance, number>;
  /** URLs únicas normalizadas → procedencia. */
  unique: Map<string, SourceProvenance>;
}

function emptyByProvenance(): Record<SourceProvenance, number> {
  return {
    official_primary: 0,
    official_secondary: 0,
    institutional_academic: 0,
    canonical_internal_verified: 0,
    canonical_internal_unverified: 0,
    commercial_secondary: 0,
    unverified: 0,
  };
}

/**
 * Cuenta fuentes únicas por procedencia, deduplicando por URL normalizada.
 *
 * @param sources Lista de { url, provenance? }. Si una entrada no trae
 *                provenance, se clasifica con classifySourceProvenance.
 */
export function countSourcesByProvenance(
  sources: ReadonlyArray<{
    url: string;
    provenance?: SourceProvenance;
    institution?: string;
    isInternal?: boolean;
  }>,
): SourceProvenanceCount {
  const byProvenance = emptyByProvenance();
  const unique = new Map<string, SourceProvenance>();

  for (const s of sources) {
    const normalized = normalizeSourceForDedup(s.url);
    if (!normalized || unique.has(normalized)) continue;

    const provenance =
      s.provenance ??
      classifySourceProvenance(s.url, s.institution, {
        isInternal: s.isInternal,
      });

    unique.set(normalized, provenance);
    byProvenance[provenance] += 1;
  }

  const official =
    byProvenance.official_primary + byProvenance.official_secondary;

  return {
    total: unique.size,
    official,
    byProvenance,
    unique,
  };
}
