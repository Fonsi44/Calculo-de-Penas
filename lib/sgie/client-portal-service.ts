import { db } from '@/lib/db';
import {
  enlacesMagicos,
  expedientes,
  requisitosExpediente,
  documentosExpediente,
  comunicacionesOutbox,
} from '@/lib/schema';
import { and, eq, asc, desc, gt, isNull, sql } from 'drizzle-orm';
import { hashToken } from '@/lib/sgie/util';

export interface PortalExpedienteResumen {
  numeroInterno: string;
  estado: string;
  area: string | null;
  creadoEn: Date;
  requisitos: PortalRequisito[];
  mensajes: PortalMensaje[];
}

export interface PortalRequisito {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  documentoId: string | null;
  documentoEstado: string | null;
}

export interface PortalMensaje {
  id: string;
  tipo: string;
  asunto: string;
  cuerpo: string;
  creadoEn: Date;
}

export async function obtenerPortalPorToken(
  token: string,
): Promise<{ ok: false; error: string } | { ok: true; expediente: PortalExpedienteResumen; enlaceId: string }> {
  const tokenHash = hashToken(token);

  const [enlace] = await db
    .select()
    .from(enlacesMagicos)
    .where(
      and(
        eq(enlacesMagicos.tokenHash, tokenHash),
        isNull(enlacesMagicos.revocadoEn),
        gt(enlacesMagicos.expiraEn, sql`NOW()`),
      ),
    )
    .limit(1);

  if (!enlace) {
    return { ok: false, error: 'Enlace inválido, expirado o revocado' };
  }

  const [expediente] = await db
    .select()
    .from(expedientes)
    .where(eq(expedientes.id, enlace.expedienteId))
    .limit(1);

  if (!expediente) {
    return { ok: false, error: 'Expediente no encontrado' };
  }

  const [requisitos, mensajes] = await Promise.all([
    db
      .select({
        id: requisitosExpediente.id,
        nombre: requisitosExpediente.nombre,
        tipo: requisitosExpediente.tipo,
        estado: requisitosExpediente.estado,
      })
      .from(requisitosExpediente)
      .where(eq(requisitosExpediente.expedienteId, expediente.id))
      .orderBy(asc(requisitosExpediente.orden), asc(requisitosExpediente.creadoEn)),
    db
      .select({
        id: comunicacionesOutbox.id,
        tipo: comunicacionesOutbox.tipo,
        asunto: comunicacionesOutbox.asunto,
        cuerpo: comunicacionesOutbox.cuerpo,
        creadoEn: comunicacionesOutbox.creadoEn,
      })
      .from(comunicacionesOutbox)
      .where(
        and(
          eq(comunicacionesOutbox.expedienteId, expediente.id),
          eq(comunicacionesOutbox.estado, 'sent'),
        ),
      )
      .orderBy(desc(comunicacionesOutbox.creadoEn))
      .limit(20),
  ]);

  const docsPorRequisito = await db
    .select({
      requisitoId: documentosExpediente.requisitoExpedienteId,
      id: documentosExpediente.id,
      estado: documentosExpediente.estado,
    })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.expedienteId, expediente.id));

  const docMap = new Map<string, { id: string; estado: string }>();
  for (const doc of docsPorRequisito) {
    if (doc.requisitoId && !docMap.has(doc.requisitoId)) {
      docMap.set(doc.requisitoId, { id: doc.id, estado: doc.estado });
    }
  }

  const portalRequisitos: PortalRequisito[] = requisitos.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
    estado: r.estado,
    documentoId: docMap.get(r.id)?.id ?? null,
    documentoEstado: docMap.get(r.id)?.estado ?? null,
  }));

  const portalMensajes: PortalMensaje[] = mensajes.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    asunto: m.asunto ?? m.tipo,
    cuerpo: m.cuerpo ?? '',
    creadoEn: m.creadoEn ? new Date(m.creadoEn) : new Date(),
  }));

  return {
    ok: true,
    enlaceId: enlace.id,
    expediente: {
      numeroInterno: expediente.numeroInterno,
      estado: expediente.estado,
      area: expediente.area,
      creadoEn: expediente.creadoEn ? new Date(expediente.creadoEn) : new Date(),
      requisitos: portalRequisitos,
      mensajes: portalMensajes,
    },
  };
}

export async function obtenerRequisitosPortal(enlaceId: string): Promise<PortalRequisito[]> {
  const [enlace] = await db
    .select({ expedienteId: enlacesMagicos.expedienteId })
    .from(enlacesMagicos)
    .where(eq(enlacesMagicos.id, enlaceId))
    .limit(1);

  if (!enlace) return [];

  const requisitos = await db
    .select({
      id: requisitosExpediente.id,
      nombre: requisitosExpediente.nombre,
      tipo: requisitosExpediente.tipo,
      estado: requisitosExpediente.estado,
    })
    .from(requisitosExpediente)
    .where(eq(requisitosExpediente.expedienteId, enlace.expedienteId))
    .orderBy(asc(requisitosExpediente.orden), asc(requisitosExpediente.creadoEn));

  const docs = await db
    .select({
      requisitoId: documentosExpediente.requisitoExpedienteId,
      id: documentosExpediente.id,
      estado: documentosExpediente.estado,
    })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.expedienteId, enlace.expedienteId));

  const docMap = new Map<string, { id: string; estado: string }>();
  for (const doc of docs) {
    if (doc.requisitoId && !docMap.has(doc.requisitoId)) {
      docMap.set(doc.requisitoId, { id: doc.id, estado: doc.estado });
    }
  }

  return requisitos.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
    estado: r.estado,
    documentoId: docMap.get(r.id)?.id ?? null,
    documentoEstado: docMap.get(r.id)?.estado ?? null,
  }));
}
