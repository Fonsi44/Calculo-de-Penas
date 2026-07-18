import { db } from '@/lib/db';
import {
  aiTaskRouting,
  extraccionesIa,
  correccionesIa,
} from '@/lib/schema';
import { and, eq, desc, count, gte, lte, isNotNull, sql } from 'drizzle-orm';

export interface AiEvaluationItem {
  id: string;
  taskType: string;
  modelo: string | null;
  confianza: number | null;
  costeTokens: { input: number; output: number } | null;
  latenciaMs: number | null;
  corregido: boolean;
  estado: string;
  error: string | null;
  expedienteId: string | null;
  documentoId: string | null;
  creadoEn: Date;
}

export async function listarEvaluacionesIA(filters: {
  taskType?: string;
  modelo?: string;
  estado?: string;
  confianzaMin?: number;
  confianzaMax?: number;
  limit?: number;
  offset?: number;
}): Promise<{ items: AiEvaluationItem[]; total: number }> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = Math.max(filters.offset ?? 0, 0);

  const conditions = [];

  if (filters.taskType) {
    conditions.push(eq(aiTaskRouting.taskType, filters.taskType));
  }
  if (filters.modelo) {
    conditions.push(eq(aiTaskRouting.modelo, filters.modelo));
  }
  if (filters.estado) {
    conditions.push(eq(aiTaskRouting.estado, filters.estado));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(aiTaskRouting)
    .where(where);

  const rows = await db
    .select()
    .from(aiTaskRouting)
    .where(where)
    .orderBy(desc(aiTaskRouting.asignadoEn))
    .limit(limit)
    .offset(offset);

  const correctionsMap = new Map<string, boolean>();
  if (rows.length > 0) {
    const docsConCorrecciones = await db
      .select({ documentoId: correccionesIa.documentoId })
      .from(correccionesIa)
      .where(
        and(
          isNotNull(correccionesIa.documentoId),
          sql`${correccionesIa.documentoId} IN (${sql.join(
            rows.map((r) => sql`${r.documentoId}`).filter(Boolean),
            sql`, `,
          )})`,
        ),
      );

    for (const c of docsConCorrecciones) {
      if (c.documentoId) correctionsMap.set(c.documentoId, true);
    }
  }

  const items: AiEvaluationItem[] = rows.map((r) => {
    const confianza =
      (r.resultado as { confianzaTipo?: number } | null)?.confianzaTipo ?? null;

    const extraccion = r.id
      ? { tokensInput: null as number | null, tokensOutput: null as number | null, duracionMs: null as number | null }
      : null;

    return {
      id: r.id,
      taskType: r.taskType,
      modelo: r.modelo,
      confianza,
      costeTokens: null,
      latenciaMs: null,
      corregido: r.documentoId ? (correctionsMap.get(r.documentoId) ?? false) : false,
      estado: r.estado,
      error: r.error,
      expedienteId: null,
      documentoId: r.documentoId,
      creadoEn: new Date(r.asignadoEn ?? Date.now()),
    };
  });

  return { items, total: countRow?.total ?? 0 };
}

export async function obtenerMetricasIA(): Promise<{
  totalTareas: number;
  tareasCompletadas: number;
  costeTotalTokens: { input: number; output: number };
  latenciaPromedio: number;
  tareasConCorreccion: number;
}> {
  const [totalTareas, tareasCompletadas, extrasTotal, correccionesTotal] = await Promise.all([
    db.select({ n: count() }).from(aiTaskRouting),
    db.select({ n: count() }).from(aiTaskRouting).where(eq(aiTaskRouting.estado, 'completed')),
    db
      .select({
        totalInput: sql<number>`COALESCE(SUM(${extraccionesIa.tokensInput}), 0)`,
        totalOutput: sql<number>`COALESCE(SUM(${extraccionesIa.tokensOutput}), 0)`,
        avgLatencia: sql<number>`COALESCE(AVG(${extraccionesIa.duracionMs}), 0)`,
      })
      .from(extraccionesIa),
    db.select({ n: count() }).from(correccionesIa),
  ]);

  return {
    totalTareas: Number(totalTareas?.[0]?.n ?? 0),
    tareasCompletadas: Number(tareasCompletadas?.[0]?.n ?? 0),
    costeTotalTokens: {
      input: Number(extrasTotal?.[0]?.totalInput ?? 0),
      output: Number(extrasTotal?.[0]?.totalOutput ?? 0),
    },
    latenciaPromedio: Math.round(Number(extrasTotal?.[0]?.avgLatencia ?? 0)),
    tareasConCorreccion: Number(correccionesTotal?.[0]?.n ?? 0),
  };
}
