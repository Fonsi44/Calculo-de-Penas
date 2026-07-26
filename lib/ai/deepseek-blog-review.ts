/**
 * DeepSeek Blog Review — Módulo de análisis jurídico con DeepSeek V4 Pro
 *
 * Capa B del proceso Fase 3. Recibe evidencia de Google Search (Capa A)
 * y analiza claims jurídicos contra fuentes oficiales.
 *
 * Configuración: DEEPSEEK_API_KEY en .env.local
 * Modelo: deepseek-chat (DeepSeek V3/V4 Pro — endpoint unificado)
 */

import type { SourceProvenanceCount } from './source-provenance';
import { countSourcesByProvenance } from './source-provenance';

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 120_000;

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('DEEPSEEK_API_KEY no configurada. Revisa .env.local');
  }
  return key;
}

export const DEEPSEEK_MODEL = 'deepseek-v4-pro';

export interface OfficialSource {
  institution: string;
  title: string;
  url: string;
  law?: string;
  article?: string;
  publishedAt?: string;
  consultedAt: string;
  /**
   * Clasificación de procedencia (Fase 3C).
   * Si no se especifica, se clasifica heurísticamente con
   * classifySourceProvenance(url, institution).
   * Ver lib/ai/source-provenance.ts.
   */
  provenance?: import('./source-provenance').SourceProvenance;
}

export interface GoogleEvidence {
  claims: string[];
  searchQueries: string[];
  officialSourcesOpened: OfficialSource[];
  sourceExcerpts: string;
}

export interface ClaimAnalysis {
  claim: string;
  classification:
    | 'confirmed'
    | 'confirmed_with_context'
    | 'incorrect'
    | 'outdated'
    | 'unsupported'
    | 'ambiguous'
    | 'requires_human_judgment';
  jurisdiction: 'HN' | 'ES' | 'HN_ES' | 'general';
  officialSource?: {
    institution: string;
    title: string;
    url: string;
    law?: string;
    article?: string;
    publishedAt?: string;
    consultedAt: string;
    /** Clasificación de procedencia (Fase 3C). */
    provenance?: import('./source-provenance').SourceProvenance;
  };
  sourceExcerptSummary: string;
  analysisProvider: string;
  analysisModel: string;
  confidence: 'high' | 'medium' | 'low';
  originalText: string;
  correctedText: string;
  correctionReason: string;
  requiresHumanReview: boolean;
}

export interface DeepSeekReviewOutput {
  claims: ClaimAnalysis[];
  summary: string;
  overallConfidence: 'high' | 'medium' | 'low';
}

