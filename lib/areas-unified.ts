/**
 * Fuente de verdad unificada para áreas jurídicas.
 *
 * Resuelve el conflicto de doble fuente de verdad (R2 del AGENTS.md) entre:
 *   - `data/areas-juridicas.ts` (seed canónico, fuente estática master)
 *   - tabla DB `areas_juridicas` (enriquecimiento editable vía intranet)
 *
 * Contrato:
 *   1. Los slugs canónicos los define el TS (URLs estables).
 *   2. La DB puede enriquecer/editar contenido pero NUNCA introducir slugs
 *      nuevos que no existan en el TS (se filtran como salvaguarda).
 *   3. Si la DB no es alcanzable, se degrada al TS canónico (resiliencia).
 *
 * Los índices (`/servicios-juridicos`, `/derecho-penal`, `/hondurenos-en-espana`)
 * deben usar estas funciones en lugar de `getAreasFromDb` directamente, para
 * garantizar que siempre muestran contenido aunque la DB no responda.
 *
 * Los detalles (`/[slug]/page.tsx`) siguen leyendo del TS canónico, que es la
 * fuente estática master con la profundidad jurídica completa.
 */
import { cache } from 'react';
import {
  areasGenerales,
  hubPenal,
  hubMigrantes,
  type AreaBase,
} from '@/data/areas-juridicas';
import { getAreasFromDb, type AreaFromDb } from './areas-db';

export type AreaCategoria = 'servicio' | 'penal' | 'migrante';

/** Item unificado: datos del TS canónico + overrides opcionales de la DB. */
export interface AreaUnified {
  slug: string;
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  icono: string;
  categoria: AreaCategoria;
  /** Origen del contenido actualmente visible: 'db' | 'ts'. */
  fuente: 'db' | 'ts';
}

const TS_BY_CATEGORIA: Record<AreaCategoria, AreaBase[]> = {
  servicio: areasGenerales,
  penal: hubPenal.grupos,
  migrante: hubMigrantes.subareas,
};

/**
 * Convierte un área del TS canónico al formato unificado.
 * El TS no separa "corta/larga" igual que la DB: usamos resumen/descripcion.
 */
function tsToUnified(area: AreaBase, categoria: AreaCategoria): AreaUnified {
  return {
    slug: area.slug,
    titulo: area.titulo,
    descripcionCorta: area.resumen,
    descripcionLarga: area.descripcion,
    icono: area.icono,
    categoria,
    fuente: 'ts',
  };
}

/** Conjunto de slugs válidos por categoría, según TS canónico. */
const SLUGS_VALIDOS: Record<AreaCategoria, Set<string>> = {
  servicio: new Set(areasGenerales.map((a) => a.slug)),
  penal: new Set(hubPenal.grupos.map((g) => g.slug)),
  migrante: new Set(hubMigrantes.subareas.map((s) => s.slug)),
};

/** Filtra filas DB: solo slugs presentes en el TS canónico. Salvaguarda R2. */
function filtrarPorSlugsCanonicos(
  rows: AreaFromDb[],
  categoria: AreaCategoria,
): { validas: AreaFromDb[]; huerocho: AreaFromDb[] } {
  const validos = SLUGS_VALIDOS[categoria];
  const validas: AreaFromDb[] = [];
  const huerocho: AreaFromDb[] = [];
  for (const r of rows) {
    if (validos.has(r.slug)) validas.push(r);
    else huerocho.push(r);
  }
  return { validas, huerocho };
}

/**
 * Lista unificada por categoría.
 * - Prioriza DB si está disponible y devuelve filas para slugs canónicos.
 * - Hace fallback al TS canónico si la DB no responde o está vacía.
 * - Las filas DB con slugs no presentes en el TS se ignoran y se registran
 *   en `huerochoSlugs` para auditoría (vía `getAreasDebug`).
 */
export const getAreasUnified = cache(
  async (categoria: AreaCategoria): Promise<AreaUnified[]> => {
    const tsAreas = TS_BY_CATEGORIA[categoria];
    let dbRows: AreaFromDb[] = [];
    try {
      dbRows = await getAreasFromDb(categoria);
    } catch {
      dbRows = [];
    }
    if (!dbRows.length) {
      // Fallback al TS canónico (resiliencia si la DB no responde).
      return tsAreas.map((a) => tsToUnified(a, categoria));
    }
    const { validas } = filtrarPorSlugsCanonicos(dbRows, categoria);
    if (!validas.length) {
      // DB respondió pero ningún slug coincide con el TS: fallback seguro.
      return tsAreas.map((a) => tsToUnified(a, categoria));
    }
    // Mezcla: para cada slug canónico, usa la fila DB si existe, si no, el TS.
    const dbBySlug = new Map(validas.map((r) => [r.slug, r]));
    return tsAreas.map((area) => {
      const dbRow = dbBySlug.get(area.slug);
      if (!dbRow) return tsToUnified(area, categoria);
      return {
        slug: dbRow.slug,
        titulo: dbRow.titulo || area.titulo,
        descripcionCorta: dbRow.descripcionCorta || area.resumen,
        descripcionLarga: dbRow.descripcionLarga || area.descripcion,
        icono: dbRow.icono || area.icono,
        categoria,
        fuente: 'db',
      };
    });
  },
);

/**
 * Diagnóstico para auditoría R2. No usar en render: solo para
 * `auditoria-acciones.md` y para detección de divergencias.
 */
export const getAreasDebug = cache(
  async (categoria: AreaCategoria) => {
    const tsCount = TS_BY_CATEGORIA[categoria].length;
    let dbRows: AreaFromDb[] = [];
    let dbReachable = false;
    try {
      dbRows = await getAreasFromDb(categoria);
      dbReachable = true;
    } catch {
      dbRows = [];
    }
    const { validas, huerocho } = filtrarPorSlugsCanonicos(dbRows, categoria);
    return {
      categoria,
      tsCount,
      dbReachable,
      dbCount: dbRows.length,
      dbValidas: validas.length,
      slugsHuerochoEnDb: huerocho.map((r) => r.slug),
      slugsSoloEnTs: TS_BY_CATEGORIA[categoria]
        .map((a) => a.slug)
        .filter((slug) => !validas.some((r) => r.slug === slug)),
    };
  },
);

/** Reexporta helpers canónicos del TS para centralizar imports en páginas. */
export { getAreaBySlug, getPenalGrupoBySlug, getMigranteSubareaBySlug } from '@/data/areas-juridicas';
export type { AreaStandalone, AreaBase } from '@/data/areas-juridicas';
