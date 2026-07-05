/**
 * Capa de retrieval del sistema RAG.
 *
 * Orquesta: consulta → embedding → búsqueda vectorial → construcción de contexto.
 *
 * USO:
 *   import { recuperarContexto } from '@/lib/rag/retrieval';
 *   const contexto = await recuperarContexto('¿Qué dice el artículo 214 del CP?');
 */

import { generarEmbedding, buscarPorSimilitud, isEmbeddingsDisponible } from './embeddings';
import { getRagConfig, type EntidadTipo } from './config';

export interface OpcionesRecuperacion {
  /** Número de chunks a recuperar (default: ragConfig.topK) */
  topK?: number;
  /** Filtrar por tipo de entidad */
  filtroTipo?: EntidadTipo;
  /** Umbral mínimo de similitud (default: ragConfig.minScore) */
  minScore?: number;
  /** Incluir metadatos en el contexto (default: false) */
  incluirMetadata?: boolean;
  /** Prefijo para cada chunk en el contexto formateado */
  prefijo?: string;
}

export interface ResultadoRecuperacion {
  exito: boolean;
  contexto: string;
  chunks: Array<{
    contenido: string;
    similitud: number;
    fuente: string;
    entidadTipo: string;
  }>;
  totalChunks: number;
}

/**
 * Recupera contexto relevante para una consulta usando búsqueda semántica.
 *
 * 1. Genera embedding de la consulta
 * 2. Busca los top-k chunks más similares en pgvector
 * 3. Filtra por umbral de similitud
 * 4. Formatea como contexto para inyectar en prompts de IA
 *
 * @param consulta - Texto de consulta (título de post, pregunta, etc.)
 * @param opciones - Opciones de recuperación
 * @returns Contexto formateado + metadatos
 */
export async function recuperarContexto(
  consulta: string,
  opciones: OpcionesRecuperacion = {},
): Promise<ResultadoRecuperacion> {
  const {
    topK = getRagConfig().topK,
    filtroTipo,
    minScore = getRagConfig().minScore,
    incluirMetadata = false,
    prefijo = '📚',
  } = opciones;

  if (!isEmbeddingsDisponible()) {
    return {
      exito: false,
      contexto: '',
      chunks: [],
      totalChunks: 0,
    };
  }

  if (!consulta || consulta.trim().length < 3) {
    return {
      exito: false,
      contexto: '',
      chunks: [],
      totalChunks: 0,
    };
  }

  try {
    // 1. Generar embedding de la consulta
    const vector = await generarEmbedding(consulta);

    // 2. Buscar chunks similares
    const resultados = await buscarPorSimilitud(vector, topK, filtroTipo);

    if (resultados.length === 0) {
      return {
        exito: true,
        contexto: '',
        chunks: [],
        totalChunks: 0,
      };
    }

    // 3. Filtrar por umbral y formatear
    const chunksValidos = resultados.filter((r) => r.similitud >= minScore);

    if (chunksValidos.length === 0) {
      return {
        exito: true,
        contexto: '',
        chunks: [],
        totalChunks: resultados.length,
      };
    }

    // 4. Construir contexto formateado
    const lines: string[] = [];
    const chunksInfo: Array<{
      contenido: string;
      similitud: number;
      fuente: string;
      entidadTipo: string;
    }> = [];

    for (const chunk of chunksValidos) {
      const fuente = formatFuente(chunk.entidadTipo, chunk.entidadId, chunk.metadata);
      const header = `${prefijo} [${fuente}] (similitud: ${(chunk.similitud * 100).toFixed(0)}%)`;

      lines.push(header);
      lines.push(chunk.contenido);
      if (incluirMetadata) {
        lines.push(`  → Tipo: ${chunk.entidadTipo}, ID: ${chunk.entidadId}`);
      }
      lines.push('');

      chunksInfo.push({
        contenido: chunk.contenido,
        similitud: chunk.similitud,
        fuente,
        entidadTipo: chunk.entidadTipo,
      });
    }

    return {
      exito: true,
      contexto: lines.join('\n').trim(),
      chunks: chunksInfo,
      totalChunks: resultados.length,
    };
  } catch (error) {
    console.error('[rag] Error recuperando contexto:', error);
    return {
      exito: false,
      contexto: '',
      chunks: [],
      totalChunks: 0,
    };
  }
}

/**
 * Recupera contexto específicamente para el pipeline de blog-verify-fix.
 * Usa el título y claims del post como consulta.
 *
 * @param tituloPost - Título del post
 * @param claims - Claims legales detectados en el post (opcional)
 * @returns Contexto formateado
 */
export async function recuperarContextoParaBlog(
  tituloPost: string,
  claims?: string[],
): Promise<string> {
  // Construir consulta combinando título + claims
  const consulta = [tituloPost, ...(claims || [])]
    .filter(Boolean)
    .join(' — ');

  const resultado = await recuperarContexto(consulta, {
    topK: 5,
    minScore: 0.65, // umbral ligeramente más bajo para blog
    prefijo: '📖',
  });

  if (!resultado.exito || !resultado.contexto) {
    return '';
  }

  return `CONTEXTO RECUPERADO DE LA BASE DE CONOCIMIENTO:\n${resultado.contexto}`;
}

/**
 * Recupera contexto para el chat widget.
 * Usa el mensaje del usuario como consulta.
 *
 * @param mensaje - Mensaje del usuario
 * @returns Contexto formateado
 */
export async function recuperarContextoParaChat(mensaje: string): Promise<string> {
  const resultado = await recuperarContexto(mensaje, {
    topK: 5,
    minScore: 0.5,
    prefijo: '📖',
  });

  if (!resultado.exito || !resultado.contexto) {
    return '';
  }

  return `INFORMACIÓN ADICIONAL DE LA BASE DE CONOCIMIENTO:\n${resultado.contexto}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Utilidades
// ═══════════════════════════════════════════════════════════════════════════

const NOMBRES_TIPO: Record<string, string> = {
  blog_post: 'Blog',
  articulo_cp: 'Código Penal',
  articulo_const: 'Constitución',
  codigo_civil: 'Código Civil',
  codigo_comercio: 'Código de Comercio',
  codigo_trabajo: 'Código de Trabajo',
  codigo_tributario: 'Código Tributario',
  delito: 'Delito',
  faq: 'FAQ',
  area_juridica: 'Área Jurídica',
  pineda_doc: 'Documento interno',
  pdf_original: 'PDF legal',
};

function formatFuente(
  entidadTipo: string,
  entidadId: string,
  metadata?: Record<string, unknown>,
): string {
  const nombre = NOMBRES_TIPO[entidadTipo] || entidadTipo;

  if (entidadTipo === 'blog_post') {
    const titulo = metadata?.title || entidadId;
    return `Blog: ${titulo}`;
  }
  if (entidadTipo === 'delito') {
    const nombreDelito = metadata?.nombre || '';
    return `Delito: ${nombreDelito} (Art. ${entidadId})`;
  }
  if (entidadTipo.startsWith('codigo_') || entidadTipo === 'articulo_cp' || entidadTipo === 'articulo_const') {
    return `${nombre} — Art. ${entidadId}`;
  }
  return `${nombre}: ${entidadId}`;
}
