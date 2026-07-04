/**
 * Indexador RAG — Procesa todas las fuentes de conocimiento y las indexa
 * en Neon (pgvector) para búsqueda semántica.
 *
 * FUENTES:
 *   1. Blog posts (DB blog_posts)
 *   2. Códigos legales (data/articulos_cp.json, data/articulos_constitucion.json)
 *   3. Códigos civiles, comercio, trabajo, tributario (data/codigo_*.json)
 *   4. Delitos (data/delitos.json)
 *   5. FAQ (data/faq.ts)
 *   6. Áreas jurídicas (data/areas-juridicas.ts)
 *   7. PDFs extraídos (data/pdfs-chunked/chunks-pdfs.json)
 *
 * USO:
 *   npm run rag:indexar                        # Dry-run
 *   npm run rag:indexar:aplicar                # Indexar todo
 *   npm run rag:indexar -- --tipo blog         # Solo blog posts
 *   npm run rag:indexar -- --tipo legal        # Solo códigos legales
 *   npm run rag:indexar -- --reset             # Re-indexar (limpia tabla)
 *   npm run rag:indexar -- --slug <slug>       # Indexar un solo post
 *
 * REQUISITOS:
 *   - DATABASE_URL configurada
 *   - EMBEDDINGS_API_KEY o DEEPSEEK_API_KEY configurada
 *   - Migración de embeddings ejecutada (pgvector activo)
 */

import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq, and } from 'drizzle-orm';
import { blogPosts, embeddings } from '../lib/schema';
import {
  generarEmbeddingsBatch,
  isEmbeddingsDisponible,
} from '../lib/rag/embeddings';
import {
  chunkBlogPost,
  chunkArticulosLegales,
  chunkDelitos,
  chunkText,
  type Chunk,
} from '../lib/rag/chunking';
import * as fs from 'fs';
import * as path from 'path';

// Cargar .env.local si existe
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

// ═══════════════════════════════════════════════════════════════════════════
//  CLI
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const RESET = args.includes('--reset');
const TIPO_FILTRO = (() => {
  const i = args.indexOf('--tipo');
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return null;
})();
const SLUG_FILTRO = (() => {
  const i = args.indexOf('--slug');
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return null;
})();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Indexador RAG — Procesa fuentes de conocimiento y las indexa en Neon (pgvector).

USO:
  npm run rag:indexar                        Dry-run
  npm run rag:indexar:aplicar                Indexar todo
  npm run rag:indexar -- --tipo blog         Solo blog posts
  npm run rag:indexar -- --tipo legal        Solo códigos legales
  npm run rag:indexar -- --reset             Re-indexar (limpia tabla)
  npm run rag:indexar -- --slug <slug>       Indexar un solo post

VARIABLES DE ENTORNO:
  DATABASE_URL       (obligatoria) — Neon PostgreSQL.
  EMBEDDINGS_API_KEY (obligatoria) — API key para embeddings.
