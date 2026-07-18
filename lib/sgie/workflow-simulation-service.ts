import { db } from '@/lib/db';
import {
  procedimientoVersiones,
  procedimientoFases,
  procedimientoTransiciones,
} from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

export interface SimulationResult {
  fases: Array<{ nombre: string; duracionEstimada: string; requisitos: string[] }>;
  tareas: Array<{ titulo: string; responsable: string }>;
  comunicaciones: Array<{ tipo: string; destinatario: string }>;
  transiciones: Array<{ desde: string; hacia: string; condiciones: string }>;
  bloqueos: string[];
  readiness: string[];
  reglas: string[];
  loops: string[];
}

export async function simularWorkflow(
  procedimientoVersionId: string,
  datosSimulacion: { rol: string; eventos: string[] },
): Promise<SimulationResult> {
  const [version] = await db
    .select()
    .from(procedimientoVersiones)
    .where(eq(procedimientoVersiones.id, procedimientoVersionId))
    .limit(1);

  if (!version) {
    throw new Error(`Versión de procedimiento no encontrada: ${procedimientoVersionId}`);
  }

  const fases = await db
    .select()
    .from(procedimientoFases)
    .where(eq(procedimientoFases.procedimientoVersionId, procedimientoVersionId))
    .orderBy(asc(procedimientoFases.orden));

  const transiciones = await db
    .select()
    .from(procedimientoTransiciones)
    .where(eq(procedimientoTransiciones.procedimientoVersionId, procedimientoVersionId));

  if (fases.length === 0) {
    return {
      fases: [],
      tareas: [],
      comunicaciones: [],
      transiciones: [],
      bloqueos: ['El procedimiento no tiene fases definidas'],
      readiness: [],
      reglas: [],
      loops: [],
    };
  }

  const fasesResult = fases.map((f) => ({
    nombre: f.nombre,
    duracionEstimada: estimarDuracion(f.nombre),
    requisitos: extraerRequisitosDeFase(f),
  }));

  const transicionesResult = transiciones.map((t) => {
    const desde = fases.find((f) => f.id === t.desdeFaseId);
    const hacia = fases.find((f) => f.id === t.haciaFaseId);
    return {
      desde: desde?.nombre ?? 'desconocida',
      hacia: hacia?.nombre ?? 'desconocida',
      condiciones: JSON.stringify(t.condiciones ?? {}),
    };
  });

  const tareasSimuladas = inferirTareas(fases, datosSimulacion);
  const comunicacionesSimuladas = inferirComunicaciones(fases);
  const bloqueos = detectarBloqueos(fases, transiciones, datosSimulacion);
  const readiness = detectarReadiness(fases, datosSimulacion);
  const reglas = detectarReglas(fases, transiciones);
  const loops = detectarLoops(fases, transiciones);

  return {
    fases: fasesResult,
    tareas: tareasSimuladas,
    comunicaciones: comunicacionesSimuladas,
    transiciones: transicionesResult,
    bloqueos,
    readiness,
    reglas,
    loops,
  };
}

function estimarDuracion(nombreFase: string): string {
  const estimaciones: Record<string, string> = {
    'Recepción de documentos': '2-3 días',
    'Revisión inicial': '1-2 días',
    'Análisis jurídico': '3-5 días',
    'Elaboración de dictamen': '2-3 días',
    'Revisión del dictamen': '1-2 días',
    'Presentación': '1 día',
    'Seguimiento': 'Variable',
    'Cierre': '1 día',
  };

  return estimaciones[nombreFase] ?? '3-5 días';
}

function extraerRequisitosDeFase(fase: typeof procedimientoFases.$inferSelect): string[] {
  const reqMap: Record<string, string[]> = {
    'Recepción de documentos': ['Documento de identidad', 'RTN', 'Poder notarial'],
    'Revisión inicial': ['Formulario de datos del caso', 'Contrato de servicios'],
    'Análisis jurídico': ['Legislación aplicable', 'Jurisprudencia relevante'],
    'Elaboración de dictamen': ['Análisis completado', 'Formato de dictamen'],
    Revisión: ['Boceto de dictamen'],
    'Revisión del dictamen': ['Dictamen elaborado'],
    Presentación: ['Dictamen final', 'Firma del abogado'],
    Seguimiento: ['Número de ingreso', 'Fecha de presentación'],
    Cierre: ['Resolución final', 'Facturación completada'],
  };

  for (const [key, reqs] of Object.entries(reqMap)) {
    if (fase.nombre.toLowerCase().includes(key.toLowerCase())) return reqs;
  }

  return ['Requisito estándar'];
}

