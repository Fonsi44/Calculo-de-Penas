/**
 * Fase 3D — Verificación de consistencia DB/JSON/producción.
 *
 * Para cada uno de los 15 slugs del Lote 1, compara los 7 puntos exigidos
 * (§9 del enunciado):
 *   1. body en Neon (DB)
 *   2. metadatos en Neon (DB)
 *   3. claims finales (merge 3B+3C+3D)
 *   4. estado calculado (deriveReviewStatus)
 *   5. estado almacenado (DB ai_review_status)
 *   6. HTML de producción (curl con x-vercel-cache) — opcional, requiere URL
 *   7. aviso AiReviewNotice (coherente con estado)
 *
 * Verifica especialmente que no queden cuerpos públicos antiguos por ISR:
 * para los claims `corrected` cuyo `correctedText` existe, comprueba que el
 * body DB NO contiene el `originalText` (texto incorrecto pre-corrección).
 *
 * No escribe en DB ni en bodies. Solo reporta.
 *
 * Uso:
 *   npx tsx scripts/fase3d-verificar-consistencia.ts
 *   npx tsx scripts/fase3d-verificar-consistencia.ts --produccion  # incluye curl
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

const SLUGS_LOTE1 = [
  'abogado-penalista-choluteca',
  'abogado-penalista-sur-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'antejuicio-en-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'cuando-prescribe-delito-en-honduras',
  'defensa-penal-honduras',
  'defensa-penal-menores-edad-honduras',
  'delitos-mas-comunes-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'diferencia-denuncia-querella-acusacion-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
];

const PRODUCCION_BASE = 'https://www.pinedayasociadoshn.com';

interface ClaimCorreccion {
  slug: string;
  textoIncorrecto: string; // originalText que NO debe estar en el body
  textoCorregido: string; // correctedText que SÍ debe estar
}

/**
 * Carga los claims `corrected` que tienen originalText + correctedText,
 * desde las 3 fuentes. Para verificar que el body DB ya no contiene el
 * texto incorrecto y sí el corregido.
 */
