/**
 * SGIE — Capa IA documental configurable (Fase 7).
 *
 * Proveedor intercambiable vía variables de entorno. Modos:
 *   - `disabled`: no llama a IA, todo pendiente_abogado.
 *   - `heuristic`: solo clasificación/extracción local (Fase 6).
 *   - `ai`: heurística + DeepSeek si la confianza es baja.
 *
 * Un documento por llamada, un expediente por contexto, sin memoria
 * cruzada. Prompt restrictivo: prohibido inventar datos legales.
 * JSON estricto validado por Zod. Cita fuente obligatoria en campos
 * críticos. Fallo → `pendiente_abogado`.
 *
 * Referencia: pinedayasociados.md §13.
 */
import { z } from 'zod';
import { db } from '@/lib/db';
import { extraccionesIa, documentosExpediente, alertas, camposExtraidos } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// ─── Configuración desde entorno ─────────────────────────────────────────────

interface IaConfig {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  mode: 'disabled' | 'heuristic' | 'ai';
  timeoutMs: number;
  maxRetries: number;
}

export function getIaConfig(): IaConfig {
  return {
    provider: process.env.IA_DOCUMENTAL_PROVIDER || 'deepseek',
    model: process.env.IA_DOCUMENTAL_MODEL || 'deepseek-chat',
    baseUrl: process.env.IA_DOCUMENTAL_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.IA_DOCUMENTAL_API_KEY || '',
    mode: (process.env.IA_DOCUMENTAL_MODE as IaConfig['mode']) || 'heuristic',
    timeoutMs: parseInt(process.env.IA_DOCUMENTAL_TIMEOUT_MS || '60000', 10),
    maxRetries: parseInt(process.env.IA_DOCUMENTAL_MAX_RETRIES || '2', 10),
  };
}

export function isIaEnabled(): boolean {
  const cfg = getIaConfig();
  return cfg.mode === 'ai' && cfg.apiKey.length > 10;
}

export function isIaDisabled(): boolean {
  return getIaConfig().mode === 'disabled';
}

// ─── Esquema Zod del output IA ───────────────────────────────────────────────

export const campoExtraidoSchema = z.object({
  clave: z.string().min(1).max(100),
  valor: z.string().nullable(),
  tipo: z.enum(['texto', 'fecha', 'numero', 'identidad', 'rtn', 'nombre', 'direccion', 'telefono', 'email', 'booleano']),
  confianza: z.number().int().min(0).max(100),
  cita_fuente: z.string().nullable(),
  observaciones: z.string().nullable(),
});

export const iaOutputSchema = z.object({
  tipo_documento: z.string().min(1).max(100),
  confianza_tipo: z.number().int().min(0).max(100),
  campos: z.array(campoExtraidoSchema).max(50),
  alertas_sugeridas: z.array(z.object({
    tipo: z.string().min(1).max(100),
    severidad: z.enum(['info', 'advertencia', 'error', 'critico']),
    titulo: z.string().min(1).max(300),
    mensaje: z.string().max(1000),
  })).max(10),
  resumen_descriptivo: z.string().max(1000).nullable(),
  proximos_pasos_sugeridos: z.string().max(500).nullable(),
});

export type IaOutput = z.infer<typeof iaOutputSchema>;

// ─── Interacción con DeepSeek ────────────────────────────────────────────────

