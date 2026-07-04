/**
 * Motor de embeddings para el sistema RAG.
 *
 * Implementa la generación de embeddings vectoriales usando DeepSeek
 * (modelo deepseek-embedding, 1536 dimensiones) y la búsqueda por
 * similitud coseno en Neon (pgvector).
 *
 * INTERFAZ PÚBLICA (compatible con el scaffold anterior en lib/sgie/embeddings.ts):
 *   - isEmbeddingsDisponible()
 *   - generarEmbedding(texto)
 *   - buscarPorSimilitud(vector, k, scopeIds?)
 *
 * USO (servidor/scripts):
 *   import { generarEmbedding, buscarPorSimilitud } from '@/lib/rag/embeddings';
 */

import OpenAI from 'openai';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { getRagConfig, type EntidadTipo } from './config';

// ═══════════════════════════════════════════════════════════════════════════
//  Cliente OpenAI compatible con DeepSeek
// ═══════════════════════════════════════════════════════════════════════════

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!getRagConfig().apiKey) {
      throw new Error(
        'Embeddings no disponibles: configure EMBEDDINGS_API_KEY o DEEPSEEK_API_KEY en .env.local',
      );
    }
    _client = new OpenAI({
      apiKey: getRagConfig().apiKey,
      baseURL: getRagConfig().baseUrl,
    });
  }
  return _client;
}

/**
 * ¿Está la infraestructura de embeddings disponible?
 * Requiere: API key configurada en env.
 */
export function isEmbeddingsDisponible(): boolean {
  return Boolean(getRagConfig().apiKey);
}

/**
 * Genera el embedding de un texto usando el modelo configurado (deepseek-embedding).
 *
 * @param texto - Texto a embeber (máx ~8192 tokens recomendado por DeepSeek)
 * @returns Array de números (vector de 1536 dimensiones)
 */
export async function generarEmbedding(texto: string): Promise<number[]> {
  const client = getClient();
  // Limitar longitud para evitar errores de contexto
  const input = texto.slice(0, 30_000);
  const response = await client.embeddings.create({
    model: getRagConfig().model,
    input,
  });
  return response.data[0].embedding;
}

/**
 * Genera embeddings en batch para múltiples textos.
 * Más eficiente que llamar generarEmbedding() N veces.
 *
 * @param textos - Array de textos a embeber
 * @returns Array de arrays de números (vectores)
 */
export async function generarEmbeddingsBatch(textos: string[]): Promise<number[][]> {
  if (textos.length === 0) return [];
  const client = getClient();
  // Truncar cada texto a 30k chars para evitar errores
  const inputs = textos.map((t) => t.slice(0, 30_000));
  const response = await client.embeddings.create({
    model: getRagConfig().model,
    input: inputs,
  });
  // OpenAI/DeepSeek devuelve en orden; asegurar alineación con sort by index
  const ordenados = response.data.sort((a, b) => a.index - b.index);
  return ordenados.map((d) => d.embedding);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Búsqueda vectorial en Neon (pgvector)
// ═══════════════════════════════════════════════════════════════════════════

export interface ResultadoEmbedding {
  entidadTipo: string;
  entidadId: string;
  chunkIndex: number;
  contenido: string;
  similitud: number;
  metadata: Record<string, unknown>;
}

/**
 * Busca los k chunks más similares al vector dado usando distancia coseno.
 *
 * @param vector - Vector de consulta (1536 dimensiones)
 * @param k - Número de resultados (default: ragConfig.topK)
 * @param filtroTipo - Opcional: filtrar por tipo de entidad (ej. 'blog_post')
 * @returns Array de resultados ordenados por similitud descendente
 */
export async function buscarPorSimilitud(
  vector: number[],
  k: number = getRagConfig().topK,
  filtroTipo?: EntidadTipo,
): Promise<ResultadoEmbedding[]> {
  if (!process.env.DATABASE_URL) {
    console.warn('[rag] DATABASE_URL no configurada, búsqueda vectorial desactivada');
    return [];
  }

  const vectorJson = JSON.stringify(vector);

  try {
    const sqlConn = neon(process.env.DATABASE_URL);
    const db = drizzle(sqlConn);

    let query = sql`
      SELECT
        entidad_tipo,
        entidad_id,
        chunk_index,
        contenido,
        1 - (embedding <=> ${vectorJson}::vector) AS similitud,
        metadata
      FROM embeddings
      WHERE embedding IS NOT NULL
    `;

    if (filtroTipo) {
      query = sql`${query} AND entidad_tipo = ${filtroTipo}`;
    }

    query = sql`${query} ORDER BY embedding <=> ${vectorJson}::vector LIMIT ${k}`;

    const result = await db.execute(query);
    const rows = result.rows || [];

    return (rows as Array<Record<string, unknown>>).map((row) => ({
      entidadTipo: row.entidad_tipo as string,
      entidadId: row.entidad_id as string,
      chunkIndex: row.chunk_index as number,
      contenido: row.contenido as string,
      similitud: row.similitud as number,
      metadata: (row.metadata as Record<string, unknown>) || {},
    }));
  } catch (error) {
    console.error('[rag] Error en búsqueda vectorial:', error);
    return [];
  }
}

/**
 * Versión simplificada compatible con el scaffold anterior.
 * Busca por expediente (scopeIds).
 */
export async function buscarPorSimilitudConScope(
  vector: number[],
  k: number = getRagConfig().topK,
  _scopeIds: string[] | null = null,
): Promise<ResultadoEmbedding[]> {
  // Ignoramos scopeIds por ahora; en futura versión se filtrará por expediente
  return buscarPorSimilitud(vector, k);
}