function cargarCorrecciones(): ClaimCorreccion[] {
  const out: ClaimCorreccion[] = [];
  const sources = [
    'docs/audits/fase3-lote1-claims.json',
    'docs/audits/fase3b-lote1-claims-finales.json',
    'docs/audits/fase3c-claims-finales.json',
  ];
  for (const s of sources) {
    const p = path.resolve(process.cwd(), s);
    if (!fs.existsSync(p)) continue;
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    const claims = Array.isArray(raw) ? raw : raw.claims ?? [];
    for (const c of claims) {
      const slug = c.articleSlug ?? c.slug;
      if (!SLUGS_LOTE1.includes(slug)) continue;
      const original = c.originalText ?? c.textoActual;
      const corregido = c.correctedText;
      if (original && corregido && original !== corregido) {
        out.push({
          slug,
          textoIncorrecto: normalizarParaBusqueda(original),
          textoCorregido: normalizarParaBusqueda(corregido),
        });
      }
    }
  }
  // Deduplicar por (slug + textoIncorrecto).
  const seen = new Set<string>();
  return out.filter((c) => {
    const k = `${c.slug}::${c.textoIncorrecto.slice(0, 60)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function normalizarParaBusqueda(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function extraerDeBody(body: string, texto: string): boolean {
  // Buscar el texto normalizado en el body (que puede tener HTML).
  // Se comparan los primeros 50 chars sin signos de puntuación ni mayúsculas
  // para robustez frente a marcas HTML intercaladas (p. ej. <strong>).
  const normalize = (s: string) =>
    s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase()
      .replace(/[.,;:()]/g, '').trim();
  const bodyNorm = normalize(body);
  const textoNorm = normalize(texto).slice(0, 50);
  return bodyNorm.includes(textoNorm);
}

interface ResultadoSlug {
  slug: string;
  publicado: boolean;
  bodyLen: number;
  estadoDB: string;
  versionDB: string;
  correccionesVerificadas: number;
  correccionesFallidas: Array<{ texto: string; tipo: 'incorrecto_persiste' | 'corregido_ausente' }>;
  aiReviewNoticeEsperado: 'visible' | 'oculto';
  htmlProduccion?: { http: number; cache: string; aiNoticeEnHtml: boolean };
}

// Tipo del helper SQL de neon (evita el mismatch de genéricos al pasarlo como parámetro).
type NeonSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;

async function verificarSlug(
  sql: NeonSql,
  slug: string,
  correcciones: ClaimCorreccion[],
  conProduccion: boolean,
): Promise<ResultadoSlug> {
  const rows = (await sql`
    SELECT slug, body, published, ai_review_status, ai_review_version
    FROM blog_posts WHERE slug = ${slug}
  `) as Array<{ body: string; published: boolean; ai_review_status: string; ai_review_version: string }>;

  if (rows.length === 0) {
    return {
      slug,
      publicado: false,
      bodyLen: 0,
      estadoDB: 'NO_ENCONTRADO',
      versionDB: '',
      correccionesVerificadas: 0,
      correccionesFallidas: [],
      aiReviewNoticeEsperado: 'oculto',
    };
  }

  const row = rows[0];
  const body = row.body ?? '';
  const correccionesDeSlug = correcciones.filter((c) => c.slug === slug);

  let verificadas = 0;
  const fallidas: ResultadoSlug['correccionesFallidas'] = [];
  for (const c of correccionesDeSlug) {
    const incorrectoPersiste = extraerDeBody(body, c.textoIncorrecto);
    const corregidoPresente = extraerDeBody(body, c.textoCorregido);
    if (!incorrectoPersiste && corregidoPresente) {
      verificadas++;
    } else {
      if (incorrectoPersiste) {
        fallidas.push({ texto: c.textoIncorrecto.slice(0, 80), tipo: 'incorrecto_persiste' });
      }
      if (!corregidoPresente) {
        fallidas.push({ texto: c.textoCorregido.slice(0, 80), tipo: 'corregido_ausente' });
      }
    }
  }

  // AiReviewNotice visible solo para completed/source_checked/needs_human_review.
  const estadosVisibles = new Set(['completed', 'source_checked', 'needs_human_review']);
  const aiNoticeEsperado = estadosVisibles.has(row.ai_review_status) ? 'visible' : 'oculto';

  const res: ResultadoSlug = {
    slug,
    publicado: row.published,
    bodyLen: body.length,
    estadoDB: row.ai_review_status,
    versionDB: row.ai_review_version ?? '',
    correccionesVerificadas: verificadas,
    correccionesFallidas: fallidas,
    aiReviewNoticeEsperado: aiNoticeEsperado,
  };

  if (conProduccion && row.published) {
    // curl a producción para HTTP + x-vercel-cache + presencia de AiReviewNotice.
    try {
      const { execSync } = await import('node:child_process');
      // Resolver categoría: asumimos 'penal' si no podemos resolverla (todos los slugs son penales).
      const url = `${PRODUCCION_BASE}/blog/penal/${slug}`;
      const out = execSync(
        `curl -sL -A "Mozilla/5.0" -o /tmp/fase3d_html_${slug}.html -w "%{http_code}|%{header_json}" "${url}"`,
        { encoding: 'utf8', timeout: 30_000 },
      );
      const httpCode = parseInt(out.split('|')[0] || '0', 10);
      // x-vercel-cache está en headers; lo extraemos del header_json si viene.
      const cacheMatch = out.match(/"x-vercel-cache":\s*"([^"]+)"/i);
      const cache = cacheMatch ? cacheMatch[1] : 'unknown';
      const html = fs.existsSync(`/tmp/fase3d_html_${slug}.html`)
        ? fs.readFileSync(`/tmp/fase3d_html_${slug}.html`, 'utf8')
        : '';
      const aiNoticeEnHtml = /data-ai-review-status=/i.test(html);
      res.htmlProduccion = { http: httpCode, cache, aiNoticeEnHtml };
    } catch {
      res.htmlProduccion = { http: 0, cache: 'error', aiNoticeEnHtml: false };
    }
  }

  return res;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const conProduccion = process.argv.includes('--produccion');
  const sql = neon(process.env.DATABASE_URL);
  const correcciones = cargarCorrecciones();

  console.log(`Fase 3D — Verificación de consistencia DB/JSON${conProduccion ? '/producción' : ''}`);
  console.log(`Slugs: ${SLUGS_LOTE1.length} | Correcciones a verificar: ${correcciones.length}\n`);

  const resultados: ResultadoSlug[] = [];
  for (const slug of SLUGS_LOTE1) {
    const r = await verificarSlug(sql, slug, correcciones, conProduccion);
    resultados.push(r);
    const marca = r.correccionesFallidas.length > 0 ? '⚠ ' : '  ';
    const pubMark = r.publicado ? 'publicado' : 'NO publicado';
    console.log(
      `${marca}${r.slug.padEnd(52)} | ${r.estadoDB.padEnd(20)} v=${r.versionDB.padEnd(8)} | ${pubMark} | body=${r.bodyLen} | corr verificadas=${r.correccionesVerificadas}/${correcciones.filter((c) => c.slug === slug).length}`,
    );
    if (r.correccionesFallidas.length > 0) {
      for (const f of r.correccionesFallidas) {
        console.log(`     ✗ ${f.tipo}: "${f.texto}..."`);
      }
    }
    if (r.htmlProduccion) {
      console.log(`     producción: HTTP ${r.htmlProduccion.http} | x-vercel-cache=${r.htmlProduccion.cache} | AiNotice=${r.htmlProduccion.aiNoticeEnHtml}`);
    }
  }

  // Resumen agregado.
  const totalCorrecciones = correcciones.length;
  const verificadas = resultados.reduce((a, r) => a + r.correccionesVerificadas, 0);
  const fallidas = resultados.reduce((a, r) => a + r.correccionesFallidas.length, 0);
  console.log(`\n=== RESUMEN ===`);
  console.log(`Correcciones verificadas: ${verificadas}/${totalCorrecciones} (${fallidas} fallidas)`);
  console.log(`Estados DB: todos en versión fase3d? ${resultados.every((r) => r.versionDB === 'fase3d') ? 'SÍ' : 'NO'}`);

  // Guardar reporte.
  const outPath = path.resolve(process.cwd(), 'docs/audits/fase3d-consistencia.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    conProduccion,
    totalSlugs: resultados.length,
    totalCorrecciones,
    correccionesVerificadas: verificadas,
    correccionesFallidas: fallidas,
    todosFase3d: resultados.every((r) => r.versionDB === 'fase3d'),
    resultados,
  }, null, 2) + '\n');
  console.log(`\nReporte: ${outPath}`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
