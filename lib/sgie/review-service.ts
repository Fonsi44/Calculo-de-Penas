import { db } from '@/lib/db';
import {
  documentosExpediente,
  expedientes,
  requisitosExpediente,
  ocrResultados,
  extraccionesIa,
} from '@/lib/schema';
import { and, eq, desc, count, sql } from 'drizzle-orm';

export interface ReviewItem {
  id: string;
  documentoId: string;
  expedienteId: string;
  expedienteNumero: string;
  requisitoNombre: string;
  estado: string;
  confianza: number | null;
  motivo: string;
  evidencia: unknown;
  paginas: number;
  responsableNombre: string | null;
  creadoEn: Date;
}

export interface ReviewFilters {
  confianzaBaja?: boolean;
  ocrInsuficiente?: boolean;
  clasificacionDudosa?: boolean;
  contradiccion?: boolean;
  ilegible?: boolean;
  duplicado?: boolean;
  rechazado?: boolean;
  errorTecnico?: boolean;
  expedienteId?: string;
  abogadoId?: string;
  tipo?: string;
  antiguedadHoras?: number;
  prioridad?: string;
  limit?: number;
  offset?: number;
}

export async function listarRevisionPendiente(
  filters: ReviewFilters,
  ctx: { usuarioId: string; esAdmin: boolean },
): Promise<{ items: ReviewItem[]; total: number }> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = Math.max(filters.offset ?? 0, 0);

  const estadosFiltro: string[] = [];
  if (filters.confianzaBaja || filters.clasificacionDudosa) estadosFiltro.push('pendiente_abogado');
  if (filters.ocrInsuficiente) estadosFiltro.push('ocr_pendiente');
  if (filters.ilegible) estadosFiltro.push('ilegible');
  if (filters.duplicado) estadosFiltro.push('duplicado');
  if (filters.rechazado) estadosFiltro.push('rechazado');
  if (filters.errorTecnico) estadosFiltro.push('incorrecto');
  if (estadosFiltro.length === 0) estadosFiltro.push('pendiente_abogado', 'ocr_pendiente', 'ilegible', 'duplicado', 'rechazado', 'incorrecto');

  const conditions = [
    sql`${documentosExpediente.estado} IN (${sql.join(estadosFiltro.map(s => sql`${s}`), sql`, `)})`,
  ];

  if (filters.expedienteId) {
    conditions.push(eq(documentosExpediente.expedienteId, filters.expedienteId));
  }

  if (filters.abogadoId && !ctx.esAdmin) {
    conditions.push(eq(expedientes.responsableId, filters.abogadoId));
  } else if (!ctx.esAdmin) {
    conditions.push(eq(expedientes.responsableId, ctx.usuarioId));
  }

  if (filters.antiguedadHoras) {
    conditions.push(
      sql`${documentosExpediente.subidoEn} < NOW() - INTERVAL '1 hour' * ${filters.antiguedadHoras}`,
    );
  }

  const where = and(...conditions);

  const [countRow] = await db
    .select({ total: count() })
    .from(documentosExpediente)
    .innerJoin(expedientes, eq(documentosExpediente.expedienteId, expedientes.id))
    .where(where);

  const rows = await db
    .select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      expedienteNumero: expedientes.numeroInterno,
      requNombre: requisitosExpediente.nombre,
      estado: documentosExpediente.estado,
      creadoEn: documentosExpediente.subidoEn,
    })
    .from(documentosExpediente)
    .innerJoin(expedientes, eq(documentosExpediente.expedienteId, expedientes.id))
    .leftJoin(requisitosExpediente, eq(documentosExpediente.requisitoExpedienteId, requisitosExpediente.id))
    .where(where)
    .orderBy(desc(documentosExpediente.subidoEn))
    .limit(limit)
    .offset(offset);

  const items: ReviewItem[] = [];

  for (const row of rows) {
    const [ocr] = await db
      .select({ confianza: ocrResultados.confianza, paginas: ocrResultados.paginas })
      .from(ocrResultados)
      .where(eq(ocrResultados.documentoId, row.id))
      .orderBy(desc(ocrResultados.creadoEn))
      .limit(1);

    const [extraccion] = await db
      .select({ totalConfidence: extraccionesIa.totalConfidence, resultadoJson: extraccionesIa.resultadoJson })
      .from(extraccionesIa)
      .where(eq(extraccionesIa.documentoId, row.id))
      .orderBy(desc(extraccionesIa.creadoEn))
      .limit(1);

    const motivo = buildMotivo(row.estado, ocr?.confianza ?? null, extraccion?.totalConfidence ?? null);
    const confianza = extraccion?.totalConfidence ?? (ocr?.confianza ? Math.round(ocr.confianza * 100) : null);

    items.push({
      id: row.id,
      documentoId: row.id,
      expedienteId: row.expedienteId,
      expedienteNumero: row.expedienteNumero,
      requisitoNombre: row.requNombre ?? 'Sin requisito asignado',
      estado: row.estado,
      confianza,
      motivo,
      evidencia: extraccion?.resultadoJson ?? null,
      paginas: ocr?.paginas ?? 0,
      responsableNombre: null,
      creadoEn: row.creadoEn ? new Date(row.creadoEn) : new Date(),
    });
  }

  return { items, total: countRow?.total ?? 0 };
}

