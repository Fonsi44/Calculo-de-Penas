/**
 * SGIE — Resumen IA de expediente validado (Sprint 4, tarea 1).
 *
 * Genera un resumen del expediente usando SÓLO datos existentes (resumen,
 * campos extraídos, documentos clasificados, estados, alertas, inconsistencias).
 * Cumple R17: prompt restrictivo (prohíbe inventar datos legales), output
 * validado, fallback seguro si no hay proveedor IA.
 *
 * Caché en `resumenes_ia_expediente` con `hash_entrada` para invalidar cuando
 * cambien los datos fuente. La IA nunca aprueba/firma/cierra/cambia estados.
 *
 * Sprint 4.
 */
import { createHash } from 'crypto';
import { getIaConfig, isIaEnabled } from './ia-documental';

export interface DatosResumenInput {
  numeroInterno: string;
  estado: string;
  clienteNombre: string | null;
  procedimientoNombre: string | null;
  resumen: string | null;
  documentos: Array<{ nombre: string; tipo: string | null; confianza: number }>;
  campos: Array<{ clave: string; valor: string | null; confianza: number | null }>;
  alertasActivas: number;
  inconsistencias: Array<{ clave: string; valores: string[] }>;
}

/**
 * Serializa los datos fuente a un texto determinista para el prompt de la IA.
 * Función pura — testeable sin DB ni IA.
 */
export function serializarDatosParaResumen(d: DatosResumenInput): string {
  const partes: string[] = [];
  partes.push(`Expediente: ${d.numeroInterno}`);
  partes.push(`Estado: ${d.estado}`);
  if (d.clienteNombre) partes.push(`Cliente: ${d.clienteNombre}`);
  if (d.procedimientoNombre) partes.push(`Procedimiento: ${d.procedimientoNombre}`);
  if (d.resumen) partes.push(`Resumen del expediente: ${d.resumen}`);

  if (d.documentos.length > 0) {
    partes.push('\nDocumentos clasificados:');
    for (const doc of d.documentos.slice(0, 15)) {
      partes.push(`- ${doc.nombre} (${doc.tipo ?? 'sin tipo'}, confianza ${doc.confianza})`);
    }
  }

  if (d.campos.length > 0) {
    partes.push('\nCampos extraídos:');
    for (const c of d.campos.slice(0, 20)) {
      partes.push(`- ${c.clave}: ${c.valor ?? '—'} (confianza ${c.confianza ?? '?'})`);
    }
  }

  if (d.alertasActivas > 0) partes.push(`\nAlertas activas: ${d.alertasActivas}`);

  if (d.inconsistencias.length > 0) {
    partes.push('\nInconsistencias detectadas:');
    for (const inc of d.inconsistencias) {
      partes.push(`- ${inc.clave}: ${inc.valores.join(' vs ')}`);
    }
  }

  return partes.join('\n');
}

/**
 * Calcula el hash de la entrada (datos fuente). Si cambia, el caché se invalida.
 * Función pura.
 */
export function calcularHashEntrada(d: DatosResumenInput): string {
  return createHash('sha256').update(serializarDatosParaResumen(d)).digest('hex');
}

/**
 * Prompt del sistema restrictivo (R17). Prohíbe inventar datos legales,
 * conclusiones, penas, artículos o hechos no presentes en los datos.
 */
export function buildSystemPromptResumen(): string {
  return [
    'Eres un asistente que resume expedientes jurídicos para abogados de Honduras.',
    'REGLAS VINCULANTES:',
    '1. Usa EXCLUSIVAMENTE la información proporcionada. NO inventes datos.',
    '2. NO cites artículos, penas, jurisprudencia ni plazos legales que no estén en los datos.',
    '3. NO emitas conclusiones legales ni recomendaciones de decisión.',
    '4. NO apruebes, valides ni sugieras cerrar/abrir/firmar el expediente.',
    '5. Si faltan datos, indícalo con "Información no disponible".',
    '6. Máximo 250 palabras. Español claro y profesional.',
    '7. Estructura: Estado actual · Documentación · Datos clave · Incidencias.',
  ].join('\n');
}

/**
 * Llama al proveedor IA para generar el resumen. Reutiliza la configuración de
 * `ia-documental`. Devuelve resultado tipado o error.
 */
export async function generarResumenIa(
  datos: DatosResumenInput,
): Promise<
  | { ok: true; resumen: string; proveedor: string; modelo: string; tokensInput?: number; tokensOutput?: number; confianza: number }
  | { ok: false; error: string; codigo: 'ia_deshabilitada' | 'sin_api_key' | 'error_proveedor' | 'respuesta_vacia' }
> {
  const cfg = getIaConfig();

  if (cfg.mode === 'disabled') {
    return { ok: false, error: 'IA deshabilitada por configuración', codigo: 'ia_deshabilitada' };
  }
  if (!isIaEnabled()) {
    return { ok: false, error: 'Proveedor IA no configurado (falta API key o modo no es "ai")', codigo: 'sin_api_key' };
  }

  const systemPrompt = buildSystemPromptResumen();
  const userPrompt = [
    'Resume el siguiente expediente según las reglas. NO añadas información que no esté aquí.',
    '',
    serializarDatosParaResumen(datos),
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 150)}`, codigo: 'error_proveedor' };
    }

    const data = await res.json();
    const contenido = data?.choices?.[0]?.message?.content;
    if (!contenido || typeof contenido !== 'string' || contenido.trim().length < 10) {
      return { ok: false, error: 'Respuesta IA vacía o inválida', codigo: 'respuesta_vacia' };
    }

    const resumen = contenido.trim().slice(0, 2000);
    return {
      ok: true,
      resumen,
      proveedor: cfg.provider,
      modelo: cfg.model,
      tokensInput: data?.usage?.prompt_tokens,
      tokensOutput: data?.usage?.completion_tokens,
      confianza: 80, // confianza base; el motor de confianza real vive en motor-confianza
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { ok: false, error: msg, codigo: 'error_proveedor' };
  }
}
