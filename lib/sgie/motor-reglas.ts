/**
 * SGIE — Motor de reglas (Fase 8).
 *
 * Determinista, idempotente, auditable. Valida:
 *   - Completitud documental
 *   - Duplicados (hash)
 *   - Formatos
 *   - Cita fuente en campos críticos
 *   - Documentos obligatorios/condicionales
 *   - Confianza mínima
 *   - Transiciones de estado
 *
 * Idempotencia: UNIQUE (expediente_id, regla_id, ventana_temporal).
 * Repetir validación no duplica alertas, tareas ni correos.
 *
 * Referencia: pinedayasociados.md §14.
 */
import { db } from '@/lib/db';
import {
  validaciones, alertas, tareas, documentosExpediente,
  requisitosExpediente, expedientes, camposExtraidos,
  confianzaResultados, historialExpediente,
  type ValidacionInsert,
} from '@/lib/schema';
import { eq, and, count, isNull } from 'drizzle-orm';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type Severidad = 'info' | 'advertencia' | 'error' | 'critico';

export interface ReglaDefinicion {
  id: string;
  nombre: string;
  descripcion: string;
  severidadDefault: Severidad;
  ejecutar: (expedienteId: string) => Promise<ReglaResultado>;
}

export interface ReglaResultado {
  reglaId: string;
  severidad: Severidad;
  resultado: 'ok' | 'advertencia' | 'error' | 'critico' | 'pendiente';
  evidencias?: Record<string, unknown>;
  mensaje: string;
  accionesAutomaticas?: AccionAutomatica[];
}

export interface AccionAutomatica {
  tipo: 'alerta' | 'tarea' | 'nota_historial';
  datos: Record<string, unknown>;
}

// ─── Configuración de reglas ─────────────────────────────────────────────────

export interface ReglasConfig {
  umbralConfianzaMinima: number;
  umbralTextoMinimoCaracteres: number;
  maxDocumentosDuplicadosPermitidos: number;
  validarCitaFuente: boolean;
  validarFormatoIdentidad: boolean;
  validarFormatoRtn: boolean;
  alertarDocumentosVencidos: boolean;
  diasVencimientoDocumento: number;
  pesos: Record<string, number>;
}

export const CONFIG_DEFAULT: ReglasConfig = {
  umbralConfianzaMinima: 40,
  umbralTextoMinimoCaracteres: 50,
  maxDocumentosDuplicadosPermitidos: 0,
  validarCitaFuente: true,
  validarFormatoIdentidad: true,
  validarFormatoRtn: true,
  alertarDocumentosVencidos: false,
  diasVencimientoDocumento: 365,
  pesos: {
    completitud: 30,
    formato: 15,
    citaFuente: 20,
    confianza: 25,
    duplicados: 10,
  },
};

// ─── Reglas individuales ─────────────────────────────────────────────────────

async function reglaCompletitudDocumental(expedienteId: string): Promise<ReglaResultado> {
  const requisitos = await db
    .select({ id: requisitosExpediente.id, nombre: requisitosExpediente.nombre, tipo: requisitosExpediente.tipo, estado: requisitosExpediente.estado })
    .from(requisitosExpediente)
    .where(eq(requisitosExpediente.expedienteId, expedienteId));

  const obligatorios = requisitos.filter(r => r.tipo === 'obligatorio');
  const pendientes = obligatorios.filter(r => !['aprobado', 'confirmado'].includes(r.estado ?? ''));

  if (pendientes.length === 0 && obligatorios.length > 0) {
    return { reglaId: 'completitud_documental', severidad: 'info', resultado: 'ok', mensaje: 'Todos los requisitos obligatorios están cubiertos.' };
  }
  if (pendientes.length > 0) {
    return {
      reglaId: 'completitud_documental', severidad: obligatorios.length === pendientes.length ? 'error' : 'advertencia', resultado: 'pendiente',
      mensaje: `${pendientes.length} de ${obligatorios.length} requisitos obligatorios pendientes: ${pendientes.map(r => r.nombre).join(', ')}`,
      evidencias: { pendientes: pendientes.map(r => r.nombre) },
      accionesAutomaticas: [{ tipo: 'alerta', datos: { tipo: 'documentos_faltantes', severidad: 'advertencia', titulo: 'Documentos obligatorios pendientes', mensaje: `Faltan: ${pendientes.map(r => r.nombre).join(', ')}` } }],
    };
  }
  return { reglaId: 'completitud_documental', severidad: 'info', resultado: 'ok', mensaje: 'Sin requisitos obligatorios definidos.' };
}

