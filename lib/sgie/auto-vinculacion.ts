/**
 * Auto-vinculación documento → requisito — P2-02 (Fase 4A).
 *
 * Vincula automáticamente un documento a un requisito pendiente solo cuando:
 * - feature flag `sgie.ai.auto_link` activa;
 * - expediente autorizado;
 * - requisito compatible (tipo documental esperado == tipo clasificado);
 * - confianza de clasificación supera umbral configurable;
 * - no existe contradicción bloqueante en el expediente;
 * - no hay vínculo humano incompatible previo;
 * - la operación es idempotente (no duplica vínculo aceptado).
 *
 * Toda vinculación automática es REVERSIBLE: el abogado puede revocarla,
 * generando outbox cuando afecta workflow/readiness. Nunca borra historial.
 *
 * Conflictos (varios requisitos candidatos) => NO vincula automáticamente;
 * propone candidatos y envía a revisión humana.
 */
import { db } from '@/lib/db';
import {
  documentLinks,
  requisitosExpediente,
  documentClassifications,
  documentContradictions,
  type DocumentLink,
} from '@/lib/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { isFlagEnabled } from './feature-flags';

export type EstadoVinculo = 'propuesta' | 'aceptada' | 'rechazada' | 'revocada';

export interface InputAutoVinculacion {
  documentId: string;
  expedienteId: string;
  flagContext?: Parameters<typeof isFlagEnabled>[1];
}

export interface ResultadoAutoVinculacion {
  ok: boolean;
  accion: 'auto_vinculada' | 'propuesta_revision' | 'sin_candidatos' | 'bloqueada' | 'flag_desactivada';
  requisitoId?: string;
  vinculoId?: string;
  confianza?: number;
  explicacion: string;
  candidatos?: Array<{ requisitoId: string; nombre: string; motivo: string }>;
  motivo?: string;
}

export const UMBRAL_AUTO_VINCULO = 75; // confianza mínima de clasificación para auto-vincular.

/**
 * Comprueba si un tipo documental es compatible con el nombre de un requisito.
 * Mapeo flexible: el requisito "Identificacion oficial" es compatible con
 * tipo "identidad"; "Comprobante de domicilio" con "constancia", etc.
 */
const COMPATIBILIDAD_TIPO_REQUISITO: Record<string, string[]> = {
  identidad: ['identificacion', 'identidad', 'dni', 'cédula', 'carnet'],
  rtn: ['rtn', 'registro tributario', 'fiscal'],
  acta: ['acta', 'partida', 'nacimiento', 'matrimonio'],
  poder: ['poder', 'mandato', 'representación', 'autorización'],
  contrato: ['contrato', 'convenio', 'acuerdo'],
  constancia: ['constancia', 'comprobante', 'certificación', 'domicilio', 'residencia'],
  demanda: ['demanda', 'escrito inicial', 'querella'],
  sentencia: ['sentencia', 'resolución', 'fallo'],
};

export function esCompatible(tipoDocumento: string, nombreRequisito: string): boolean {
  const palabras = COMPATIBILIDAD_TIPO_REQUISITO[tipoDocumento] ?? [];
  const req = nombreRequisito.toLowerCase();
  return palabras.some((p) => req.includes(p));
}

/**
 * Ejecuta la auto-vinculación. Devuelve el resultado sin lanzar (siempre
 * auditable). El caller (API) aplica outbox si el estado final lo requiere.
 */
