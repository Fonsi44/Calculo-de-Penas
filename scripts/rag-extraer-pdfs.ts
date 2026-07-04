/**
 * Extrae texto de los PDFs legales en docs/ para prepararlos para indexación RAG.
 *
 * Los PDFs ya están extraídos en data/pdfs-extracted/ como .txt.
 * Este script procesa esos .txt y genera chunks listos para embeber.
 *
 * USO:
 *   npx tsx scripts/rag-extraer-pdfs.ts              # Dry-run
 *   npx tsx scripts/rag-extraer-pdfs.ts --aplicar    # Guarda chunks como JSON
 */

import * as fs from 'fs';
import * as path from 'path';

const PDFS_DIR = path.resolve(process.cwd(), 'data/pdfs-extracted');
const OUTPUT_DIR = path.resolve(process.cwd(), 'data/pdfs-chunked');

const APLICAR = process.argv.includes('--aplicar');

interface ChunkPDF {
  entidadTipo: 'pdf_original';
  entidadId: string;
  chunkIndex: number;
  contenido: string;
  metadata: {
    archivo: string;
    seccion?: string;
  };
}

function main() {
  console.log('🔍 Extrayendo texto de PDFs legales...\n');

  if (!fs.existsSync(PDFS_DIR)) {
    console.error('❌ No se encontró el directorio data/pdfs-extracted/');
    console.error('   Ejecuta primero: pdftotext docs/*.pdf data/pdfs-extracted/');
    process.exit(1);
  }

  const archivos = fs.readdirSync(PDFS_DIR).filter((f) => f.endsWith('.txt'));

  if (archivos.length === 0) {
    console.log('⚠️  No hay archivos .txt en data/pdfs-extracted/');
    process.exit(0);
  }

  console.log(`📄 PDFs encontrados: ${archivos.length}\n`);

  let totalChunks = 0;
  const todosLosChunks: ChunkPDF[] = [];

  for (const archivo of archivos) {
    const ruta = path.join(PDFS_DIR, archivo);
    const contenido = fs.readFileSync(ruta, 'utf-8');
    const nombreBase = archivo.replace(/\.txt$/, '');
    const stats = fs.statSync(ruta);

    console.log(`  📄 ${nombreBase}`);
    console.log(`     Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`     Caracteres: ${contenido.length.toLocaleString()}`);

    // Dividir en chunks por ~500 líneas cada uno (secciones del documento)
    const lineas = contenido.split('\n');
    const CHUNK_SIZE = 500;
    const OVERLAP = 50;

    for (let i = 0; i < lineas.length; i += CHUNK_SIZE - OVERLAP) {
      const chunkLineas = lineas.slice(i, i + CHUNK_SIZE);
      const chunkText = chunkLineas.join('\n').trim();
      if (chunkText.length < 50) continue; // Saltar chunks vacíos o muy pequeños

      const chunkIndex = Math.floor(i / (CHUNK_SIZE - OVERLAP));
      const primeraLinea = chunkLineas[0]?.trim().slice(0, 100) || '';

      todosLosChunks.push({
        entidadTipo: 'pdf_original',
        entidadId: nombreBase,
        chunkIndex,
        contenido: chunkText.slice(0, 3000),
        metadata: {
          archivo: nombreBase,
          seccion: primeraLinea || undefined,
        },
      });
      totalChunks++;
    }

    console.log(`     Chunks: ${Math.ceil(lineas.length / (CHUNK_SIZE - OVERLAP))}`);
    console.log('');
  }

  console.log(`\n✅ Total chunks generados: ${totalChunks}`);

  if (APLICAR) {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputPath = path.join(OUTPUT_DIR, 'chunks-pdfs.json');
    fs.writeFileSync(outputPath, JSON.stringify(todosLosChunks, null, 2), 'utf-8');
    console.log(`💾 Chunks guardados en: ${outputPath}`);
  } else {
    console.log('\n⚠️  Modo dry-run. Usa --aplicar para guardar los chunks.');
  }
}

main();
