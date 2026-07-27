/**
 * SGIE — capa de acceso a datos para tipos de procedimiento.
 *
 * Sólo lectura. Los procedimientos son un catálogo compartido: cualquier
 * abogado puede consultar los procedimientos activos (no hay scope por
 * expediente aquí, porque el catálogo no es sensible por abogado). El admin
 * además puede ver todos los estados (panel admin dedicado).
 *
 * Ver docs/architecture/ §11 (procedimientos y checklists), §11.2
 * (estructura mínima de la `definicion`).
 *
 * Sprint 0: habilita el alta de expedientes con procedimiento real.
 */
import { db } from '@/lib/db';
import { tiposProcedimiento } from '@/lib/schema';
import { and, asc, eq, ilike, or } from 'drizzle-orm';
import type { ContextoAbogado } from './expedientes-db';

export interface TipoProcedimientoItem {
  id: string;
  slug: string;
  nombre: string;
  areaJuridica: string | null;
  descripcion: string | null;
  version: number;
  estado: string;
}

export interface TipoProcedimientoConDefinicion extends TipoProcedimientoItem {
  // `definicion` es jsonb; Drizzle lo tipa como unknown. La función
  // extraerRequisitosDeDefinicion lo valida en runtime de forma defensiva.
  definicion: unknown;
}

/**
 * Requisito derivado de la `definicion` de un procedimiento. Coincide con el
 * shape que espera `crearExpediente` en expedientes-db.ts.
 */
export interface RequisitoDeProcedimiento {
  nombre: string;
  tipo: 'obligatorio' | 'opcional' | 'condicional';
  orden: number;
}

/**
 * Lista procedimientos. Por defecto sólo los `estado='activo'` (los únicos
 * asignables a un expediente nuevo). El admin puede pedir `incluirTodos=true`
 * para ver también borradores/desactivados/pendientes de validación legal.
 *
 * Búsqueda libre `q` sobre nombre y área jurídica.
 */
export async function listarProcedimientos(
  ctx: ContextoAbogado,
  opts: { q?: string; limit?: number; incluirTodos?: boolean } = {},
): Promise<{ tiposProcedimiento: TipoProcedimientoItem[]; total: number }> {
  const limit = Math.min(opts.limit ?? 200, 500);

  const conditions = [];
  // Por defecto, sólo activos. El admin puede explícitamente pedir todos.
  if (!opts.incluirTodos || !ctx.esAdmin) {
    conditions.push(eq(tiposProcedimiento.estado, 'activo'));
  }
  if (opts.q) {
    const term = `%${opts.q}%`;
    conditions.push(or(ilike(tiposProcedimiento.nombre, term), ilike(tiposProcedimiento.areaJuridica, term))!);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: tiposProcedimiento.id,
      slug: tiposProcedimiento.slug,
      nombre: tiposProcedimiento.nombre,
      areaJuridica: tiposProcedimiento.areaJuridica,
      descripcion: tiposProcedimiento.descripcion,
      version: tiposProcedimiento.version,
      estado: tiposProcedimiento.estado,
    })
    .from(tiposProcedimiento)
    .where(where)
    .orderBy(asc(tiposProcedimiento.areaJuridica), asc(tiposProcedimiento.nombre))
    .limit(limit);

  return { tiposProcedimiento: rows, total: rows.length };
}

/**
 * Obtiene un procedimiento por id, incluyendo su `definicion` JSON.
 * Sólo devuelve activos salvo que el ctx sea admin.
 * Devuelve null si no existe o no está accesible.
 */
export async function obtenerProcedimiento(
  procedimientoId: string,
  ctx: ContextoAbogado,
): Promise<TipoProcedimientoConDefinicion | null> {
  const conditions = [eq(tiposProcedimiento.id, procedimientoId)];
  if (!ctx.esAdmin) {
    conditions.push(eq(tiposProcedimiento.estado, 'activo'));
  }
  const [row] = await db
    .select({
      id: tiposProcedimiento.id,
      slug: tiposProcedimiento.slug,
      nombre: tiposProcedimiento.nombre,
      areaJuridica: tiposProcedimiento.areaJuridica,
      descripcion: tiposProcedimiento.descripcion,
      version: tiposProcedimiento.version,
      estado: tiposProcedimiento.estado,
      definicion: tiposProcedimiento.definicion,
    })
    .from(tiposProcedimiento)
    .where(and(...conditions));
  return row ?? null;
}

/**
 * Extrae los requisitos de la `definicion` de un procedimiento, normalizándolos
 * al shape que espera `crearExpediente`.
 *
 * La estructura canónica de la `definicion` (seed-sgie-procedimientos.ts) es:
 *   {
 *     documentosRequeridos: string[],
 *     documentosOpcionales: string[],
 *     documentosCondicionales: string[],
 *     ...
 *   }
 *
 * Es pura y defensiva:
 * - Si `definicion` es null/undefined o no tiene arrays válidos → devuelve [].
 * - Descarta entradas vacías o no-string.
 * - Asigna `orden` secuencial por bloque (requeridos → opcionales → condicionales).
 *
 * NUNCA inventa requisitos: si el procedimiento no los define, el expediente
 * nace sin checklist (el abogado lo completa después). No es un bug, es el
 * comportamiento correcto cuando el catálogo está en seed.
 */
export function extraerRequisitosDeDefinicion(
  definicion: unknown,
): RequisitoDeProcedimiento[] {
  if (!definicion || typeof definicion !== 'object') return [];
  const def = definicion as Record<string, unknown>;

  const extraerBloque = (clave: string): string[] => {
    const arr = def[clave];
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  };

  const requeridos = extraerBloque('documentosRequeridos');
  const opcionales = extraerBloque('documentosOpcionales');
  const condicionales = extraerBloque('documentosCondicionales');

  // Orden: obligatorios primero, luego opcionales, luego condicionales.
  // `orden` global secuencial para que el checklist se muestre coherente.
  const out: RequisitoDeProcedimiento[] = [];
  let orden = 0;
  for (const nombre of requeridos) {
    out.push({ nombre: nombre.trim(), tipo: 'obligatorio', orden: orden++ });
  }
  for (const nombre of opcionales) {
    out.push({ nombre: nombre.trim(), tipo: 'opcional', orden: orden++ });
  }
  for (const nombre of condicionales) {
    out.push({ nombre: nombre.trim(), tipo: 'condicional', orden: orden++ });
  }
  return out;
}
