/**
 * Fase 4A — Backup y estado inicial del Lote 2.
 *
 * Exporta los 15 artículos del Lote 2 desde Neon con:
 *   - contenido completo (body);
 *   - metadatos (title, description, category, tags, SEO);
 *   - estado de revisión IA completo (ai_review_*);
 *   - revisión humana (review_status, reviewed_by, reviewed_at);
 *   - claims existentes (si los hubo en Fase 3);
 *   - hash SHA-256 individual por artículo;
 *   - hash SHA-256 global del lote.
 *
 * El backup no contiene secretos (solo datos de blog_posts) y permite restaurar
 * DB, contenido y estados en caso necesario.
 *
 * Salida:
 *   - docs/audits/fase4a-lote2-estados-iniciales.json
 *   - docs/audits/fase4a-lote2-inventario-claims.json
 *   - data/lote2-backup.json   (backup completo restaurable, NO se commitea)
 *
 * Uso:
 *   npx tsx scripts/fase4a-exportar-lote2.ts
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

// Slugs del Lote 2 (leídos del artefacto de selección para mantener una sola
// fuente de verdad sobre quiénes son los 15).
function leerSlugsLote2(): string[] {
  const sel = JSON.parse(fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-seleccion.json'), 'utf8'));
  return sel.lote2.map((e: { slug: string }) => e.slug);
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const slugs = leerSlugsLote2();
  console.log(`Lote 2: ${slugs.length} slugs a respaldar.`);

  const posts = (await sql`
    SELECT
      id, slug, title, body, description, category, tags,
      published, published_at, updated_at, creado_en,
      meta_title, meta_description, author, author_id, canonical_url,
      cover_image, reading_time, featured, noindex,
      -- Revisión legal humana
      review_status, reviewed_by, reviewed_at, legal_review_notes,
      -- Revisión IA (Fase 3)
      ai_review_status, ai_reviewed_at, ai_review_provider, ai_review_model,
      ai_review_version, ai_review_confidence, ai_review_sources,
      ai_review_claims_count, ai_review_confirmed_claims,
      ai_review_corrected_claims, ai_review_unresolved_claims,
      ai_review_requires_human, ai_research_provider, ai_search_queries_count,
      ai_official_sources_count,
      last_reviewed_at, next_review_due_at
    FROM blog_posts
    WHERE slug = ANY(${slugs})
    ORDER BY slug
  `) as Record<string, unknown>[];

  if (posts.length !== slugs.length) {
    const encontrados = new Set(posts.map((p) => p.slug));
    const faltantes = slugs.filter((s) => !encontrados.has(s));
    console.error(`ERROR: faltan en DB ${faltantes.length} slugs: ${faltantes.join(', ')}`);
    process.exit(1);
  }

  // --- Hash individual (sobre body + metadatos editoriales + estado IA) ---
  const estadosIniciales = posts.map((p) => {
    const payload = JSON.stringify({
      slug: p.slug,
      title: p.title,
      body: p.body,
      description: p.description,
      category: p.category,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      canonical_url: p.canonical_url,
      ai_review_status: p.ai_review_status,
      ai_review_claims_count: p.ai_review_claims_count,
      ai_review_confirmed_claims: p.ai_review_confirmed_claims,
      ai_review_corrected_claims: p.ai_review_corrected_claims,
      ai_review_unresolved_claims: p.ai_review_unresolved_claims,
      ai_review_requires_human: p.ai_review_requires_human,
      ai_official_sources_count: p.ai_official_sources_count,
      updated_at: p.updated_at,
    });
    const hash = sha256(payload);
    return {
      slug: p.slug,
      title: p.title,
      category: p.category,
      estadoIA: p.ai_review_status ?? 'not_started',
      claimsCount: Number(p.ai_review_claims_count ?? 0),
      confirmedClaims: Number(p.ai_review_confirmed_claims ?? 0),
      correctedClaims: Number(p.ai_review_corrected_claims ?? 0),
      unresolvedClaims: Number(p.ai_review_unresolved_claims ?? 0),
      requiresHuman: Boolean(p.ai_review_requires_human),
      officialSources: Number(p.ai_official_sources_count ?? 0),
      reviewStatusHumana: p.review_status ?? 'published',
      updatedAt: p.updated_at,
      bodyLength: Number((p.body as string)?.length ?? 0),
      hashSha256: hash,
    };
  });

  const hashGlobal = sha256(estadosIniciales.map((e) => e.hashSha256).join('\n'));

  const estadosJson = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    enunciadoSeccion: '§4',
    total: estadosIniciales.length,
    hashGlobalSha256: hashGlobal,
    distribucionEstadosIA: contar(estadosIniciales.map((e) => e.estadoIA as string)),
    estados: estadosIniciales,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase4a-lote2-estados-iniciales.json'),
    JSON.stringify(estadosJson, null, 2),
  );

  // --- Inventario de claims existentes (los que ya trae ai_review_sources) -
  const inventarioClaims = posts.map((p) => {
    const fuentes = Array.isArray(p.ai_review_sources) ? p.ai_review_sources : [];
    return {
      slug: p.slug,
      estadoIA: p.ai_review_status ?? 'not_started',
      claimsRegistradosCount: Number(p.ai_review_claims_count ?? 0),
      fuentesRegistradas: fuentes,
      procedenciaFuentes: clasificarProcedencia(fuentes as { url?: string }[]),
      tieneClaimsEnJson3x: false, // Lote 2 no estuvo en Fase 3
      necesitaExtraccionCompleta: true,
    };
  });
  const invClaimsJson = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    enunciadoSeccion: '§4-§5',
    nota:
      'Ninguno de los 15 artículos del Lote 2 fue procesado en Fase 3. Por tanto, ' +
      'el inventario completo de claims se construirá desde cero en la Fase 4A §5. ' +
      'No se conservan estados anteriores porque no hay inventario de claims previo.',
    total: inventarioClaims.length,
    claimsExistentesTotales: inventarioClaims.reduce((a, e) => a + e.claimsRegistradosCount, 0),
    inventario: inventarioClaims,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase4a-lote2-inventario-claims.json'),
    JSON.stringify(invClaimsJson, null, 2),
  );

  // --- Backup completo restaurable (NO se commitea: data/lote2-backup.json) -
  const backup = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    proposito: 'Restauración completa de bodies, metadatos y estados del Lote 2.',
    hashGlobalSha256: hashGlobal,
    total: posts.length,
    posts,
  };
  const backupPath = path.join(ROOT, 'data', 'lote2-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`OK: ${posts.length} artículos respaldados.`);
  console.log(`  hash global SHA-256: ${hashGlobal}`);
  console.log('  -> docs/audits/fase4a-lote2-estados-iniciales.json');
  console.log('  -> docs/audits/fase4a-lote2-inventario-claims.json');
  console.log(`  -> ${backupPath} (NO se commitea)`);
  console.log('Distribución estados IA iniciales:', estadosJson.distribucionEstadosIA);
}

function contar(arr: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of arr) out[v] = (out[v] ?? 0) + 1;
  return out;
}

function clasificarProcedencia(fuentes: { url?: string }[]): Record<string, number> {
  const out: Record<string, number> = { oficial: 0, institucional: 0, interna: 0, sin_clasificar: 0 };
  for (const f of fuentes) {
    const url = (f.url ?? '').toLowerCase();
    if (/\.gob\.hn|gacetaoficial|poderjudicial|tsc\.gob|congreso\.gob|presidencia\.gob|ministeriopublico/.test(url)) out.oficial++;
    else if (url && /\.(org|edu|internacional)/.test(url)) out.institucional++;
    else if (url && /pinedayasociadoshn/.test(url)) out.interna++;
    else out.sin_clasificar++;
  }
  return out;
}

main().catch((e) => {
  console.error('ERROR fatal:', e);
  process.exit(1);
});
