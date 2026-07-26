/**
 * Fase 3 — Invalidación del Lote 1 Penal (revisión GPT-4o inválida)
 *
 * La ejecución anterior utilizó GPT-4o bajo scripts/fase3-ejecutor-openai.ts
 * y registró incorrectamente "Gemini 3.6 Flash" como modelo en ai_review_model.
 * La ejecución es inválida y debe revertirse.
 *
 * Este script:
 *   --dry-run: Muestra diff de cambios (sin modificar DB)
 *   --aplicar:  Restaura body, updated_at y resetea ai_review_* en transacción
 *
 * Backup utilizado: auditoria-blog/backup-2026-07-26-08-39.json
 * SHA-256: 1a86eceaec899bdd6d808c5e422f43049bf04c1ada73391911753e2de2b72329
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

const BACKUP_PATH = path.resolve(
  process.cwd(),
  'auditoria-blog/backup-2026-07-26-08-39.json',
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

const AI_REVIEW_COLUMNS = [
  'ai_review_status',
  'ai_reviewed_at',
  'ai_review_model',
  'ai_review_version',
  'ai_review_confidence',
  'ai_review_sources',
  'ai_review_claims_count',
  'ai_review_confirmed_claims',
  'ai_review_corrected_claims',
  'ai_review_unresolved_claims',
];

interface BackupPost {
  slug: string;
  body: string;
  updated_at: string | null;
  [key: string]: unknown;
}

interface DbPost {
  slug: string;
  body: string;
  updated_at: string | null;
  ai_review_status: string | null;
  ai_review_model: string | null;
  ai_review_claims_count: number | null;
  ai_review_confirmed_claims: number | null;
  ai_review_corrected_claims: number | null;
}

function computeSHA256(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const aplicar = process.argv.includes('--aplicar');

  if (!dryRun && !aplicar) {
    console.error('❌ Especifica --dry-run o --aplicar');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no configurada.');
    process.exit(1);
  }

  // Verify backup exists
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error(`❌ Backup no encontrado: ${BACKUP_PATH}`);
    process.exit(1);
  }

  const backupHash = computeSHA256(BACKUP_PATH);
  console.log(`📁 Backup: ${BACKUP_PATH}`);
  console.log(`🔐 SHA-256: ${backupHash}`);
  console.log();

  // Load backup
  const backupRaw = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
  const backupPosts: BackupPost[] = backupRaw.posts || [];
  const backupMap = new Map<string, BackupPost>();
  for (const bp of backupPosts) {
    backupMap.set(bp.slug, bp);
  }

  // Verify all 15 slugs exist in backup
  const missingInBackup = SLUGS_LOTE1.filter((s) => !backupMap.has(s));
  if (missingInBackup.length > 0) {
    console.error(
      `❌ ${missingInBackup.length} slug(s) no encontrados en el backup: ${missingInBackup.join(', ')}`,
    );
    process.exit(1);
  }

  console.log('✅ Los 15 slugs existen en el backup.\n');

  const sql = neon(process.env.DATABASE_URL);

  // Fetch current DB state for the 15 posts
  const dbPosts = await sql`
    SELECT slug, body, updated_at, 
           ai_review_status, ai_reviewed_at, ai_review_model,
           ai_review_version, ai_review_confidence, ai_review_sources,
           ai_review_claims_count, ai_review_confirmed_claims,
           ai_review_corrected_claims, ai_review_unresolved_claims
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
  ` as DbPost[];

  const dbMap = new Map<string, DbPost>();
  for (const dp of dbPosts) {
    dbMap.set(dp.slug, dp);
  }

  // Build diff report
  console.log('═'.repeat(70));
  console.log('  INFORME DE INVALIDACIÓN — LOTE 1 PENAL');
  console.log('═'.repeat(70));
  console.log();
  console.log('Razón: Ejecución inválida porque utilizó GPT-4o y declaró');
  console.log('       incorrectamente Gemini 3.6 Flash como modelo.');
  console.log();
  console.log(`Backup utilizado: ${path.basename(BACKUP_PATH)}`);
  console.log(`SHA-256: ${backupHash}`);
  console.log();
  console.log(`Modo: ${dryRun ? 'DRY-RUN (sin cambios)' : 'APLICAR (cambios reales)'}`);
  console.log();

  let totalCambios = 0;
  const cambios: string[] = [];

  for (const slug of SLUGS_LOTE1) {
    const backup = backupMap.get(slug);
    const db = dbMap.get(slug);

    if (!backup || !db) {
      console.log(`⚠️  ${slug}: no encontrado en DB o backup`);
      continue;
    }

    const bodyCambiado = backup.body !== db.body;
    const updatedAtCambiado = backup.updated_at !== db.updated_at;

    const aiReviewModificado =
      db.ai_review_status !== 'not_started' &&
      db.ai_review_status !== null &&
      db.ai_review_status !== undefined;

    if (!bodyCambiado && !updatedAtCambiado && !aiReviewModificado) {
      console.log(`  ✅ ${slug}: sin cambios`);
      continue;
    }

    totalCambios++;
    console.log(`\n📝 ${slug}:`);
    cambios.push(slug);

    if (bodyCambiado) {
      console.log(`   body: MODIFICADO (${db.body.length} → ${backup.body.length} bytes)`);
    }
    if (updatedAtCambiado) {
      console.log(`   updated_at: "${db.updated_at}" → "${backup.updated_at}"`);
    }
    if (aiReviewModificado) {
      console.log(`   ai_review_status: "${db.ai_review_status}" → "not_started"`);
      console.log(`   ai_review_model: "${db.ai_review_model}" → null`);
      console.log(`   ai_review_claims_count: ${db.ai_review_claims_count} → 0`);
      console.log(`   ai_review_confirmed_claims: ${db.ai_review_confirmed_claims} → 0`);
      console.log(`   ai_review_corrected_claims: ${db.ai_review_corrected_claims} → 0`);
    }
  }

  console.log();
  console.log('═'.repeat(70));
  console.log(`  Total registros con cambios: ${totalCambios}`);
  console.log('═'.repeat(70));

  if (dryRun) {
    console.log('\n⚠️  DRY-RUN completado. Sin cambios en la DB.');
    console.log('   Ejecuta con --aplicar para restaurar los 15 posts.');
    return;
  }

  // --aplicar: Execute restoration in transaction
  console.log('\n🔄 Aplicando restauración...');

  try {
    await sql`BEGIN`;

    for (const slug of SLUGS_LOTE1) {
      const backup = backupMap.get(slug);
      if (!backup) continue;

      await sql`
        UPDATE blog_posts
        SET
          body = ${backup.body},
          updated_at = ${backup.updated_at ? new Date(backup.updated_at) : null}::timestamptz,
          ai_review_status = 'not_started',
          ai_reviewed_at = NULL,
          ai_review_model = NULL,
          ai_review_version = NULL,
          ai_review_confidence = NULL,
          ai_review_sources = '[]'::jsonb,
          ai_review_claims_count = 0,
          ai_review_confirmed_claims = 0,
          ai_review_corrected_claims = 0,
          ai_review_unresolved_claims = 0
        WHERE slug = ${slug}
      `;
      console.log(`   ✅ ${slug}: restaurado`);
    }

    await sql`COMMIT`;
    console.log('\n✅ Transacción confirmada. 15 posts restaurados.');
  } catch (err) {
    await sql`ROLLBACK`;
    console.error('❌ Error en transacción, rollback ejecutado:', err);
    process.exit(1);
  }

  // Verification
  console.log('\n🔍 Verificando restauración...');
  const verificados = await sql`
    SELECT slug, ai_review_status, ai_review_model, ai_review_claims_count, updated_at
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
    ORDER BY slug
  `;

  let verificacionesOk = 0;
  for (const v of verificados as any[]) {
    const ok =
      v.ai_review_status === 'not_started' &&
      v.ai_review_model === null &&
      v.ai_review_claims_count === 0;
    console.log(
      `   ${ok ? '✅' : '❌'} ${v.slug}: status=${v.ai_review_status} model=${v.ai_review_model} claims=${v.ai_review_claims_count} updated_at=${v.updated_at}`,
    );
    if (ok) verificacionesOk++;
  }

  console.log(`\n✅ ${verificacionesOk}/15 verificaciones correctas.`);
  if (verificacionesOk < 15) {
    console.error('⚠️  Algunos registros no se restauraron correctamente.');
    process.exit(1);
  }
}

main().catch(console.error);
