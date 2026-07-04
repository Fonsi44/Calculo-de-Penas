/**
 * Estrategias de chunking para el sistema RAG.
 *
 * Divide las distintas fuentes de conocimiento en fragmentos (chunks)
 * óptimos para generar embeddings y búsqueda semántica.
 *
 * Estrategias por tipo de contenido:
 *   - Blog posts: secciones por H2 (1 sección = 1 chunk)
 *   - Códigos legales: 1 artículo = 1 chunk
 *   - Delitos: 1 delito = 1 chunk (nombre + conducta + pena)
 *   - FAQ: 1 pregunta = 1 chunk
 *   - Texto plano: por tokens con overlap
 *   - Áreas jurídicas: 1 área = 1 chunk
 */

export interface Chunk {
  /** Tipo de entidad (blog_post, articulo_cp, delito, etc.) */
  entidadTipo: string;
  /** Identificador único dentro del tipo */
  entidadId: string;
  /** Índice del chunk (0-based) */
  chunkIndex: number;
  /** Contenido textual del chunk */
  contenido: string;
  /** Metadatos adicionales */
  metadata: Record<string, unknown>;
}

/**
 * Tokenización aproximada: 1 token ≈ 4 caracteres en español.
 * No es exacta pero sirve para chunking.
 */
function approxTokens(texto: string): number {
  return Math.ceil(texto.length / 4);
}

/**
 * Chunking para blog posts: divide por secciones H2.
 * Cada sección H2 se convierte en un chunk independiente.
 * El primer chunk incluye el título del post como prefijo.
 *
 * @param slug - Slug del post (entidadId)
 * @param title - Título del post
 * @param body - Cuerpo HTML del post
 * @returns Array de chunks
 */
export function chunkBlogPost(slug: string, title: string, body: string): Chunk[] {
  const chunks: Chunk[] = [];
  // Extraer texto plano del HTML
  const textPlain = stripHtml(body);

  // Dividir por H2
  const sections = textPlain.split(/(?=<h2)/i);

  if (sections.length <= 1) {
    // Sin H2: un solo chunk con el cuerpo completo
    const contenido = `Título: ${title}\n\n${textPlain.slice(0, 2000)}`;
    chunks.push({
      entidadTipo: 'blog_post',
      entidadId: slug,
      chunkIndex: 0,
      contenido,
      metadata: { title, tipo: 'completo' },
    });
  } else {
    sections.forEach((section, i) => {
      const heading = extractHeading(section);
      const bodyText = stripHtml(section).trim();
      if (!bodyText) return;
      const contenido = i === 0
        ? `Título: ${title}\n\n${bodyText}`
        : bodyText;
      chunks.push({
        entidadTipo: 'blog_post',
        entidadId: slug,
        chunkIndex: i,
        contenido: contenido.slice(0, 2000),
        metadata: { title, heading, tipo: 'seccion' },
      });
    });
  }

  return chunks;
}

/**
 * Chunking para artículos de códigos legales: 1 artículo = 1 chunk.
 *
 * @param tipo - Tipo de código (articulo_cp, codigo_civil, etc.)
 * @param articulos - Array de artículos con numero, epigrafe, texto
 * @returns Array de chunks
 */
export function chunkArticulosLegales(
  tipo: string,
  articulos: Array<{ articulo: string; epigrafe?: string; texto: string; tema?: string }>,
): Chunk[] {
  return articulos.map((art, _i) => {
    const epigrafe = art.epigrafe ? ` — ${art.epigrafe}` : '';
    const tema = art.tema ? ` [${art.tema}]` : '';
    const contenido = `Art. ${art.articulo}${epigrafe}${tema}\n${art.texto}`;
    return {
      entidadTipo: tipo,
      entidadId: art.articulo,
      chunkIndex: 0,
      contenido: contenido.slice(0, 2000),
      metadata: { epigrafe: art.epigrafe || null, tema: art.tema || null },
    };
  });
}

/**
 * Chunking para delitos: 1 delito = 1 chunk.
 *
 * @param delitos - Array de delitos (data/delitos.json)
 * @returns Array de chunks
 */
export function chunkDelitos(
  delitos: Array<{
    nombre: string;
    articulo: string;
    conducta?: string;
    penaMinimaMeses?: number;
    penaMaximaMeses?: number;
    clasificacion?: string;
    ramaId?: string;
  }>,
): Chunk[] {
  return delitos.map((d, _i) => {
    const contenido = [
      `Delito: ${d.nombre}`,
      `Artículo: ${d.articulo}`,
      d.conducta ? `Conducta: ${d.conducta}` : '',
      d.penaMinimaMeses !== undefined ? `Pena: ${d.penaMinimaMeses} a ${d.penaMaximaMeses} meses` : '',
      d.clasificacion ? `Clasificación: ${d.clasificacion}` : '',
      d.ramaId ? `Rama: ${d.ramaId}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      entidadTipo: 'delito',
      entidadId: d.articulo,
      chunkIndex: 0,
      contenido: contenido.slice(0, 1500),
      metadata: { nombre: d.nombre, clasificacion: d.clasificacion || null },
    };
  });
}

/**
 * Chunking genérico para texto plano.
 * Divide el texto en chunks de tamaño aproximado maxTokens.
 *
 * @param entidadTipo - Tipo de entidad
 * @param entidadId - Identificador único
 * @param texto - Texto a dividir
 * @param maxTokens - Tokens máximos por chunk (default: 500)
 * @param overlap - Tokens de overlap entre chunks (default: 50)
 * @returns Array de chunks
 */
export function chunkText(
  entidadTipo: string,
  entidadId: string,
  texto: string,
  maxTokens: number = 500,
  overlap: number = 50,
): Chunk[] {
  const parrafos = texto.split(/\n\s*\n/).filter(Boolean);
  const chunks: Chunk[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const parrafo of parrafos) {
    const pTokens = approxTokens(parrafo);

    if (currentTokens + pTokens > maxTokens && current.length > 0) {
      // Guardar chunk actual
      chunks.push({
        entidadTipo,
        entidadId,
        chunkIndex: chunks.length,
        contenido: current.join('\n\n').slice(0, 2000),
        metadata: {},
      });

      // Overlap: mantener últimos párrafos que sumen ~overlap tokens
      const overlapped: string[] = [];
      let overlapTokens = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const t = approxTokens(current[i]);
        if (overlapTokens + t > overlap) break;
        overlapped.unshift(current[i]);
        overlapTokens += t;
      }
      current = overlapped;
      currentTokens = overlapTokens;
    }

    current.push(parrafo);
    currentTokens += pTokens;
  }

  // Último chunk
  if (current.length > 0) {
    chunks.push({
      entidadTipo,
      entidadId,
      chunkIndex: chunks.length,
      contenido: current.join('\n\n').slice(0, 2000),
      metadata: {},
    });
  }

  return chunks;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Utilidades
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Elimina etiquetas HTML y normaliza espacios.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae el texto de un heading H2 de un fragmento HTML.
 */
function extractHeading(fragment: string): string | null {
  const match = fragment.match(/<h2[^>]*>(.*?)<\/h2>/i);
  return match ? stripHtml(match[1]) : null;
}
