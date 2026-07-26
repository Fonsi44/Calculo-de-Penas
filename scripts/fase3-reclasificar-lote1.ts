/**
 * Fase 3 — Reclasificar estados del Lote 1 Penal
 *
 * Corrige la contradicción: 79 claims no resueltos pero 15 artículos con
 * status=completed. Aplica semántica correcta de estados.
 *
 * Estados:
 *   completed          — 0 claims centrales unresolved, fuentes verificadas
 *   source_checked     — Búsquedas realizadas, claims centrales mayormente cubiertos
 *   needs_human_review — ≥1 claim central sin confirmar
 *   blocked            — Sin acceso a fuentes esenciales
 *   corrected          — Transitorio: corregido pero sin verificación final
 *
 * Uso:
 *   npx tsx scripts/fase3-reclasificar-lote1.ts --dry-run
 *   npx tsx scripts/fase3-reclasificar-lote1.ts --aplicar
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

const BACKUP_DIR = path.resolve(process.cwd(), 'auditoria-blog');
const CLAIMS_PATH = path.resolve(
  process.cwd(),
  'docs/audits/fase3-lote1-claims-con-importancia.json',
);
const DEEPSEEK_PATH = path.resolve(
  process.cwd(),
  'docs/audits/fase3-lote1-deepseek.json',
);

const SLUGS_LOTE1 = [
  'delitos-mas-comunes-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'diferencia-denuncia-querella-acusacion-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'antejuicio-en-honduras',
  'abogado-penalista-sur-honduras',
  'defensa-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'cuando-prescribe-delito-en-honduras',
  'defensa-penal-menores-edad-honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'abogado-penalista-choluteca',
];

interface ClaimImportance {
  articleSlug: string;
  claim: string;
  classification: string;
  importance: 'central' | 'supporting' | 'contextual';
  reason: string;
}

interface ArticleReclass {
  slug: string;
  currentStatus: string;
  proposedStatus: string;
  confidence: string;
  totalClaims: number;
  confirmedClaims: number;
  correctedClaims: number;
  unresolvedClaims: number;
  centralConfirmed: number;
  centralCorrected: number;
  centralUnresolved: number;
  officialSources: number;
  reason: string;
  requiresHuman: boolean;
}

function determineStatus(article: ArticleReclass): string {
  const totalCentral = article.centralConfirmed + article.centralCorrected + article.centralUnresolved;

  if (article.officialSources === 0 && article.centralUnresolved > 0 && article.centralConfirmed === 0) {
    return 'blocked';
  }

  if (article.officialSources === 0 && totalCentral <= 1 && article.centralUnresolved <= 1) {
    return 'blocked';
  }

  if (article.centralUnresolved > 0 && article.centralConfirmed === 0) {
    if (article.officialSources === 0) return 'blocked';
    return 'needs_human_review';
  }

  if (article.centralUnresolved >= 3) {
    return 'needs_human_review';
  }

  if (article.centralUnresolved >= 1 && article.centralUnresolved <= 2) {
    if (article.centralConfirmed + article.centralCorrected >= 3) {
      return 'source_checked';
    }
    return 'needs_human_review';
  }

  if (article.centralUnresolved === 0 && article.officialSources > 0) {
    return 'completed';
  }

  return 'needs_human_review';
}

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

  // Load claims with importance
  if (!fs.existsSync(CLAIMS_PATH)) {
    console.error(`No se encontró ${CLAIMS_PATH}`);
    process.exit(1);
  }
  const claimsWithImportance: ClaimImportance[] = JSON.parse(
    fs.readFileSync(CLAIMS_PATH, 'utf-8'),
  );

  // Build per-article stats
  const articleStats = new Map<string, {
    centralConfirmed: number;
    centralCorrected: number;
    centralUnresolved: number;
    supportingCount: number;
    contextualCount: number;
  }>();

  for (const slug of SLUGS_LOTE1) {
    articleStats.set(slug, {
      centralConfirmed: 0,
      centralCorrected: 0,
      centralUnresolved: 0,
      supportingCount: 0,
      contextualCount: 0,
    });
  }

  for (const c of claimsWithImportance) {
    const stats = articleStats.get(c.articleSlug);
    if (!stats) continue;

    if (c.importance === 'central') {
      if (c.classification.startsWith('confirmed')) stats.centralConfirmed++;
      else if (c.classification === 'incorrect' || c.classification === 'outdated') stats.centralCorrected++;
      else stats.centralUnresolved++;
    } else if (c.importance === 'supporting') {
      stats.supportingCount++;
    } else {
      stats.contextualCount++;
    }
  }

  // Fetch current DB state
  const sql = neon(process.env.DATABASE_URL);
  const dbPosts = await sql`
    SELECT slug, ai_review_status, ai_review_confidence,
           ai_review_claims_count, ai_review_confirmed_claims,
           ai_review_corrected_claims, ai_review_unresolved_claims,
           ai_review_requires_human, ai_official_sources_count
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
    ORDER BY slug
  ` as any[];

  // Build reclassification table
  const reclassifications: ArticleReclass[] = [];

  console.log('═'.repeat(80));
  console.log('  RECLASIFICACIÓN DE ESTADOS — LOTE 1 PENAL');
  console.log('═'.repeat(80));
  console.log();

  for (const post of dbPosts) {
    const stats = articleStats.get(post.slug);
    if (!stats) continue;

    const article: ArticleReclass = {
      slug: post.slug,
      currentStatus: post.ai_review_status,
      proposedStatus: '',
      confidence: post.ai_review_confidence || 'low',
      totalClaims: post.ai_review_claims_count || 0,
      confirmedClaims: post.ai_review_confirmed_claims || 0,
      correctedClaims: post.ai_review_corrected_claims || 0,
      unresolvedClaims: post.ai_review_unresolved_claims || 0,
      centralConfirmed: stats.centralConfirmed,
      centralCorrected: stats.centralCorrected,
      centralUnresolved: stats.centralUnresolved,
      officialSources: post.ai_official_sources_count || 0,
      reason: '',
      requiresHuman: post.ai_review_requires_human || false,
    };

    article.proposedStatus = determineStatus(article);

    // Build reason
    const parts: string[] = [];
    if (article.centralUnresolved > 0) {
      parts.push(`${article.centralUnresolved} claims centrales sin confirmar`);
    }
    if (article.officialSources === 0) {
      parts.push('sin fuentes oficiales abiertas');
    } else {
      parts.push(`${article.officialSources} fuentes oficiales`);
    }
    if (article.centralUnresolved === 0 && article.officialSources > 0) {
      parts.push('todos los claims centrales verificados');
    }
    if (article.centralConfirmed + article.centralCorrected >= 3 && article.centralUnresolved <= 2) {
      parts.push('mayoría de claims centrales cubiertos');
    }
    if (article.requiresHuman) {
      parts.push('DeepSeek marcó revisión humana necesaria');
    }
    article.reason = parts.join('; ');

    reclassifications.push(article);
  }

  // Display
  let cambiados = 0;
  for (const r of reclassifications) {
    const cambiar = r.currentStatus !== r.proposedStatus;
    if (cambiar) cambiados++;
    const flag = cambiar ? '🔴' : '✅';
    console.log(`${flag} ${r.slug}`);
    console.log(`   Estado actual:  ${r.currentStatus}`);
    if (cambiar) console.log(`   Estado propuesto: ${r.proposedStatus}`);
    console.log(`   Claims: ${r.totalClaims} total (${r.confirmedClaims} conf, ${r.correctedClaims} corr, ${r.unresolvedClaims} unres)`);
    console.log(`   Centrales: ${r.centralConfirmed} conf + ${r.centralCorrected} corr + ${r.centralUnresolved} unres = ${r.centralConfirmed + r.centralCorrected + r.centralUnresolved}`);
    console.log(`   Fuentes: ${r.officialSources} | Confianza: ${r.confidence} | Humana: ${r.requiresHuman}`);
    console.log(`   Razón: ${r.reason}`);
    console.log();
  }

  console.log('═'.repeat(80));
  console.log(`  Artículos que cambiarán de estado: ${cambiados}/${reclassifications.length}`);
  console.log('═'.repeat(80));

  // Save reclassification data
  const estadosPath = path.resolve(process.cwd(), 'docs/audits/fase3-lote1-estados.json');
  fs.writeFileSync(estadosPath, JSON.stringify(reclassifications, null, 2));

  if (dryRun) {
    console.log('\n⚠️  DRY-RUN. Sin cambios en DB.');
    console.log(`   Estados guardados en: ${estadosPath}`);
    return;
  }

  // Backup
  const backupTs = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-pre-reclasificacion-${backupTs}.json`);
  const allPosts = await sql`SELECT * FROM blog_posts WHERE slug = ANY(${SLUGS_LOTE1})`;
  fs.writeFileSync(backupPath, JSON.stringify(allPosts, null, 2));
  console.log(`\n📁 Backup: ${backupPath}`);

  // Apply
  console.log('\n🔄 Aplicando reclasificación...');
  try {
    await sql`BEGIN`;

    for (const r of reclassifications) {
      if (r.currentStatus === r.proposedStatus) continue;

      await sql`
        UPDATE blog_posts
        SET ai_review_status = ${r.proposedStatus},
            ai_review_requires_human = ${r.proposedStatus === 'needs_human_review' || r.requiresHuman}
        WHERE slug = ${r.slug}
      `;
      console.log(`   ✅ ${r.slug}: ${r.currentStatus} → ${r.proposedStatus}`);
    }

    await sql`COMMIT`;
    console.log('\n✅ Transacción confirmada.');
  } catch (err) {
    await sql`ROLLBACK`;
    console.error('❌ Error en transacción, rollback ejecutado:', err);
    process.exit(1);
  }

  // Verify
  console.log('\n🔍 Verificando...');
  const verified = await sql`
    SELECT slug, ai_review_status, ai_review_requires_human
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
    ORDER BY slug
  ` as any[];

  let ok = 0;
  for (const v of verified) {
    const expected = reclassifications.find((r) => r.slug === v.slug);
    const match = expected && v.ai_review_status === expected.proposedStatus;
    if (match) ok++;
    console.log(`   ${match ? '✅' : '❌'} ${v.slug}: ${v.ai_review_status} (human=${v.ai_review_requires_human})`);
  }
  console.log(`\n✅ ${ok}/${reclassifications.length} verificaciones correctas.`);
}

main().catch(console.error);
