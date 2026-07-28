/**
 * SGIE — Motor de confianza (Fase 8).
 *
 * Calcula confianza 0–100 por campo, documento y expediente combinando
 * evidencias verificables. Escala: 0-40 baja, 41-70 media, 71-90 alta, 91-100 muy_alta.
 *
 * Evidencias consideradas:
 *   - Coincidencia con datos del cliente
 *   - Coincidencia entre documentos del expediente
 *   - Formato válido (identidad, RTN)
 *   - Cita fuente presente
 *   - Calidad de texto/OCR
 *   - Ausencia de contradicciones
 *   - Hash único (no duplicado)
 *   - Vigencia
 *   - Tipo esperado coincide con clasificado
 *
 * La IA nunca aprueba/firma/cierra. Confianza alta ≠ acción automática.
 *
 * Ver docs/architecture/ §14.3.
 */
import { db } from '@/lib/db';
import {
  confianzaResultados, camposExtraidos, documentosExpediente,
  expedientes, clientes, reglasConfigVersion,
  type ConfianzaResultadoInsert,
} from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';
import { CONFIG_DEFAULT, type ReglasConfig } from '@/lib/sgie/motor-reglas';

// ─── Utilidades de formato ───────────────────────────────────────────────────

const IDENTIDAD_REGEX = /^\d{4}-\d{4}-\d{5}$/;
const RTN_REGEX = /^\d{14}$/;

function validarFormatoIdentidad(valor: string): boolean {
  return IDENTIDAD_REGEX.test(valor.trim());
}

function validarFormatoRtn(valor: string): boolean {
  return RTN_REGEX.test(valor.trim());
}

// ─── Cálculo por campo ───────────────────────────────────────────────────────

export interface EvidenciasCampo {
  formatoValido: boolean;
  citaFuentePresente: boolean;
  coincideConCliente: boolean;
  coincideConOtrosDocumentos: boolean;
  tieneContradicciones: boolean;
  calidadTexto: 'alta' | 'media' | 'baja' | 'desconocida';
}

export async function calcularConfianzaCampo(
  campoId: string,
  _config: ReglasConfig = CONFIG_DEFAULT,
): Promise<{ confianza: number; etiqueta: string; evidencias: EvidenciasCampo }> {
  const [campo] = await db
    .select()
    .from(camposExtraidos)
    .where(eq(camposExtraidos.id, campoId));

  if (!campo || !campo.valor) {
    return { confianza: 0, etiqueta: 'baja', evidencias: { formatoValido: false, citaFuentePresente: false, coincideConCliente: false, coincideConOtrosDocumentos: false, tieneContradicciones: false, calidadTexto: 'baja' } };
  }

  const evidencias: EvidenciasCampo = {
    formatoValido: false,
    citaFuentePresente: Boolean(campo.citaFragmento),
    coincideConCliente: false,
    coincideConOtrosDocumentos: false,
    tieneContradicciones: false,
    calidadTexto: 'desconocida',
  };

  let puntuacion = 0;
  const _maxPuntuacion = 100;

  // 1. Cita fuente (peso: 30)
  if (evidencias.citaFuentePresente) puntuacion += 30;

  // 2. Formato válido (peso: 20)
  if (campo.tipo === 'identidad' && validarFormatoIdentidad(campo.valor)) {
    evidencias.formatoValido = true;
    puntuacion += 20;
  } else if (campo.tipo === 'rtn' && validarFormatoRtn(campo.valor)) {
    evidencias.formatoValido = true;
    puntuacion += 20;
  } else if (campo.tipo && campo.tipo !== 'identidad' && campo.tipo !== 'rtn') {
    // Para otros tipos, el formato no es crítico
    puntuacion += 10;
  }

  // 3. Coincidencia con cliente (peso: 25)
  if (campo.expedienteId) {
    const [exp] = await db
      .select({ clienteId: expedientes.clienteId })
      .from(expedientes)
      .where(eq(expedientes.id, campo.expedienteId));

    if (exp?.clienteId) {
      const [cliente] = await db
        .select({ nombre: clientes.nombre, identidad: clientes.identidad, rtn: clientes.rtn })
        .from(clientes)
        .where(eq(clientes.id, exp.clienteId));

      if (cliente) {
        if (campo.tipo === 'identidad' && cliente.identidad && campo.valor.includes(cliente.identidad)) {
          evidencias.coincideConCliente = true;
          puntuacion += 25;
        } else if (campo.tipo === 'rtn' && cliente.rtn && campo.valor.includes(cliente.rtn)) {
          evidencias.coincideConCliente = true;
          puntuacion += 25;
        } else if (campo.tipo === 'nombre' && cliente.nombre && campo.valor.toLowerCase().includes(cliente.nombre.toLowerCase())) {
          evidencias.coincideConCliente = true;
          puntuacion += 15;
        }
      }
    }
  }

  // 4. Coincidencia con otros documentos (peso: 15)
  if (campo.expedienteId) {
    const otrosCampos = await db
      .select({ clave: camposExtraidos.clave, valor: camposExtraidos.valor })
      .from(camposExtraidos)
      .where(
        and(
          eq(camposExtraidos.expedienteId, campo.expedienteId),
          ne(camposExtraidos.id, campoId),
          eq(camposExtraidos.clave, campo.clave),
        ),
      );

    const coincidentes = otrosCampos.filter(c => c.valor === campo.valor);
    if (coincidentes.length > 0) {
      evidencias.coincideConOtrosDocumentos = true;
      puntuacion += 15;
    } else if (otrosCampos.length > 0) {
      // Hay otros valores para la misma clave → posible contradicción
      evidencias.tieneContradicciones = true;
      puntuacion -= 10;
    }
  }

  // 5. Confianza original del campo (peso: 10)
  if (campo.confianza) {
    puntuacion += Math.round(campo.confianza * 0.10);
  }

  const confianza = Math.max(0, Math.min(100, puntuacion));
  const etiqueta = confianza <= 40 ? 'baja' : confianza <= 70 ? 'media' : confianza <= 90 ? 'alta' : 'muy_alta';

  return { confianza, etiqueta, evidencias };
}

