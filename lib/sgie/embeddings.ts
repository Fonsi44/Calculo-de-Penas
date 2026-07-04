/**
 * SGIE — Capa de embeddings para búsqueda semántica.
 *
 * REEMPLAZADO: ahora implementado en lib/rag/embeddings.ts.
 * Este archivo mantiene la interfaz pública para compatibilidad con
 * el código existente (busqueda-hibrida.ts, ia-documental.ts).
 *
 * INTERFAZ MANTENIDA (idéntica al scaffold original):
 *   - isEmbeddingsDisponible()
 *   - generarEmbedding(texto)
 *   - buscarPorSimilitud(vector, k, scopeIds?)
 *
 * @see lib/rag/embeddings.ts — implementación real
 * @see lib/rag/retrieval.ts — orquestación de recuperación de contexto
 */

export {
  isEmbeddingsDisponible,
  generarEmbedding,
  buscarPorSimilitud,
} from '@/lib/rag/embeddings';

export type { ResultadoEmbedding } from '@/lib/rag/embeddings';