function calcularPromptHash(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function buildSystemPrompt(): string {
  return `Eres un asistente jurídico estricto. Analizas documentos legales de Honduras.

REGLAS OBLIGATORIAS:
1. Prohibido inventar datos legales, artículos, penas, fechas, nombres o métricas que no estén explícitamente en el texto.
2. Si un dato no está en el documento, usa null, nunca inventes.
3. En campos críticos (identidad, RTN, nombres, fechas) cita el fragmento exacto del texto como cita_fuente.
4. Solo clasificas entre: identidad, rtn, acta, poder, contrato, constancia, demanda, sentencia, documento_personal, comprobante, otro.
5. La confianza refleja cuán seguro estás del dato (no del formato): 0 = no hay evidencia, 100 = certeza absoluta con evidencia textual.
6. Responde SIEMPRE en JSON válido, sin texto fuera del JSON.`;
}

function buildUserPrompt(documentInfo: {
  nombreOriginal: string;
  tipoMime: string;
  textoExtraido: string;
  tipoHeuristico?: string;
  confianzaHeuristica?: number;
  clasificacionHeuristica?: Record<string, unknown>;
}): string {
  const partes = [
    `Documento: "${documentInfo.nombreOriginal}"`,
    `Tipo MIME: ${documentInfo.tipoMime}`,
  ];
  if (documentInfo.tipoHeuristico) {
    partes.push(`Clasificación heurística previa: ${documentInfo.tipoHeuristico} (confianza ${documentInfo.confianzaHeuristica ?? '?'}%)`);
  }
  partes.push(`\nTEXTO EXTRAÍDO:\n${documentInfo.textoExtraido.slice(0, 8000)}`);
  partes.push('\nExtrae los campos en JSON según el esquema. Solo datos presentes en el texto.');
  return partes.join('\n');
}

export async function llamarIaDocumental(
  textoExtraido: string,
  documentInfo: { nombreOriginal: string; tipoMime: string; tipoHeuristico?: string; confianzaHeuristica?: number },
): Promise<{ ok: true; output: IaOutput; tokensInput?: number; tokensOutput?: number; duracionMs: number; promptHash?: string }
  | { ok: false; error: string; duracionMs: number }> {
  const cfg = getIaConfig();
  const t0 = Date.now();

  if (cfg.mode === 'disabled') {
    return { ok: false, error: 'IA deshabilitada por configuración', duracionMs: Date.now() - t0 };
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({ ...documentInfo, textoExtraido });
  const _promptHash = calcularPromptHash(systemPrompt + userPrompt);

  let lastError = '';

  for (let intento = 0; intento <= cfg.maxRetries; intento++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);

      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        lastError = `HTTP ${res.status}: ${errText.slice(0, 200)}`;
        if (res.status === 429 || res.status >= 500) continue; // reintentar
        return { ok: false, error: lastError, duracionMs: Date.now() - t0 };
      }

      const data = await res.json();
      const contenido = data?.choices?.[0]?.message?.content;
      if (!contenido) {
        lastError = 'Respuesta IA sin contenido';
        continue;
      }

      // Parsear JSON (puede venir con markdown fences)
      let parsed: unknown;
      const limpio = contenido.replace(/```(?:json)?\s*|\s*```/g, '').trim();
      try {
        parsed = JSON.parse(limpio);
      } catch {
        lastError = 'Respuesta IA no es JSON válido';
        continue;
      }

      // Validar con Zod
      const resultado = iaOutputSchema.safeParse(parsed);
      if (!resultado.success) {
        lastError = `Validación Zod fallida: ${resultado.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; ')}`;
        continue;
      }

      return {
        ok: true,
        output: resultado.data,
        tokensInput: data.usage?.prompt_tokens,
        tokensOutput: data.usage?.completion_tokens,
        duracionMs: Date.now() - t0,
      };
    } catch (err) {
      lastError = (err as Error).message;
      if ((err as Error).name === 'AbortError') {
        lastError = `Timeout (${cfg.timeoutMs}ms)`;
      }
      // Reintentar en errores de red
    }
  }

  return { ok: false, error: lastError || 'Máximos reintentos alcanzados', duracionMs: Date.now() - t0 };
}

// ─── Orquestador IA ──────────────────────────────────────────────────────────

export interface ProcesarIaResult {
  documentoId: string;
  exito: boolean;
  estadoFinal: string;
  modo: string;
  camposExtraidos: number;
  alertasSugeridas: number;
  error?: string;
  duracionMs: number;
  tokensInput?: number;
  tokensOutput?: number;
}

