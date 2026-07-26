/**
 * Fase 3 — Aplicar Correcciones DeepSeek
 *
 * Lee docs/audits/fase3-lote1-deepseek.json y aplica correcciones a la DB.
 * Solo corrige texto (body), NO toca revisión humana.
 *
 * Uso:
 *   npx tsx scripts/fase3-aplicar.ts --dry-run
 *   npx tsx scripts/fase3-aplicar.ts --aplicar
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { deriveReviewStatus } from '../lib/ai/review-status';
import { DEEPSEEK_MODEL } from '../lib/ai/deepseek-blog-review';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

const DEEPSEEK_RESULTS = path.resolve(
  process.cwd(),
  'docs/audits/fase3-lote1-deepseek.json',
);

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const aplicar = process.argv.includes('--aplicar');

  if (!dryRun && !aplicar) {
    console.error('Especifica --dry-run o --aplicar');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }

  if (!fs.existsSync(DEEPSEEK_RESULTS)) {
    console.error(`No se encontró ${DEEPSEEK_RESULTS}. Ejecuta primero fase3-ejecutor-deepseek.ts`);
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(DEEPSEEK_RESULTS, 'utf-8'));
  console.log(`Artículos a procesar: ${results.length}`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}\n`);

  const sql = neon(process.env.DATABASE_URL);
  let totalCorreccionesAplicadas = 0;

  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.slug}: error en análisis, saltando.`);
      continue;
    }

    const claims = result.claims || [];
    const corrected = claims.filter(
      (c: any) =>
        (c.classification === 'incorrect' || c.classification === 'outdated') &&
        c.originalText &&
        c.correctedText,
    );

    const confirmed = claims.filter((c: any) =>
      c.classification.startsWith('confirmed'),
    ).length;
    const unresolved = claims.filter(
      (c: any) =>
        c.classification === 'unsupported' ||
        c.classification === 'ambiguous' ||
        c.classification === 'requires_human_judgment',
    ).length;
    const requiresHuman = claims.filter((c: any) => c.requiresHumanReview).length;

    console.log(`📝 ${result.slug}`);
    console.log(
      `   Claims: ${claims.length} total, ${confirmed} confirmados, ${corrected.length} corregidos, ${unresolved} no resueltos`,
    );

    if (corrected.length === 0) {
      console.log(`   ✅ Sin correcciones textuales.`);
    }

    // Fetch current body
    const [post] = await sql`
      SELECT body, ai_review_status FROM blog_posts WHERE slug = ${result.slug}
    ` as any[];

    if (!post) {
      console.log(`   ⚠️ Post no encontrado en DB.`);
      continue;
    }

    let updatedBody = post.body;
    let appliedCount = 0;

    for (const c of corrected) {
      if (updatedBody.includes(c.originalText)) {
        if (dryRun) {
          console.log(`   [DRY-RUN] "${c.originalText.substring(0, 60)}..." → "${c.correctedText.substring(0, 60)}..."`);
          appliedCount++;
        } else {
          updatedBody = updatedBody.replace(c.originalText, c.correctedText);
          appliedCount++;
          console.log(`   ✏️ "${c.originalText.substring(0, 60)}..." → "${c.correctedText.substring(0, 60)}..."`);
        }
      } else {
        console.log(`   ⚠️ Claim no encontrado exactamente: "${c.originalText.substring(0, 80)}..."`);
      }
    }

    const sources = claims
      .filter((c: any) => c.officialSource?.url)
      .map((c: any) => c.officialSource.url);

    // === Fase 3B: derivar estado honestamente (no hardcodear 'completed') ===
    // Contar claims centrales (aproximación: todos los claims son centrales salvo
    // que se indique lo contrario; fase3-reclasificar usa la clasificación con
    // importancia para el recálculo fino).
    const centralConfirmed = claims.filter((c: any) =>
      String(c.classification || '').startsWith('confirmed'),
    ).length;
    const centralCorrected = corrected.length;
    const centralUnresolved = claims.filter(
      (c: any) =>
        c.classification === 'unsupported' ||
        c.classification === 'ambiguous' ||
        c.classification === 'requires_human_judgment',
    ).length;

    const { status: derivedStatus, reason: derivedReason } = deriveReviewStatus({
      centralConfirmed,
      centralCorrected,
      centralUnresolved,
      officialSources: sources.length,
      requiresHuman: requiresHuman > 0,
    });

    console.log(
      `   📊 Estado derivado: ${derivedStatus} — ${derivedReason}`,
    );

    if (!dryRun) {
      await sql`
        UPDATE blog_posts
        SET
          body = ${updatedBody},
          updated_at = NOW(),
          ai_review_status = ${derivedStatus},
          ai_reviewed_at = NOW(),
          ai_review_provider = ${result.provider || 'DeepSeek'},
          ai_review_model = ${result.model || DEEPSEEK_MODEL},
          ai_review_version = '1.0',
          ai_review_confidence = ${result.overallConfidence || 'medium'},
          ai_review_sources = ${JSON.stringify(sources)}::jsonb,
          ai_review_claims_count = ${claims.length},
          ai_review_confirmed_claims = ${confirmed},
          ai_review_corrected_claims = ${appliedCount},
          ai_review_unresolved_claims = ${unresolved},
          ai_review_requires_human = ${requiresHuman > 0},
          ai_research_provider = 'Google Search',
          ai_search_queries_count = ${result.searchQueriesCount || 0},
          ai_official_sources_count = ${sources.length}
        WHERE slug = ${result.slug}
      `;

      console.log(`   ✅ DB actualizada: ${appliedCount} correcciones, estado=${derivedStatus}.`);
    }

    totalCorreccionesAplicadas += appliedCount;
  }

  console.log(`\n📊 TOTAL: ${totalCorreccionesAplicadas} correcciones textuales aplicadas.`);
}

main().catch(console.error);
