import { db } from '@/lib/db';
import {
  plantillasCorreo,
  correosEnviados,
  comunicacionesOutbox,
  type PlantillaCorreo,
} from '@/lib/schema';
import { and, eq, count, desc, asc } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

export interface CommunicationRule {
  id: string;
  nombre: string;
  disparador: string;
  condiciones: any;
  destinatario: string;
  plantillaSlug: string;
  retrasoMinutos: number;
  horarioInicio: string;
  horarioFin: string;
  cadenciaHoras: number;
  maximoEnvio: number;
  cancelacionSi: string;
  sensibilidad: string;
  requiereAprobacion: boolean;
  idioma: string;
  escalado: any;
  estado: string;
  version: number;
}

export async function listarReglas(filters: {
  estado?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: CommunicationRule[]; total: number }> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = Math.max(filters.offset ?? 0, 0);

  const conditions = [];
  if (filters.estado) {
    conditions.push(eq(plantillasCorreo.estado, filters.estado as 'borrador' | 'activa' | 'desactivada'));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(plantillasCorreo)
    .where(where);

  const rows = await db
    .select()
    .from(plantillasCorreo)
    .where(where)
    .orderBy(desc(plantillasCorreo.actualizadoEn))
    .limit(limit)
    .offset(offset);

  const items: CommunicationRule[] = rows.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    disparador: p.slug,
    condiciones: {},
    destinatario: '',
    plantillaSlug: p.slug,
    retrasoMinutos: 0,
    horarioInicio: '09:00',
    horarioFin: '18:00',
    cadenciaHoras: 24,
    maximoEnvio: 3,
    cancelacionSi: '',
    sensibilidad: 'normal',
    requiereAprobacion: false,
    idioma: 'es',
    escalado: null,
    estado: p.estado,
    version: 1,
  }));

  return { items, total: countRow?.total ?? 0 };
}

export async function crearRegla(
  input: Partial<CommunicationRule>,
  ctx: any,
): Promise<CommunicationRule> {
  const values: {
    slug: string;
    nombre: string;
    asunto: string;
    cuerpoHtml: string;
    variablesPermitidas: string[];
    estado: 'borrador' | 'activa' | 'desactivada';
    creadoPor: string | null;
  } = {
    slug: input.plantillaSlug ?? `regla-${Date.now()}`,
    nombre: input.nombre ?? 'Nueva regla',
    asunto: '{{asunto}}',
    cuerpoHtml: '<p>{{cuerpo}}</p>',
    variablesPermitidas: [],
    estado: 'borrador',
    creadoPor: ctx?.usuarioId ?? null,
  };

  const [plantilla] = await db
    .insert(plantillasCorreo)
    .values(values)
    .returning();

  await logSgie({
    usuarioId: ctx?.usuarioId ?? '00000000-0000-0000-0000-000000000000',
    accion: 'plantilla_created',
    recurso: 'plantillas_correo',
    recursoId: plantilla.id,
    metadata: { slug: plantilla.slug, nombre: plantilla.nombre },
    exito: true,
  });

  return {
    id: plantilla.id,
    nombre: plantilla.nombre,
    disparador: plantilla.slug,
    condiciones: {},
    destinatario: '',
    plantillaSlug: plantilla.slug,
    retrasoMinutos: 0,
    horarioInicio: '09:00',
    horarioFin: '18:00',
    cadenciaHoras: 24,
    maximoEnvio: 3,
    cancelacionSi: '',
    sensibilidad: 'normal',
    requiereAprobacion: false,
    idioma: 'es',
    escalado: null,
    estado: plantilla.estado,
    version: 1,
  };
}

export async function simularRegla(
  reglaId: string,
  expedienteId: string,
): Promise<any> {
  const [plantilla] = await db
    .select()
    .from(plantillasCorreo)
    .where(eq(plantillasCorreo.id, reglaId))
    .limit(1);

  if (!plantilla) throw new Error('Regla/plantilla no encontrada');

  const enviadosPrevios = await db
    .select({ n: count() })
    .from(correosEnviados)
    .where(
      and(
        eq(correosEnviados.expedienteId, expedienteId),
        eq(correosEnviados.plantillaSlug, plantilla.slug),
      ),
    );

  return {
    regla: {
      id: plantilla.id,
      nombre: plantilla.nombre,
      slug: plantilla.slug,
      estado: plantilla.estado,
    },
    simulacion: {
      expedienteId,
      coincidencias: 1,
      enviadosPreviamente: Number(enviadosPrevios?.[0]?.n ?? 0),
      seEnviaria: true,
      motivo: `La regla "${plantilla.nombre}" aplica al expediente ${expedienteId}`,
      variablesDisponibles: plantilla.variablesPermitidas,
    },
  };
}