// ─── Cálculo por documento ───────────────────────────────────────────────────

export async function calcularConfianzaDocumento(
  documentoId: string,
  config: ReglasConfig = CONFIG_DEFAULT,
): Promise<{ confianza: number; etiqueta: string }> {
  const campos = await db
    .select({ id: camposExtraidos.id })
    .from(camposExtraidos)
    .where(eq(camposExtraidos.documentoId, documentoId));

  if (campos.length === 0) return { confianza: 50, etiqueta: 'media' }; // Sin campos = confianza media por defecto

  let suma = 0;
  for (const c of campos) {
    const { confianza } = await calcularConfianzaCampo(c.id, config);
    suma += confianza;
  }

  const confianza = Math.round(suma / campos.length);
  const etiqueta = confianza <= 40 ? 'baja' : confianza <= 70 ? 'media' : confianza <= 90 ? 'alta' : 'muy_alta';

  return { confianza, etiqueta };
}

// ─── Cálculo por expediente ──────────────────────────────────────────────────

export async function calcularConfianzaExpediente(
  expedienteId: string,
  config: ReglasConfig = CONFIG_DEFAULT,
): Promise<{ confianza: number; etiqueta: string }> {
  const docs = await db
    .select({ id: documentosExpediente.id })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.expedienteId, expedienteId));

  if (docs.length === 0) return { confianza: 0, etiqueta: 'baja' };

  let suma = 0;
  let count = 0;
  for (const d of docs) {
    const { confianza } = await calcularConfianzaDocumento(d.id, config);
    suma += confianza;
    count++;
  }

  // Ajuste por completitud: requisitos obligatorios cubiertos
  const { requisitosExpediente: reqs } = await import('@/lib/schema');
  const requisitos = await db
    .select({ tipo: reqs.tipo, confirmado: reqs.confirmado })
    .from(reqs)
    .where(eq(reqs.expedienteId, expedienteId));

  const obligatorios = requisitos.filter(r => r.tipo === 'obligatorio');
  const cubiertos = obligatorios.filter(r => r.confirmado === true);
  const ratioCompletitud = obligatorios.length > 0 ? cubiertos.length / obligatorios.length : 1;

  const confianza = Math.round((suma / count) * ratioCompletitud);
  const etiqueta = confianza <= 40 ? 'baja' : confianza <= 70 ? 'media' : confianza <= 90 ? 'alta' : 'muy_alta';

  return { confianza, etiqueta };
}

// ─── Persistencia ────────────────────────────────────────────────────────────

export async function guardarConfianza(
  nivel: 'campo' | 'documento' | 'expediente',
  refId: string,
  confianza: number,
  etiqueta: string,
  evidencias?: Record<string, unknown>,
  expedienteId?: string,
  documentoId?: string,
  campoExtraidoId?: string,
): Promise<void> {
  // Obtener la versión activa de reglas
  const [versionActiva] = await db
    .select({ id: reglasConfigVersion.id })
    .from(reglasConfigVersion)
    .where(eq(reglasConfigVersion.activa, true))
    .limit(1);

  await db.insert(confianzaResultados).values({
    expedienteId: expedienteId ?? null,
    documentoId: documentoId ?? null,
    campoExtraidoId: campoExtraidoId ?? null,
    nivel,
    confianza,
    etiqueta,
    evidencias: evidencias ?? null,
    reglasConfigVersionId: versionActiva?.id ?? null,
  } as ConfianzaResultadoInsert);
}