function buildMotivo(estado: string, ocrConfianza: number | null, iaConfianza: number | null): string {
  switch (estado) {
    case 'pendiente_abogado':
      if (iaConfianza !== null && iaConfianza < 65) return 'Confianza IA baja — requiere revisión humana';
      if (iaConfianza !== null) return 'Revisión pendiente del abogado';
      return 'Procesado, pendiente de revisión';
    case 'ocr_pendiente':
      return 'OCR pendiente de ejecución';
    case 'ilegible':
      return 'Documento ilegible — no se pudo extraer texto';
    case 'duplicado':
      return 'Documento duplicado detectado por hash';
    case 'rechazado':
      return 'Documento rechazado por abogado';
    case 'incorrecto':
      return 'Error técnico durante el procesamiento';
    default:
      return `Estado: ${estado}`;
  }
}

export async function aprobarDocumento(
  documentoId: string,
  ctx: { usuarioId: string; esAdmin: boolean },
): Promise<void> {
  const [doc] = await db
    .select({ id: documentosExpediente.id })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId))
    .limit(1);

  if (!doc) throw new Error('Documento no encontrado');

  await db
    .update(documentosExpediente)
    .set({
      estado: 'aprobado',
      aprobadoPor: ctx.usuarioId,
      aprobadoEn: new Date(),
    })
    .where(eq(documentosExpediente.id, documentoId));
}

export async function devolverDocumento(
  documentoId: string,
  motivo: string,
  ctx: { usuarioId: string; esAdmin: boolean },
): Promise<void> {
  const [doc] = await db
    .select({ id: documentosExpediente.id })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId))
    .limit(1);

  if (!doc) throw new Error('Documento no encontrado');

  await db
    .update(documentosExpediente)
    .set({
      estado: 'pendiente_abogado',
      rechazoMotivo: motivo,
      rechazadoPor: ctx.usuarioId,
      rechazadoEn: new Date(),
    })
    .where(eq(documentosExpediente.id, documentoId));
}

export async function solicitarReemplazo(
  documentoId: string,
  motivo: string,
  ctx: { usuarioId: string; esAdmin: boolean },
): Promise<void> {
  const [doc] = await db
    .select({ id: documentosExpediente.id })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId))
    .limit(1);

  if (!doc) throw new Error('Documento no encontrado');

  await db
    .update(documentosExpediente)
    .set({
      estado: 'rechazado',
      rechazoMotivo: `Reemplazo solicitado: ${motivo}`,
      rechazadoPor: ctx.usuarioId,
      rechazadoEn: new Date(),
    })
    .where(eq(documentosExpediente.id, documentoId));
}

export async function marcarNoAplicable(
  documentoId: string,
  ctx: { usuarioId: string; esAdmin: boolean },
): Promise<void> {
  const [doc] = await db
    .select({ id: documentosExpediente.id, requisitoExpedienteId: documentosExpediente.requisitoExpedienteId })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId))
    .limit(1);

  if (!doc) throw new Error('Documento no encontrado');

  await db
    .update(documentosExpediente)
    .set({ estado: 'aprobado', aprobadoPor: ctx.usuarioId, aprobadoEn: new Date() })
    .where(eq(documentosExpediente.id, documentoId));
}

export async function reintentarOcr(
  documentoId: string,
  _ctx: { usuarioId: string; esAdmin: boolean },
): Promise<void> {
  const [doc] = await db
    .select({ id: documentosExpediente.id })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId))
    .limit(1);

  if (!doc) throw new Error('Documento no encontrado');

  await db
    .update(documentosExpediente)
    .set({ estado: 'ocr_pendiente' })
    .where(eq(documentosExpediente.id, documentoId));
}

export async function reintentarIa(
  documentoId: string,
  _ctx: { usuarioId: string; esAdmin: boolean },
): Promise<void> {
  const [doc] = await db
    .select({ id: documentosExpediente.id })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId))
    .limit(1);

  if (!doc) throw new Error('Documento no encontrado');

  await db
    .update(documentosExpediente)
    .set({ estado: 'pendiente_abogado' })
    .where(eq(documentosExpediente.id, documentoId));
}