export async function autoVincularDocumento(input: InputAutoVinculacion): Promise<ResultadoAutoVinculacion> {
  // Feature flag deny-by-default.
  const flagOn = await isFlagEnabled('sgie.ai.auto_link', input.flagContext ?? {}).catch(() => false);
  if (!flagOn) {
    return { ok: false, accion: 'flag_desactivada', explicacion: 'Feature flag sgie.ai.auto_link desactivada' };
  }

  // Idempotencia: si ya hay vínculo aceptado/propuesta para este doc, no duplicar.
  const existentes = await db
    .select()
    .from(documentLinks)
    .where(
      and(
        eq(documentLinks.documentId, input.documentId),
        inArray(documentLinks.estado, ['propuesta', 'aceptada']),
      ),
    )
    .limit(1);
  if (existentes.length > 0) {
    return {
      ok: true,
      accion: 'propuesta_revision',
      vinculoId: existentes[0].id,
      requisitoId: existentes[0].requisitoId ?? undefined,
      explicacion: 'Ya existe vínculo propuesto/aceptado (idempotencia)',
      motivo: 'idempotente_existente',
    };
  }

  // Obtener clasificación vigente del documento.
  const cls = await db
    .select()
    .from(documentClassifications)
    .where(eq(documentClassifications.documentId, input.documentId))
    .orderBy(desc(documentClassifications.creadoEn))
    .limit(1);
  if (cls.length === 0 || !cls[0].tipoPropuesto) {
    return { ok: false, accion: 'sin_candidatos', explicacion: 'Sin clasificación previa del documento' };
  }
  const tipoDoc = cls[0].tipoPropuesto;
  const confianza = cls[0].confianza;

  // Bloqueo: contradicciones bloqueantes en el expediente.
  const bloqueantes = await db
    .select({ id: documentContradictions.id })
    .from(documentContradictions)
    .where(
      and(
        eq(documentContradictions.expedienteId, input.expedienteId),
        eq(documentContradictions.bloqueante, true),
        inArray(documentContradictions.estado, ['propuesta', 'confirmada']),
      ),
    )
    .limit(1);
  if (bloqueantes.length > 0) {
    return {
      ok: false,
      accion: 'bloqueada',
      explicacion: 'Expediente tiene contradicción bloqueante pendiente',
      motivo: 'contradiccion_bloqueante',
    };
  }

  // Buscar requisitos pendientes del expediente.
  const requisitos = await db
    .select()
    .from(requisitosExpediente)
    .where(
      and(
        eq(requisitosExpediente.expedienteId, input.expedienteId),
        inArray(requisitosExpediente.estado, ['solicitado', 'subido', 'pendiente_abogado']),
      ),
    );
  if (requisitos.length === 0) {
    return { ok: false, accion: 'sin_candidatos', explicacion: 'No hay requisitos pendientes en el expediente' };
  }

  // Filtrar compatibles.
  const candidatos = requisitos.filter((r) => esCompatible(tipoDoc, r.nombre));
  if (candidatos.length === 0) {
    return {
      ok: false,
      accion: 'sin_candidatos',
      explicacion: `Ningún requisito pendiente es compatible con tipo "${tipoDoc}"`,
      confianza,
    };
  }

  // Conflicto: múltiples candidatos => no auto-vincular; proponer revisión.
  if (candidatos.length > 1) {
    const [inserted] = await db
      .insert(documentLinks)
      .values({
        documentId: input.documentId,
        expedienteId: input.expedienteId,
        requisitoId: null, // sin requisito concreto
        origen: 'auto',
        tipo: 'principal',
        confianza,
        estrategia: 'reglas',
        explicacion: `Múltiples requisitos candidatos (${candidatos.map((c) => c.nombre).join(', ')}); requiere decisión humana`,
        evidencias: candidatos.map((c) => ({ requisitoId: c.id, nombre: c.nombre })),
        estado: 'propuesta',
      })
      .returning({ id: documentLinks.id });
    return {
      ok: true,
      accion: 'propuesta_revision',
      vinculoId: inserted?.id,
      candidatos: candidatos.map((c) => ({ requisitoId: c.id, nombre: c.nombre, motivo: 'compatible' })),
      confianza,
      explicacion: 'Múltiples candidatos; enviada a revisión humana',
    };
  }

  // Candidato único: auto-vincular solo si confianza >= umbral.
  const req = candidatos[0];
  if (confianza < UMBRAL_AUTO_VINCULO) {
    const [inserted] = await db
      .insert(documentLinks)
      .values({
        documentId: input.documentId,
        expedienteId: input.expedienteId,
        requisitoId: req.id,
        origen: 'auto',
        tipo: 'principal',
        confianza,
        estrategia: 'reglas',
        explicacion: `Confianza ${confianza} < umbral ${UMBRAL_AUTO_VINCULO}; requiere revisión humana`,
        evidencias: [{ requisitoId: req.id, nombre: req.nombre, tipoDoc }],
        estado: 'propuesta',
      })
      .returning({ id: documentLinks.id });
    return {
      ok: true,
      accion: 'propuesta_revision',
      vinculoId: inserted?.id,
      requisitoId: req.id,
      confianza,
      explicacion: `Confianza insuficiente; propuesta para revisión`,
    };
  }

  // Auto-vinculación aceptada (alta confianza + candidato único + sin bloqueos).
  const [inserted] = await db
    .insert(documentLinks)
    .values({
      documentId: input.documentId,
      expedienteId: input.expedienteId,
      requisitoId: req.id,
      origen: 'auto',
      tipo: 'principal',
      confianza,
      estrategia: 'reglas',
      explicacion: `Auto-vinculación: tipo "${tipoDoc}" (confianza ${confianza}) compatible con requisito "${req.nombre}"`,
      evidencias: [{ requisitoId: req.id, nombre: req.nombre, tipoDoc, confianza }],
      estado: 'aceptada',
    })
    .returning({ id: documentLinks.id });

  return {
    ok: true,
    accion: 'auto_vinculada',
    vinculoId: inserted?.id,
    requisitoId: req.id,
    confianza,
    explicacion: `Auto-vinculado a requisito "${req.nombre}"`,
  };
}

/**
 * Revoca un vínculo automático (reversibilidad). El abogado decide.
 */
export async function revocarVinculo(
  vinculoId: string,
  actorId: string,
  motivo: string,
): Promise<DocumentLink | null> {
  const [updated] = await db
    .update(documentLinks)
    .set({ estado: 'revocada', decisionPor: actorId, decisionEn: new Date(), decisionMotivo: motivo, actualizadoEn: new Date() })
    .where(eq(documentLinks.id, vinculoId))
    .returning();
  return updated ?? null;
}
