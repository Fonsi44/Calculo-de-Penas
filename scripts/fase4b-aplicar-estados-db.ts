/**
 * Fase 4B §6 — Aplicar estados definitivos del Lote 2 a la DB Neon.
 *
 * Autorización explícita del usuario (Fase 4B §6 + decisión de sesión).
 *
 * Lo que hace:
 *   1. Lee docs/audits/fase4b-estados-definitivos.json (fuente canónica).
 *   2. Para cada uno de los 15 artículos del Lote 2, actualiza:
 *        ai_review_status            -> estadoFase4B
 *        ai_review_requires_human    -> requiresHuman
 *        ai_reviewed_at              -> NOW()
 *        ai_review_provider          -> 'reglas-locales'
 *        ai_review_model             -> 'fase4b-puerta-integridad'
 *        ai_review_version           -> '4b.1'
 *        ai_review_confirmed_claims  -> centralConfirmed
 *        ai_review_corrected_claims  -> centralCorrectedAplicado
 *        ai_review_unresolved_claims -> centralUnresolved
 *        ai_official_sources_count   -> officialSources
 *   3. NO toca body, title, description, slug, ni ninguna otra columna.
 *   4. Acota con WHERE slug = ANY(lista-de-15) para no afectar otros posts.
 *
 * Uso:
 *   npx tsx scripts/fase4b-aplicar-estados-db.ts --dry-run
 *   npx tsx scripts/fase4b-aplicar-estados-db.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

interface EstadoDef {
  slug: string;
  estadoFase4B: string;
  centralConfirmed: number;
  centralCorrectedAplicado: number;
  centralUnresolved: number;
  officialSources: number;
  requiresHuman: boolean;
}

async function main() {
  const modo = process.argv.includes('--aplicar') ? 'aplicar' : 'dry-run';
  console.log(`Modo: ${modo}`);

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const def = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4b-estados-definitivos.json'), 'utf8'),
  );
  const estados = def.estadosDefinitivos as EstadoDef[];
  if (estados.length !== 15) {
    console.error(`ERROR: esperaba 15 estados, encontré ${estados.length}.`);
    process.exit(1);
  }

  // Verificación previa: los 15 slugs existen y están published en DB.
  const slugs = estados.map((e) => e.slug);
  const existe = (await sql`
    SELECT slug FROM blog_posts WHERE slug = ANY(${slugs}) AND published = true
  `) as { slug: string }[];
  const existeSet = new Set(existe.map((e) => e.slug));
  const faltan = slugs.filter((s) => !existeSet.has(s));
  if (faltan.length > 0) {
    console.error(`ERROR: slugs faltantes o no publicados: ${faltan.join(', ')}`);
    process.exit(1);
  }
  console.log(`OK: 15/15 slugs existen y están published.`);

  const resultados: unknown[] = [];
  for (const e of estados) {
    if (modo === 'aplicar') {
      const res = await sql`
        UPDATE blog_posts SET
          ai_review_status              = ${e.estadoFase4B},
          ai_review_requires_human      = ${e.requiresHuman},
          ai_reviewed_at                = NOW(),
          ai_review_provider            = 'reglas-locales',
          ai_review_model               = 'fase4b-puerta-integridad',
          ai_review_version             = '4b.1',
          ai_review_confirmed_claims    = ${e.centralConfirmed},
          ai_review_corrected_claims    = ${e.centralCorrectedAplicado},
          ai_review_unresolved_claims   = ${e.centralUnresolved},
          ai_official_sources_count     = ${e.officialSources}
        WHERE slug = ${e.slug} AND published = true
        RETURNING slug, ai_review_status, ai_review_requires_human
      `;
      resultados.push((res as unknown[])[0]);
    } else {
      resultados.push({
        slug: e.slug,
        ai_review_status: e.estadoFase4B,
        ai_review_requires_human: e.requiresHuman,
        centralConfirmed: e.centralConfirmed,
        centralCorrectedAplicado: e.centralCorrectedAplicado,
        centralUnresolved: e.centralUnresolved,
        officialSources: e.officialSources,
      });
    }
  }

  // Guardar evidencia de la aplicación
  const evidencia = {
    generatedAt: new Date().toISOString(),
    fase: '4B',
    lote: 2,
    enunciadoSeccion: '§6',
    modo,
    descripcion:
      'Aplicación de ai_review_status + ai_review_requires_human + ' +
      'conteos derivados a los 15 artículos del Lote 2. No toca body/title/description.',
    fuenteCanonica: 'docs/audits/fase4b-estados-definitivos.json',
    provider: 'reglas-locales',
    model: 'fase4b-puerta-integridad',
    version: '4b.1',
    total: resultados.length,
    resultados,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase4b-aplicacion-estados-db.json'),
    JSON.stringify(evidencia, null, 2),
  );

  console.log(`\nOK (${modo}): ${resultados.length}/15 artículos procesados.`);
  console.log('  -> docs/audits/fase4b-aplicacion-estados-db.json');
}

main().catch((e) => {
  console.error('ERROR fatal:', e);
  process.exit(1);
});