function inferirTareas(
  fases: typeof procedimientoFases.$inferSelect[],
  datos: { rol: string; eventos: string[] },
): Array<{ titulo: string; responsable: string }> {
  const tareas: Array<{ titulo: string; responsable: string }> = [];

  for (const fase of fases) {
    tareas.push({
      titulo: `Completar fase: ${fase.nombre}`,
      responsable: datos.rol,
    });
    tareas.push({
      titulo: `Verificar requisitos de ${fase.nombre}`,
      responsable: 'Abogado responsable',
    });
  }

  tareas.push({ titulo: 'Revisión final del expediente', responsable: datos.rol });
  tareas.push({ titulo: 'Cierre administrativo', responsable: 'Administración' });

  return tareas;
}

function inferirComunicaciones(
  fases: typeof procedimientoFases.$inferSelect[],
): Array<{ tipo: string; destinatario: string }> {
  const comunicaciones: Array<{ tipo: string; destinatario: string }> = [];

  for (const fase of fases) {
    comunicaciones.push({
      tipo: 'notificacion_fase',
      destinatario: 'Abogado responsable',
    });
  }

  comunicaciones.push(
    { tipo: 'recordatorio', destinatario: 'Cliente' },
    { tipo: 'notificacion_estado', destinatario: 'Abogado responsable' },
    { tipo: 'alerta_vencimiento', destinatario: 'Abogado responsable' },
  );

  return comunicaciones;
}

function detectarBloqueos(
  fases: typeof procedimientoFases.$inferSelect[],
  transiciones: typeof procedimientoTransiciones.$inferSelect[],
  datos: { rol: string; eventos: string[] },
): string[] {
  const bloqueos: string[] = [];

  if (fases.length === 0) {
    bloqueos.push('No hay fases definidas');
    return bloqueos;
  }

  for (const fase of fases) {
    const transicionesDesde = transiciones.filter((t) => t.desdeFaseId === fase.id);
    if (transicionesDesde.length === 0) {
      bloqueos.push(`Fase "${fase.nombre}" no tiene transiciones de salida — el workflow quedaría bloqueado`);
    }
  }

  const actoresPermitidos = transiciones.flatMap((t) => t.actoresPermitidos ?? []);
  if (actoresPermitidos.length > 0 && !actoresPermitidos.includes(datos.rol)) {
    bloqueos.push(`El rol "${datos.rol}" no está autorizado para ninguna transición`);
  }

  return bloqueos;
}

function detectarReadiness(
  fases: typeof procedimientoFases.$inferSelect[],
  datos: { rol: string; eventos: string[] },
): string[] {
  const readiness: string[] = [];

  for (const fase of fases) {
    readiness.push(`Checklist de preparación para fase: ${fase.nombre}`);
    readiness.push(`Validar requisitos documentales de: ${fase.nombre}`);
  }

  readiness.push('Evaluación de completitud documental');
  readiness.push('Verificación de firmas y autorizaciones');

  return readiness;
}

function detectarReglas(
  fases: typeof procedimientoFases.$inferSelect[],
  transiciones: typeof procedimientoTransiciones.$inferSelect[],
): string[] {
  const reglas: string[] = [];

  for (const t of transiciones) {
    if (t.condiciones) {
      reglas.push(`Regla de transición: ${t.nombre ?? 'sin nombre'} — condiciones: ${JSON.stringify(t.condiciones)}`);
    }
  }

  reglas.push('Regla de completitud documental (todos los obligatorios)');
  reglas.push('Regla de bloqueo por confianza baja');
  reglas.push('Regla de vencimiento de tareas');

  return reglas;
}

function detectarLoops(
  fases: typeof procedimientoFases.$inferSelect[],
  transiciones: typeof procedimientoTransiciones.$inferSelect[],
): string[] {
  const loops: string[] = [];
  const mapa = new Map<string, string[]>();

  for (const t of transiciones) {
    const desde = mapa.get(t.desdeFaseId) ?? [];
    desde.push(t.haciaFaseId);
    mapa.set(t.desdeFaseId, desde);
  }

  for (const [faseId, destinos] of mapa) {
    for (const destino of destinos) {
      if (mapa.get(destino)?.includes(faseId)) {
        const desde = fases.find((f) => f.id === faseId);
        const hacia = fases.find((f) => f.id === destino);
        loops.push(
          `Bucle detectado: ${desde?.nombre ?? 'desconocida'} ↔ ${hacia?.nombre ?? 'desconocida'}`,
        );
      }
    }
  }

  if (loops.length === 0) {
    loops.push('No se detectaron bucles en el grafo de transiciones');
  }

  return loops;
}