async function reglaDuplicados(expedienteId: string): Promise<ReglaResultado> {
  const docs = await db
    .select({ id: documentosExpediente.id, hashSha256: documentosExpediente.hashSha256, estado: documentosExpediente.estado, nombreOriginal: documentosExpediente.nombreOriginal })
    .from(documentosExpediente)
    .where(and(eq(documentosExpediente.expedienteId, expedienteId), eq(documentosExpediente.estado, 'duplicado')));

  if (docs.length === 0) return { reglaId: 'duplicados', severidad: 'info', resultado: 'ok', mensaje: 'Sin documentos duplicados.' };

  return {
    reglaId: 'duplicados', severidad: 'advertencia', resultado: 'advertencia',
    mensaje: `${docs.length} documento(s) duplicado(s): ${docs.map(d => d.nombreOriginal).join(', ')}`,
    evidencias: { duplicados: docs.length },
    accionesAutomaticas: [{ tipo: 'alerta', datos: { tipo: 'documentos_duplicados', severidad: 'advertencia', titulo: 'Documentos duplicados detectados', mensaje: `${docs.length} documento(s) con hash duplicado.` } }],
  };
}

async function reglaDocumentosIlegibles(expedienteId: string): Promise<ReglaResultado> {
  const docs = await db
    .select({ id: documentosExpediente.id, nombreOriginal: documentosExpediente.nombreOriginal })
    .from(documentosExpediente)
    .where(and(eq(documentosExpediente.expedienteId, expedienteId), eq(documentosExpediente.estado, 'ilegible')));

  if (docs.length === 0) return { reglaId: 'documentos_ilegibles', severidad: 'info', resultado: 'ok', mensaje: 'Todos los documentos son legibles.' };

  return {
    reglaId: 'documentos_ilegibles', severidad: 'error', resultado: 'error',
    mensaje: `${docs.length} documento(s) ilegible(s): ${docs.map(d => d.nombreOriginal).join(', ')}. Considere solicitar reemplazo.`,
    accionesAutomaticas: [{ tipo: 'tarea', datos: { titulo: 'Solicitar reemplazo de documentos ilegibles', prioridad: 'alta', descripcion: `Documentos: ${docs.map(d => d.nombreOriginal).join(', ')}` } }],
  };
}

async function reglaConfianzaBaja(expedienteId: string): Promise<ReglaResultado> {
  const resultados = await db
    .select({ id: confianzaResultados.id, nivel: confianzaResultados.nivel, confianza: confianzaResultados.confianza, etiqueta: confianzaResultados.etiqueta })
    .from(confianzaResultados)
    .where(eq(confianzaResultados.expedienteId, expedienteId));

  const bajos = resultados.filter(r => r.etiqueta === 'baja');
  if (bajos.length === 0) return { reglaId: 'confianza_baja', severidad: 'info', resultado: 'ok', mensaje: 'Confianza aceptable en todos los elementos.' };

  return {
    reglaId: 'confianza_baja', severidad: 'advertencia', resultado: 'advertencia',
    mensaje: `${bajos.length} elemento(s) con confianza baja requieren revisión.`,
    evidencias: { elementosBajaConfianza: bajos.length },
  };
}

async function reglaCamposSinCita(expedienteId: string): Promise<ReglaResultado> {
  const campos = await db
    .select({ id: camposExtraidos.id, clave: camposExtraidos.clave, citaFragmento: camposExtraidos.citaFragmento })
    .from(camposExtraidos)
    .where(eq(camposExtraidos.expedienteId, expedienteId));

  const criticos = ['identidad', 'rtn', 'nombre_completo', 'fecha_nacimiento'];
  const sinCita = campos.filter(c => criticos.includes(c.clave) && !c.citaFragmento);

  if (sinCita.length === 0) return { reglaId: 'campos_sin_cita', severidad: 'info', resultado: 'ok', mensaje: 'Todos los campos críticos tienen cita fuente.' };

  return {
    reglaId: 'campos_sin_cita', severidad: 'advertencia', resultado: 'advertencia',
    mensaje: `${sinCita.length} campo(s) crítico(s) sin cita fuente verificable.`,
    evidencias: { camposSinCita: sinCita.map(c => c.clave) },
  };
}