export async function procesarDocumentoConIa(
  documentoId: string,
  textoExtraido: string,
  clasificacionHeuristica?: { tipoDocumento: string; confianza: number },
): Promise<ProcesarIaResult> {
  const cfg = getIaConfig();
  const t0 = Date.now();

  // Cargar documento
  const [doc] = await db
    .select({ nombreOriginal: documentosExpediente.nombreOriginal, tipoMime: documentosExpediente.tipoMime })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId));

  if (!doc) {
    return { documentoId, exito: false, estadoFinal: 'error', modo: cfg.mode, camposExtraidos: 0, alertasSugeridas: 0, error: 'Documento no encontrado', duracionMs: Date.now() - t0 };
  }

  // Modo disabled: no hacer nada
  if (cfg.mode === 'disabled') {
    await db.update(documentosExpediente)
      .set({ estado: 'pendiente_abogado', procesadoEn: new Date() })
      .where(eq(documentosExpediente.id, documentoId));
    return { documentoId, exito: true, estadoFinal: 'pendiente_abogado', modo: 'disabled', camposExtraidos: 0, alertasSugeridas: 0, duracionMs: Date.now() - t0 };
  }

  // Modo heuristic: ya procesado en Fase 6
  if (cfg.mode === 'heuristic') {
    return { documentoId, exito: true, estadoFinal: 'texto_extraido', modo: 'heuristic', camposExtraidos: 0, alertasSugeridas: 0, duracionMs: Date.now() - t0 };
  }

  // Modo ai: llamar a DeepSeek solo si la confianza heurística es baja o no hay clasificación
  if (cfg.mode === 'ai') {
    const necesitaIa = !clasificacionHeuristica || clasificacionHeuristica.confianza < 60 || !textoExtraido;

    if (!necesitaIa) {
      // Confianza alta: no llamar IA, ya está bien clasificado
      await db.update(documentosExpediente)
        .set({ estado: 'ia_procesada', procesadoEn: new Date() })
        .where(eq(documentosExpediente.id, documentoId));
      return { documentoId, exito: true, estadoFinal: 'ia_procesada', modo: 'ai', camposExtraidos: 0, alertasSugeridas: 0, duracionMs: Date.now() - t0 };
    }

    // Llamar IA
    const resultado = await llamarIaDocumental(textoExtraido, {
      nombreOriginal: doc.nombreOriginal,
      tipoMime: doc.tipoMime,
      tipoHeuristico: clasificacionHeuristica?.tipoDocumento,
      confianzaHeuristica: clasificacionHeuristica?.confianza,
    });

    // Registrar extracción (éxito o fallo)
    const [extraccion] = await db.insert(extraccionesIa).values({
      documentoId,
      proveedor: cfg.provider,
      modelo: cfg.model,
      promptHash: resultado.ok ? undefined : undefined,
      tokensInput: resultado.ok ? resultado.tokensInput ?? null : null,
      tokensOutput: resultado.ok ? resultado.tokensOutput ?? null : null,
      duracionMs: resultado.duracionMs,
      exito: resultado.ok,
      error: resultado.ok ? null : resultado.error,
      resultadoJson: resultado.ok ? resultado.output as unknown as Record<string, unknown> : null,
    }).returning({ id: extraccionesIa.id });

    if (!resultado.ok) {
      await db.update(documentosExpediente)
        .set({ estado: 'pendiente_abogado', procesadoEn: new Date() })
        .where(eq(documentosExpediente.id, documentoId));
      return { documentoId, exito: false, estadoFinal: 'pendiente_abogado', modo: 'ai', camposExtraidos: 0, alertasSugeridas: 0, error: resultado.error, duracionMs: resultado.duracionMs };
    }

    // Guardar campos extraídos
    const output = resultado.output;
    let camposGuardados = 0;

    for (const campo of output.campos) {
      try {
        await db.insert(camposExtraidos).values({
          documentoId,
          expedienteId: (await db.select({ eid: documentosExpediente.expedienteId }).from(documentosExpediente).where(eq(documentosExpediente.id, documentoId)))[0]?.eid ?? '',
          clave: campo.clave,
          valor: campo.valor,
          tipo: campo.tipo,
          confianza: campo.confianza,
          citaFragmento: campo.cita_fuente,
          observaciones: campo.observaciones,
        });
        camposGuardados++;
      } catch { /* skip individual field errors */ }
    }

    // Guardar alertas sugeridas
    let alertasGuardadas = 0;
    for (const alerta of output.alertas_sugeridas) {
      try {
        await db.insert(alertas).values({
          expedienteId: (await db.select({ eid: documentosExpediente.expedienteId }).from(documentosExpediente).where(eq(documentosExpediente.id, documentoId)))[0]?.eid ?? '',
          documentoId,
          tipo: alerta.tipo,
          severidad: alerta.severidad,
          titulo: alerta.titulo,
          mensaje: alerta.mensaje,
        });
        alertasGuardadas++;
      } catch { /* skip */ }
    }

    // Actualizar estado
    await db.update(documentosExpediente)
      .set({
        estado: 'ia_procesada',
        tipoDocumento: output.tipo_documento || clasificacionHeuristica?.tipoDocumento,
        procesadoEn: new Date(),
        metadata: {
          iaResumen: output.resumen_descriptivo,
          iaProximosPasos: output.proximos_pasos_sugeridos,
          iaConfianza: output.confianza_tipo,
          iaExtraccionId: extraccion?.id,
        },
      } as never)
      .where(eq(documentosExpediente.id, documentoId));

    return {
      documentoId,
      exito: true,
      estadoFinal: 'ia_procesada',
      modo: 'ai',
      camposExtraidos: camposGuardados,
      alertasSugeridas: alertasGuardadas,
      duracionMs: resultado.duracionMs,
      tokensInput: resultado.tokensInput,
      tokensOutput: resultado.tokensOutput,
    };
  }

  return { documentoId, exito: false, estadoFinal: 'pendiente_abogado', modo: cfg.mode, camposExtraidos: 0, alertasSugeridas: 0, error: 'Modo no soportado', duracionMs: Date.now() - t0 };
}
