/**
 * SGIE — Capa de embeddings para búsqueda semántica (Sprint 5, tarea 3).
 *
 * ESTADO HONESTO: la infraestructura actual (PostgreSQL estándar, sin extensión
 * pgvector, y sin proveedor de embeddings configurado) NO soporta búsqueda
 * semántica real por similitud vectorial. Esta capa está PREPARADA para cuando
 * se añada pgvector + un proveedor de embeddings, pero hoy devuelve
 * `semanticaRealDisponible: false`.
 *
 * No se finge semántica: la búsqueda "inteligente" actual (lib/sgie/busqueda-
 * hibrida.ts) es ranking textual determinista, claramente etiquetado como tal.
 *
 * Para activar semántica real en el futuro:
 *   1. Añadir extensión pgvector a la DB.
 *   2. Crear tabla `embeddings(entidadTipo, entidadId, textoHash, embedding vector(N), modelo)`.
 *   3. Configurar proveedor de embeddings (OpenAI/HuggingFace/etc.) en el .env.
 *   4. Implementar `generarEmbedding(texto)` y `buscarPorSimilitud(vector, k)`.
 *   5. Cambiar `isEmbeddingsDisponible()` a true cuando todo lo anterior exista.
 *
 * Sprint 5.
 */

/**
 * ¿Está la infraestructura de embeddings disponible?
 *
 * Requiere: variable de entorno `EMBEDDINGS_PROVEEDOR` configurada Y la
 * extensión pgvector activa (no se comprueba aquí por coste; se asume por env).
 * Hoy devuelve false porque no hay proveedor configurado.
 */
export function isEmbeddingsDisponible(): boolean {
  return Boolean(
    process.env.EMBEDDINGS_PROVEEDOR &&
    process.env.EMBEDDINGS_API_KEY &&
    process.env.EMBEDDINGS_MODELO,
  );
}

export interface ResultadoEmbedding {
  entidadTipo: 'expediente' | 'documento' | 'campo';
  entidadId: string;
  texto: string;
  similitud: number;
  fuente: string;
}

/**
 * Genera el embedding de un texto usando el proveedor configurado.
 *
 * NO IMPLEMENTADO: requiere proveedor + API key. Lanza error explícito si se
 * llama sin configuración, para que el caller degrade a búsqueda híbrida.
 *
 * Sprint 5 — pendiente de infraestructura.
 */
export async function generarEmbedding(_texto: string): Promise<number[]> { // eslint-disable-line @typescript-eslint/no-unused-vars -- stub para futura infraestructura de embeddings
  throw new Error('Embeddings no disponibles: configure EMBEDDINGS_PROVEEDOR/EMBEDDINGS_API_KEY/EMBEDDINGS_MODELO y active pgvector.');
}

/**
 * Busca entidades por similitud vectorial (coseno).
 *
 * NO IMPLEMENTADO: requiere pgvector. El caller debe verificar
 * `isEmbeddingsDisponible()` antes de invocar y degradar a ranking híbrido.
 *
 * Sprint 5 — pendiente de infraestructura.
 */
export async function buscarPorSimilitud(
  _vector: number[], // eslint-disable-line @typescript-eslint/no-unused-vars -- stub
  _k: number, // eslint-disable-line @typescript-eslint/no-unused-vars -- stub
  _scopeExpedienteIds: string[] | null, // eslint-disable-line @typescript-eslint/no-unused-vars -- stub
): Promise<ResultadoEmbedding[]> {
  throw new Error('Búsqueda vectorial no disponible: requiere pgvector.');
}
