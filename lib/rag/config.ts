/**
 * Configuración centralizada del sistema RAG (Retrieval Augmented Generation).
 *
 * FUENTE DE VERDAD: variables de entorno (EMBEDDINGS_* y RAG_*).
 * Toda la configuración del pipeline de embeddings y retrieval vive aquí,
 * de modo que se pueda ajustar sin tocar el código de los módulos que lo usan
 * (blog-verify-fix.ts, chat widget, scripts de indexación).
 *
 * IMPORTANTE: Las funciones usan lazy evaluation (acceso a process.env en
 * tiempo de llamada, no al cargar el módulo). Esto es necesario porque los
 * scripts cargan .env.local DESPUÉS de los imports estáticos de ES modules.
 * Si usáramos constantes en módulo, leerían process.env antes del override.
 *
 * Variables de entorno (todas en .env.local, NUNCA en el cliente):
 *   EMBEDDINGS_PROVEEDOR    Proveedor de embeddings (default: "deepseek")
 *   EMBEDDINGS_API_KEY      API key (default: DEEPSEEK_API_KEY)
 *   EMBEDDINGS_MODELO       Modelo de embeddings (default: "deepseek-embedding")
 *   EMBEDDINGS_DIMENSIONES  Dimensiones del vector (default: 1536)
 *   EMBEDDINGS_BASE_URL     Base URL del proveedor (default: https://api.deepseek.com/v1)
 *   RAG_TOP_K               Número de chunks a recuperar (default: 5)
 *   RAG_MIN_SCORE           Umbral mínimo de similitud (default: 0.7)
 *   RAG_MAX_CHUNK_TOKENS    Tamaño máximo por chunk en tokens (default: 500)
 *   RAG_CHUNK_OVERLAP       Overlap entre chunks en tokens (default: 50)
 */

/**
 * Obtiene la configuración RAG con lazy evaluation.
 * Las propiedades se evalúan en el momento de la llamada, no al importar.
 *
 * Proveedor por defecto: OpenAI text-embedding-3-small.
 * Si se prefiere otro, cambiar EMBEDDINGS_PROVEEDOR en .env.local.
 */
export function getRagConfig() {
  return {
    provider: process.env.EMBEDDINGS_PROVEEDOR || 'openai',
    apiKey:
      process.env.EMBEDDINGS_API_KEY ||
      process.env.OPENAI_API_KEY ||
      '',
    model: process.env.EMBEDDINGS_MODELO || 'text-embedding-3-small',
    dimensions: Number(process.env.EMBEDDINGS_DIMENSIONES) || 1536,
    baseUrl: (
      process.env.EMBEDDINGS_BASE_URL ||
      'https://api.openai.com/v1'
    ).replace(/\/+$/, ''),
    topK: Number(process.env.RAG_TOP_K) || 5,
    minScore: Number(process.env.RAG_MIN_SCORE) || 0.7,
    maxChunkTokens: Number(process.env.RAG_MAX_CHUNK_TOKENS) || 500,
    chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP) || 50,
  };
}

export type RagConfig = ReturnType<typeof getRagConfig>;

/**
 * Tipos de entidad que pueden indexarse en la tabla `embeddings`.
 */
export type EntidadTipo =
  | 'blog_post'
  | 'articulo_cp'
  | 'articulo_const'
  | 'codigo_civil'
  | 'codigo_comercio'
  | 'codigo_trabajo'
  | 'codigo_tributario'
  | 'delito'
  | 'faq'
  | 'area_juridica'
  | 'pineda_doc'
  | 'pdf_original';

/**
 * Verifica que las credenciales de embeddings estén configuradas.
 * Lazy: evalúa process.env al llamar, no al importar.
 */
export function isRagDisponible(): boolean {
  const apiKey =
    process.env.EMBEDDINGS_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    '';
  return Boolean(apiKey);
}
