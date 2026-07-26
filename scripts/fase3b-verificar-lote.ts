/**
 * Fase 3B — Verificación de solo lectura del Lote 1 Penal.
 *
 * No modifica nada. Consulta el estado actual de los 15 artículos en DB,
 * genera un backup reproducible con hash SHA-256 y vuelca los bodies actuales
 * para inspección de claims.
 *
 * Uso: npx tsx scripts/fase3b-verificar-lote.ts
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

async function main() {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    config({ path: envLocalPath, override: true });
  } else {
    config();
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no definida en .env.local');
  }

  const sql = neon(process.env.DATABASE_URL);

  const rows = (await sql`
    SELECT
      slug, title, category, body,
      ai_review_status, ai_reviewed_at, ai_review_provider, ai_review_model,
      ai_review_claims_count, ai_review_confirmed_claims,
      ai_review_corrected_claims, ai_review_unresolved_claims,
      ai_review_requires_human, ai_official_sources_count,
      updated_at
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
    ORDER BY slug
  `) as Array<{
    slug: string;
    title: string;
    category: string;
    body: string;
    ai_review_status: string;
    ai_reviewed_at: string | null;
    ai_review_provider: string | null;
    ai_review_model: string | null;
    ai_review_claims_count: number;
    ai_review_confirmed_claims: number;
    ai_review_corrected_claims: number;
    ai_review_unresolved_claims: number;
    ai_review_requires_human: boolean;
    ai_official_sources_count: number;
    updated_at: string;
  }>;

  console.log(`Artículos encontrados: ${rows.length} / ${SLUGS_LOTE1.length}`);

  // Backup reproducible con SHA-256
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'auditoria-blog');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `backup-pre-fase3b-${timestamp}.json`);

  const backup = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    category: r.category,
    body: r.body,
    bodySha256: crypto.createHash('sha256').update(r.body, 'utf8').digest('hex'),
    aiReviewStatus: r.ai_review_status,
    aiReviewedAt: r.ai_reviewed_at,
    aiReviewProvider: r.ai_review_provider,
    aiReviewModel: r.ai_review_model,
    aiReviewClaimsCount: r.ai_review_claims_count,
    aiReviewConfirmedClaims: r.ai_review_confirmed_claims,
    aiReviewCorrectedClaims: r.ai_review_corrected_claims,
    aiReviewUnresolvedClaims: r.ai_review_unresolved_claims,
    aiReviewRequiresHuman: r.ai_review_requires_human,
    aiOfficialSourcesCount: r.ai_official_sources_count,
    updatedAt: r.updated_at,
  }));

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`Backup escrito: ${backupPath}`);

  // Resumen de estado
  console.log('\n=== ESTADO ACTUAL EN DB ===');
  for (const r of rows) {
    console.log(
      `${r.slug.padEnd(55)} | ${r.ai_review_status.padEnd(20)} | claims=${r.ai_review_claims_count} unres=${r.ai_review_unresolved_claims} src=${r.ai_official_sources_count}`,
    );
  }

  // Volcar bodies a JSON para inspección de claims
  const bodiesPath = path.join(backupDir, `fase3b-bodies-${timestamp}.json`);
  const bodies = rows.map((r) => ({ slug: r.slug, title: r.title, body: r.body }));
  fs.writeFileSync(bodiesPath, JSON.stringify(bodies, null, 2), 'utf8');
  console.log(`\nBodies volcados: ${bodiesPath}`);

  console.log('\nVerificación completada. No se modificó la base de datos.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