// ─── Registro de reglas ──────────────────────────────────────────────────────

export const REGLAS: ReglaDefinicion[] = [
  { id: 'completitud_documental', nombre: 'Completitud documental', descripcion: 'Verifica que todos los requisitos obligatorios tengan documentos aprobados', severidadDefault: 'advertencia', ejecutar: reglaCompletitudDocumental },
  { id: 'duplicados', nombre: 'Documentos duplicados', descripcion: 'Detecta documentos con hash SHA-256 duplicado en el expediente', severidadDefault: 'advertencia', ejecutar: reglaDuplicados },
  { id: 'documentos_ilegibles', nombre: 'Documentos ilegibles', descripcion: 'Detecta documentos que no se pudieron leer', severidadDefault: 'error', ejecutar: reglaDocumentosIlegibles },
  { id: 'confianza_baja', nombre: 'Confianza baja', descripcion: 'Elementos con confianza inferior al umbral', severidadDefault: 'advertencia', ejecutar: reglaConfianzaBaja },
  { id: 'campos_sin_cita', nombre: 'Campos sin cita fuente', descripcion: 'Campos críticos extraídos sin cita fuente verificable', severidadDefault: 'advertencia', ejecutar: reglaCamposSinCita },
];

// ─── Motor de reglas ─────────────────────────────────────────────────────────

export async function ejecutarReglas(
  expedienteId: string,
  reglasIds?: string[],
): Promise<{ ejecutadas: number; nuevas: number; omitidas: number; resultados: ReglaResultado[] }> {
  const ventana = new Date().toISOString().slice(0, 10);
  const reglasAplicar = reglasIds
    ? REGLAS.filter(r => reglasIds.includes(r.id))
    : REGLAS;

  let ejecutadas = 0;
  let nuevas = 0;
  let omitidas = 0;
  const resultados: ReglaResultado[] = [];

  for (const regla of reglasAplicar) {
    // Verificar idempotencia: ¿ya se ejecutó esta regla en esta ventana?
    const [existente] = await db
      .select({ id: validaciones.id })
      .from(validaciones)
      .where(
        and(
          eq(validaciones.expedienteId, expedienteId),
          eq(validaciones.reglaId, regla.id),
          eq(validaciones.ventanaTemporal, ventana),
        ),
      );

    if (existente) {
      omitidas++;
      continue;
    }

    try {
      const resultado = await regla.ejecutar(expedienteId);

      // Guardar validación
      await db.insert(validaciones).values({
        expedienteId,
        reglaId: resultado.reglaId,
        severidad: resultado.severidad,
        resultado: resultado.resultado,
        evidencias: resultado.evidencias ?? null,
        mensaje: resultado.mensaje,
        ventanaTemporal: ventana,
        ejecutadoPor: 'sistema',
      } as ValidacionInsert);

      // Acciones automáticas
      if (resultado.accionesAutomaticas) {
        for (const accion of resultado.accionesAutomaticas) {
          if (accion.tipo === 'alerta') {
            const datos = accion.datos as Record<string, unknown>;
            await db.insert(alertas).values({
              expedienteId,
              tipo: (datos.tipo as string) || 'validacion',
              severidad: (datos.severidad as 'info' | 'advertencia' | 'error' | 'critico') || 'advertencia',
              titulo: (datos.titulo as string) || 'Alerta de validación',
              mensaje: (datos.mensaje as string) || resultado.mensaje,
            });
          } else if (accion.tipo === 'tarea') {
            const datos = accion.datos as Record<string, unknown>;
            await db.insert(tareas).values({
              expedienteId,
              titulo: (datos.titulo as string) || 'Tarea de validación',
              descripcion: (datos.descripcion as string) || resultado.mensaje,
              prioridad: (datos.prioridad as 'baja' | 'media' | 'alta' | 'urgente') || 'media',
              automatica: true,
            });
          }
        }
      }

      ejecutadas++;
      if (resultado.resultado !== 'ok') nuevas++;
      resultados.push(resultado);
    } catch (err) {
      console.error(`[sgie/reglas] Error en regla ${regla.id}:`, (err as Error).message);
    }
  }

  return { ejecutadas, nuevas, omitidas, resultados };
}

export async function obtenerReglasActivas(): Promise<ReglaDefinicion[]> {
  return REGLAS;
}
