/**
 * Motor de contradicciones — P2-04 (Fase 4A).
 *
 * Capa determinista implementada: compara campos extraídos del mismo
 * expediente con reglas (identidad incompatible, expediente externo distinto,
 * duplicidad por hash). Los campos sensibles (identidad, RTN, expediente_externo)
 * generan contradicción críticas bloqueantes; el resto advertencias.
 *
 * PENDIENTE (Fase 4B): capa IA (DeepSeek) sobre fragmentos autorizados para
 * detectar contradicciones complejas entre múltiples documentos. El header
 * original prometía esa capa; se elimina la promesa hasta que se implemente.
 *
 * Estados: propuesta → confirmada | rechazada | resuelta | aceptada_con_motivo.
 * Idempotencia: garantizada por UNIQUE (expediente, tipo, document_a, document_b)
 * añadida en migración 0042.
 * Contradicciones críticas siempre requieren humano.
 */
import { db } from '@/lib/db';
import {
  documentContradictions,
  documentExtractions,
  type DocumentContradiction,
} from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { isFlagEnabled } from './feature-flags';

export type TipoContradiccion =
  | 'fecha_incompatible' | 'identidad_incompatible' | 'expediente_externo_distinto'
  | 'caducado' | 'firmante_ausente' | 'cuantia_incompatible' | 'requisito_equivocado'
  | 'duplicidad' | 'version_inconsistente' | 'otra';

export type SeveridadContradiccion = 'info' | 'advertencia' | 'error' | 'critico';
export type EstadoContradiccion = 'propuesta' | 'confirmada' | 'rechazada' | 'resuelta' | 'aceptada_con_motivo';

export interface ContradiccionDetectada {
  tipo: TipoContradiccion;
  severidad: SeveridadContradiccion;
  bloqueante: boolean;
  hechoA: Record<string, unknown>;
  hechoB: Record<string, unknown>;
  documentAId?: string;
  documentBId?: string;
  explicacion: string;
  confianza: number; // 0-100
  origen: 'determinista' | 'ia' | 'humano';
  reglaId?: string;
}

/**
 * Compara valores de un campo entre documentos del mismo expediente.
 * Determinista: si dos documentos reportan el MISMO campo con valores distintos
 * y ambos son de identidad (campo sensible), es una contradicción crítica.
 */
export function detectarContradiccionesDeterministas(
  camposPorDoc: Array<{ documentId: string; campos: Array<{ clave: string; valor: string | number | null; confianza: number }> }>,
): ContradiccionDetectada[] {
  const out: ContradiccionDetectada[] = [];
  // Campos sensibles: discrepancia => crítica.
  const CAMPOS_SENSIBLES = new Set(['numero_identidad', 'rtn', 'expediente_externo']);
  // Agrupar valores por clave.
  const porClave = new Map<string, Array<{ documentId: string; valor: string | number | null; confianza: number }>>();
  for (const d of camposPorDoc) {
    for (const c of d.campos) {
      if (c.valor === null || c.valor === undefined || c.valor === '') continue;
      if (!porClave.has(c.clave)) porClave.set(c.clave, []);
      porClave.get(c.clave)!.push({ documentId: d.documentId, valor: c.valor, confianza: c.confianza });
    }
  }
  for (const [clave, valores] of porClave.entries()) {
    // Solo comparar si hay >=2 documentos con la clave.
    if (valores.length < 2) continue;
    const unicos = new Set(valores.map((v) => String(v.valor)));
    if (unicos.size > 1) {
      const sensible = CAMPOS_SENSIBLES.has(clave);
      const a = valores[0];
      const b = valores[1];
      out.push({
        tipo: clave === 'expediente_externo' ? 'expediente_externo_distinto'
          : clave === 'numero_identidad' ? 'identidad_incompatible'
          : 'otra',
        severidad: sensible ? 'critico' : 'advertencia',
        bloqueante: sensible,
        hechoA: { clave, valor: a.valor, documentId: a.documentId },
        hechoB: { clave, valor: b.valor, documentId: b.documentId },
        documentAId: a.documentId,
        documentBId: b.documentId,
        explicacion: `Campo "${clave}" difiere entre documentos: "${a.valor}" vs "${b.valor}"`,
        confianza: 100,
        origen: 'determinista',
        reglaId: `det.${clave}_discrepancia`,
      });
    }
  }
  return out;
}