`);
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DB
// ═══════════════════════════════════════════════════════════════════════════

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no configurada.');
  process.exit(1);
}

const sqlConn = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConn);

// ═══════════════════════════════════════════════════════════════════════════
//  Estadísticas
// ═══════════════════════════════════════════════════════════════════════════

let totalChunks = 0;
let totalTokens = 0;
let errores = 0;

function log(msg: string) {
  console.log(`  ${msg}`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  1. Blog posts
// ═══════════════════════════════════════════════════════════════════════════

async function indexarBlogPosts(): Promise<Chunk[]> {
  console.log('\n📝 Indexando blog posts...');

  const posts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      body: blogPosts.body,
    })
    .from(blogPosts)
    .where(
      SLUG_FILTRO
        ? eq(blogPosts.slug, SLUG_FILTRO)
        : sql`1=1`,
    );

  log(`Posts encontrados: ${posts.length}`);
  const chunks: Chunk[] = [];

  for (const post of posts) {
    try {
      const postChunks = chunkBlogPost(post.slug, post.title, post.body);
      chunks.push(...postChunks);
      log(`  ✓ ${post.slug} → ${postChunks.length} chunks`);
    } catch (error) {
      console.error(`  ✗ Error en ${post.slug}:`, error);
      errores++;
    }
  }

  return chunks;
}

// ═══════════════════════════════════════════════════════════════════════════
//  2. Códigos legales (JSON)
// ═══════════════════════════════════════════════════════════════════════════

function cargarJson<R>(ruta: string): R[] {
  const fullPath = path.resolve(process.cwd(), ruta);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠️  Archivo no encontrado: ${ruta}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function indexarCodigoLegal(
  tipo: string,
  nombre: string,
  ruta: string,
): Chunk[] {
  console.log(`\n📚 Indexando ${nombre}...`);
  const articulos = cargarJson<{
    articulo: string;
    epigrafe?: string;
    texto: string;
    tema?: string;
  }>(ruta);

  if (articulos.length === 0) {
    log(`  ⚠️  Vacío o no encontrado`);
    return [];
  }

  const chunks = chunkArticulosLegales(tipo, articulos);
  log(`  ✓ ${articulos.length} artículos → ${chunks.length} chunks`);
  return chunks;
}

// ═══════════════════════════════════════════════════════════════════════════
//  3. Delitos
// ═══════════════════════════════════════════════════════════════════════════

function indexarDelitos(): Chunk[] {
  console.log('\n⚖️  Indexando delitos...');
  const delitos = cargarJson<{
    nombre: string;
    articulo: string;
    conducta?: string;
    penaMinimaMeses?: number;
    penaMaximaMeses?: number;
    clasificacion?: string;
    ramaId?: string;
  }>('data/delitos.json');

  if (delitos.length === 0) {
    log('  ⚠️  Vacío o no encontrado');
    return [];
  }

  const chunks = chunkDelitos(delitos);
  log(`  ✓ ${delitos.length} delitos → ${chunks.length} chunks`);
  return chunks;
}

// ═══════════════════════════════════════════════════════════════════════════
//  4. FAQ
// ═══════════════════════════════════════════════════════════════════════════

function indexarFAQs(): Chunk[] {
  console.log('\n❓ Indexando FAQs...');
  // Importar dinámicamente el archivo TS
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const faqData = require('../data/faq');
    const preguntas = faqData.faqEntries || faqData.default || [];

    const chunks: Chunk[] = [];
    let idx = 0;

    for (const entry of preguntas) {
      const pregunta = entry.pregunta || entry.question || '';
      const respuesta = entry.respuesta || entry.answer || '';
      if (!pregunta && !respuesta) continue;

      const contenido = `P: ${pregunta}\nR: ${respuesta}`;
      chunks.push({
        entidadTipo: 'faq',
        entidadId: `faq-${idx}`,
        chunkIndex: 0,
        contenido: contenido.slice(0, 1500),
        metadata: { categoria: entry.categoria || null },
      });
      idx++;
    }

    log(`  ✓ ${idx} FAQs → ${chunks.length} chunks`);
    return chunks;
  } catch (error) {
    console.warn('  ⚠️  Error cargando FAQs:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  5. Áreas jurídicas
// ═══════════════════════════════════════════════════════════════════════════

function indexarAreasJuridicas(): Chunk[] {
  console.log('\n🏛️  Indexando áreas jurídicas...');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const areasData = require('../data/areas-juridicas');
    const areas = [
      ...(areasData.areasGenerales || []),
      ...(areasData.hubPenal?.grupos || []),
      ...(areasData.hubMigrantes?.subareas || []),
    ];

    const chunks: Chunk[] = [];
    for (const area of areas) {
      const titulo = area.titulo || area.nombre || '';
      const resumen = area.resumen || area.descripcion || '';
      if (!titulo && !resumen) continue;

      const contenido = `${titulo}${resumen ? `: ${resumen}` : ''}`;
      chunks.push({
        entidadTipo: 'area_juridica',
        entidadId: area.slug || area.id || titulo.toLowerCase().replace(/\s+/g, '-'),
        chunkIndex: 0,
        contenido: contenido.slice(0, 1500),
        metadata: { titulo },
      });
    }

    log(`  ✓ ${chunks.length} áreas indexadas`);
    return chunks;
  } catch (error) {
    console.warn('  ⚠️  Error cargando áreas jurídicas:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  6. PDFs extraídos
// ═══════════════════════════════════════════════════════════════════════════

function indexarPDFs(): Chunk[] {
  console.log('\n📄 Indexando PDFs extraídos...');
  const rutaChunks = path.resolve(process.cwd(), 'data/pdfs-chunked/chunks-pdfs.json');

  if (!fs.existsSync(rutaChunks)) {
    log('  ⚠️  No hay chunks de PDFs. Ejecuta primero: npm run rag:extraer-pdfs -- --aplicar');
    return [];
  }

  const data = JSON.parse(fs.readFileSync(rutaChunks, 'utf-8')) as Chunk[];
  log(`  ✓ ${data.length} chunks de PDFs`);
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  7. Guardar en DB
// ═══════════════════════════════════════════════════════════════════════════

async function guardarEnDB(chunks: Chunk[]): Promise<void> {
  if (!APLICAR) {
    console.log('\n⚠️  Modo dry-run. Usa --aplicar para indexar en DB.');
    return;
  }

  console.log('\n💾 Guardando en Neon (pgvector)...');

  // Batch de 20 chunks para embeddings
  const BATCH_SIZE = 20;
  let insertados = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    try {
      // Generar embeddings en batch
      const textos = batch.map((c) => c.contenido);
      const embeddings_vectors = await generarEmbeddingsBatch(textos);

      // Insertar cada chunk con su embedding
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const vector = embeddings_vectors[j];

        // Upsert: mismo entidad_tipo + entidad_id + chunk_index → actualizar
        const exists = await db
          .select({ id: embeddings.id })
          .from(embeddings)
          .where(
            and(
              eq(embeddings.entidadTipo, chunk.entidadTipo),
              eq(embeddings.entidadId, chunk.entidadId),
              eq(embeddings.chunkIndex, chunk.chunkIndex),
            ),
          )
          .limit(1);

        if (exists.length > 0) {
          // Actualizar
          const vecSql = sql`${JSON.stringify(vector)}::vector`;
          await db
            .update(embeddings)
            .set({
              contenido: chunk.contenido,
              embedding: vecSql as unknown as null, // se pasa vía sql raw
              metadata: chunk.metadata,
            })
            .where(eq(embeddings.id, exists[0].id));
        } else {
          // Insertar
          const vecSql = sql`${JSON.stringify(vector)}::vector`;
          await db.insert(embeddings).values({
            entidadTipo: chunk.entidadTipo,
            entidadId: chunk.entidadId,
            chunkIndex: chunk.chunkIndex,
            contenido: chunk.contenido,
            embedding: vecSql as unknown as null,
            modelo: 'deepseek-embedding',
            metadata: chunk.metadata,
          });
        }
        insertados++;
      }

      const progress = `  ${((i + batch.length) / chunks.length * 100).toFixed(0)}%`;
      process.stdout.write(`\r  Progreso: ${progress} (${insertados}/${chunks.length} chunks)`);
    } catch (error) {
      console.error(`\n  ✗ Error en batch ${i}:`, error);
      errores++;
    }
  }

  console.log(`\n  ✅ ${insertados} chunks indexados en DB`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🧠 Indexador RAG — Pineda y Asociados     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Modo: ${APLICAR ? '🚀 APLICAR' : '🔍 DRY-RUN'}`);
  console.log(`Reset: ${RESET ? 'SÍ' : 'no'}`);
  console.log(`Filtro tipo: ${TIPO_FILTRO || 'todos'}`);
  console.log(`Filtro slug: ${SLUG_FILTRO || 'ninguno'}`);

  // Verificar disponibilidad de embeddings
  if (!isEmbeddingsDisponible()) {
    console.error('\n❌ Embeddings no disponibles. Configura EMBEDDINGS_API_KEY o DEEPSEEK_API_KEY.');
    process.exit(1);
  }
  console.log('\n✅ Embeddings disponibles (DeepSeek)\n');

  // Reset si se solicita
  if (RESET && APLICAR) {
    console.log('🔄 Limpiando tabla embeddings...');
    await db.delete(embeddings);
    console.log('  ✅ Tabla limpiada\n');
  }

  // Coleccionar chunks
  let todosLosChunks: Chunk[] = [];

  if (!TIPO_FILTRO || TIPO_FILTRO === 'blog') {
    if (!SLUG_FILTRO) {
      // Solo indexar blogs completos si no hay filtro de slug
      const blogChunks = await indexarBlogPosts();
      todosLosChunks.push(...blogChunks);
    } else {
      // Indexar un solo post
      const blogChunks = await indexarBlogPosts();
      todosLosChunks.push(...blogChunks);
    }
  }

  if (!TIPO_FILTRO || TIPO_FILTRO === 'legal') {
    todosLosChunks.push(
      ...indexarCodigoLegal('articulo_cp', 'Código Penal', 'data/articulos_cp.json'),
    );
    todosLosChunks.push(
      ...indexarCodigoLegal('articulo_const', 'Constitución', 'data/articulos_constitucion.json'),
    );
    todosLosChunks.push(
      ...indexarCodigoLegal('codigo_civil', 'Código Civil', 'data/codigo_civil.json'),
    );
    todosLosChunks.push(
      ...indexarCodigoLegal('codigo_comercio', 'Código de Comercio', 'data/codigo_comercio.json'),
    );
    todosLosChunks.push(
      ...indexarCodigoLegal('codigo_trabajo', 'Código de Trabajo', 'data/codigo_trabajo.json'),
    );
    todosLosChunks.push(
      ...indexarCodigoLegal('codigo_tributario', 'Código Tributario', 'data/codigo_tributario.json'),
    );
    todosLosChunks.push(...indexarDelitos());
  }

  if (!TIPO_FILTRO || TIPO_FILTRO === 'faq') {
    todosLosChunks.push(...indexarFAQs());
  }

  if (!TIPO_FILTRO || TIPO_FILTRO === 'areas') {
    todosLosChunks.push(...indexarAreasJuridicas());
  }

  if (!TIPO_FILTRO || TIPO_FILTRO === 'pdfs') {
    todosLosChunks.push(...indexarPDFs());
  }

  // Estadísticas
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   📊 RESUMEN                                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Total chunks: ${todosLosChunks.length}`);

  // Contar por tipo
  const porTipo: Record<string, number> = {};
  for (const c of todosLosChunks) {
    porTipo[c.entidadTipo] = (porTipo[c.entidadTipo] || 0) + 1;
  }
  for (const [tipo, count] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tipo}: ${count}`);
  }

  console.log(`  Errores: ${errores}`);

  // Guardar
  if (todosLosChunks.length > 0) {
    await guardarEnDB(todosLosChunks);
  }

  console.log('\n✅ Indexación completada.\n');
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