const SYSTEM_PROMPT = `Eres un auditor jurídico experto en derecho hondureño. Tu tarea es analizar afirmaciones jurídicas de artículos de blog comparándolas con evidencia de fuentes oficiales.

Reglas estrictas:
1. Solo puedes confirmar un claim si la evidencia proporcionada incluye una fuente oficial verificable (ley, decreto, artículo, institución oficial de Honduras).
2. Un claim NO puede ser 'confirmed' si:
   - No tiene fuente oficial adjunta
   - La URL no fue abierta/consultada
   - Solo hay un snippet de búsqueda
   - La fuente no contiene el dato específico
   - La norma no está vigente
   - La fuente pertenece a otra jurisdicción
   - El artículo concreto no coincide
3. Si la evidencia es insuficiente, clasifica como 'unsupported' o 'ambiguous'.
4. NUNCA inventes fuentes, artículos o leyes.
5. NUNCA uses conocimiento interno para confirmar algo sin evidencia.
6. Las correcciones deben ser prudentes y conservar la intención original.
7. Jurisdicción: HN (Honduras), ES (España), HN_ES (ambas), general.

Responde ÚNICAMENTE con JSON válido con esta estructura exacta:
{
  "claims": [
    {
      "claim": "texto de la afirmación original",
      "classification": "confirmed|confirmed_with_context|incorrect|outdated|unsupported|ambiguous|requires_human_judgment",
      "jurisdiction": "HN|ES|HN_ES|general",
      "officialSource": {
        "institution": "",
        "title": "",
        "url": "",
        "law": "",
        "article": "",
        "publishedAt": "",
        "consultedAt": ""
      },
      "sourceExcerptSummary": "",
      "analysisProvider": "DeepSeek",
      "analysisModel": "${DEEPSEEK_MODEL}",
      "confidence": "high|medium|low",
      "originalText": "",
      "correctedText": "",
      "correctionReason": "",
      "requiresHumanReview": false
    }
  ],
  "summary": "resumen del análisis",
  "overallConfidence": "high|medium|low"
}`;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callDeepSeek(
  messages: Array<{ role: string; content: string }>,
  attempt: number = 1,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429 && attempt <= MAX_RETRIES) {
        console.warn(`  ⚠️ Rate limit (429). Reintento ${attempt}/${MAX_RETRIES}...`);
        await sleep(RETRY_DELAY_MS * attempt);
        return callDeepSeek(messages, attempt + 1);
      }
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content || content.trim().length === 0) {
      throw new Error('DeepSeek: respuesta vacía');
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function validateAndParseJSON(raw: string): DeepSeekReviewOutput {
  let jsonStr = raw.trim();

  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?/g, '').replace(/```/g, '').trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('DeepSeek: respuesta no es JSON válido');
  }

  const obj = parsed as Record<string, unknown>;

  if (!obj.claims || !Array.isArray(obj.claims)) {
    throw new Error('DeepSeek: respuesta no contiene array "claims"');
  }

  // === Fase 3B: validación semántica de claims confirmados ===
  // Un claim confirmado SIN officialSource.url no puede considerarse confirmado:
  // se degrada a 'unsupported' para impedir marcado falso de confianza.
  // Esto ataca el defecto "confirmed claim with empty url still passes".
  const claims = obj.claims as Record<string, unknown>[];
  for (let i = 0; i < claims.length; i++) {
    const c = claims[i];
    if (!c.claim || !c.classification) {
      throw new Error(
        `DeepSeek: claim ${i} incompleto (falta claim o classification)`,
      );
    }
    const classification = String(c.classification);
    const isConfirmed =
      classification === 'confirmed' ||
      classification === 'confirmed_with_context';
    const url = String(
      (c.officialSource as Record<string, unknown> | undefined)?.url || '',
    ).trim();
    if (isConfirmed && !url) {
      // Degradar: un confirmed sin URL verificable no es confirmable
      c.classification = 'unsupported';
      c.requiresHumanReview = true;
      if (!c.correctionReason) {
        c.correctionReason =
          'Degradado a unsupported: confirmed sin officialSource.url verificable (validación semántica Fase 3B)';
      }
    }
  }

  return obj as unknown as DeepSeekReviewOutput;
}

/**
 * Cuenta fuentes oficiales ÚNICAS por URL (no repetidas) en el output.
 * Fase 3B: evita inflar ai_official_sources_count cuando una misma fuente
 * se cita en varios claims.
 *
 * NOTA (Fase 3C): esta función cuenta TODAS las URLs únicas, sin distinguir
 * procedencia. Para el conteo honesto que diferencia oficiales vs.
 * institucionales/internas, usar countOfficialSourcesByProvenance().
 * Esta se conserva por compatibilidad con tests y scripts existentes.
 */
export function countUniqueOfficialSources(
  output: DeepSeekReviewOutput,
): number {
  const urls = new Set<string>();
  for (const c of output.claims) {
    const url = c.officialSource?.url?.trim();
    if (url) urls.add(url);
  }
  return urls.size;
}

/**
 * Cuenta fuentes ÚNICAS por procedencia (Fase 3C).
 *
 * Devuelve el desglose completo y el total de fuentes oficiales reales
 * (solo official_primary + official_secondary). Esto corrige la semántica
 * de countUniqueOfficialSources, que contaba cualquier URL como oficial.
 *
 * Deduplica por URL normalizada (ver normalizeSourceForDedup).
 * No realiza llamadas externas: solo clasifica heurísticamente.
 */
export function countOfficialSourcesByProvenance(
  output: DeepSeekReviewOutput,
): SourceProvenanceCount {
  return countSourcesByProvenance(
    output.claims
      .filter((c) => c.officialSource?.url)
      .map((c) => ({
        url: c.officialSource!.url,
        provenance: c.officialSource!.provenance,
        institution: c.officialSource!.institution,
      })),
  );
}

export interface ReviewArticleInput {
  title: string;
  body: string;
  slug: string;
  extractedClaims: string[];
  evidence: GoogleEvidence;
}

export async function reviewArticle(
  input: ReviewArticleInput,
): Promise<DeepSeekReviewOutput> {
  const evidenceJson = JSON.stringify(
    {
      claims: input.extractedClaims,
      searchQueries: input.evidence.searchQueries,
      officialSourcesOpened: input.evidence.officialSourcesOpened,
      sourceExcerpts: input.evidence.sourceExcerpts,
    },
    null,
    2,
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const content = await callDeepSeek([
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analiza el siguiente artículo jurídico de Honduras contrastándolo con la evidencia de fuentes oficiales proporcionada.\n\nARTÍCULO:\nTítulo: ${input.title}\nSlug: ${input.slug}\nContenido:\n${input.body.substring(0, 25000)}\n\nEVIDENCIA DE FUENTES OFICIALES:\n${evidenceJson}`,
        },
      ]);

      const result = validateAndParseJSON(content);

      console.log(`  ✅ DeepSeek: ${result.claims.length} claims analizados.`);

      return result;
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`  ❌ DeepSeek intento ${attempt}: ${err.message}`);
      if (attempt === MAX_RETRIES) {
        throw new Error(`DeepSeek: falló después de ${MAX_RETRIES} intentos: ${err.message}`);
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error('DeepSeek: unreachable');
}

export function getProviderInfo() {
  return {
    provider: 'DeepSeek',
    model: DEEPSEEK_MODEL,
    baseUrl: DEEPSEEK_BASE_URL,
  };
}