/**
 * Detecta duplicidad: dos documentos con el mismo hash_sha256.
 */
export function detectarDuplicidadHash(
  docs: Array<{ documentId: string; hashSha256: string }>,
): ContradiccionDetectada[] {
  const out: ContradiccionDetectada[] = [];
  const porHash = new Map<string, string[]>();
  for (const d of docs) {
    if (!porHash.has(d.hashSha256)) porHash.set(d.hashSha256, []);
    porHash.get(d.hashSha256)!.push(d.documentId);
  }
  for (const [hash, ids] of porHash.entries()) {
    if (ids.length >= 2) {
      out.push({
        tipo: 'duplicidad',
        severidad: 'info',
        bloqueante: false,
        hechoA: { hash, documentId: ids[0] },
        hechoB: { hash, documentId: ids[1] },
        documentAId: ids[0],
        documentBId: ids[1],
        explicacion: `Documentos duplicados (hash idéntico ${hash.slice(0, 12)}…)`,
        confianza: 100,
        origen: 'determinista',
        reglaId: 'det.duplicidad_hash',
      });
    }
  }
  return out;
}

/**
 * Ejecuta la detección para un expediente completo. Determinista siempre;
 * DeepSeek opcional (solo compara fragmentos autorizados). Persiste
 * idempotentemente.
 */
export async function detectarContradiccionesExpediente(input: {
  expedienteId: string;
  flagContext?: Parameters<typeof isFlagEnabled>[1];
}): Promise<{ ok: boolean; detectadas: DocumentContradiction[]; razon?: string }> {
  const flagOn = await isFlagEnabled('sgie.ai.contradictions', input.flagContext ?? {}).catch(() => false);
  if (!flagOn) {
    return { ok: false, detectadas: [], razon: 'feature_flag_desactivada' };
  }

  // Cargar extracciones vigentes del expediente.
  const extracciones = await db
    .select()
    .from(documentExtractions)
    .where(eq(documentExtractions.expedienteId, input.expedienteId));
  const camposPorDoc = extracciones.map((e) => ({
    documentId: e.documentId,
    campos: ((e.campos as Array<{ clave: string; valor: string | number | null; confianza: number }>) ?? []).map((c) => ({
      clave: c.clave,
      valor: c.valor,
      confianza: c.confianza,
    })),
  }));

  const detectadas = detectarContradiccionesDeterministas(camposPorDoc);

  // Persistir idempotentemente (una por tipo+docA+docB).
  const persistidas: DocumentContradiction[] = [];
  for (const d of detectadas) {
    const [inserted] = await db
      .insert(documentContradictions)
      .values({
        expedienteId: input.expedienteId,
        tipo: d.tipo,
        hechoA: d.hechoA,
        hechoB: d.hechoB,
        documentAId: d.documentAId ?? null,
        documentBId: d.documentBId ?? null,
        severidad: d.severidad,
        confianza: d.confianza,
        bloqueante: d.bloqueante,
        explicacion: d.explicacion,
        origen: d.origen,
        reglaId: d.reglaId ?? null,
        estado: 'propuesta',
      })
      .onConflictDoNothing()
      .returning();
    if (inserted) persistidas.push(inserted);
  }

  return { ok: true, detectadas: persistidas };
}

/**
 * Resolución humana de una contradicción. Crítica siempre requiere humano.
 */
export async function resolverContradiccion(
  contradiccionId: string,
  estado: 'confirmada' | 'rechazada' | 'resuelta' | 'aceptada_con_motivo',
  actorId: string,
  motivo: string,
): Promise<DocumentContradiction | null> {
  const [updated] = await db
    .update(documentContradictions)
    .set({ estado, resolucionPor: actorId, resolucionEn: new Date(), resolucionMotivo: motivo })
    .where(eq(documentContradictions.id, contradiccionId))
    .returning();
  return updated ?? null;
}

/**
 * ¿Hay contradicciones bloqueantes sin resolver en el expediente?
 */
export async function tieneContradiccionesBloqueantes(expedienteId: string): Promise<boolean> {
  const rows = await db
    .select({ id: documentContradictions.id })
    .from(documentContradictions)
    .where(
      and(
        eq(documentContradictions.expedienteId, expedienteId),
        eq(documentContradictions.bloqueante, true),
        inArray(documentContradictions.estado, ['propuesta', 'confirmada']),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
