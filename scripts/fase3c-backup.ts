/**
 * Fase 3C — Backup previo de bodies (con SHA-256) de los 4 artículos bloqueados.
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

const SLUGS = [
  'abogado-penalista-choluteca',
  'abogado-penalista-sur-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'diferencia-denuncia-querella-acusacion-honduras',
  // Incluir los claims de Art. 71 (cuyos artículos NO se modifican en body,
  // solo recalculan estado; backup por seguridad)
  'defensa-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
  'defensa-penal-menores-edad-honduras',
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no configurada');
  const sql = neon(process.env.DATABASE_URL);
  const rows = (await sql`
    SELECT slug, title, body, ai_review_status, ai_review_claims_count,
           ai_review_confirmed_claims, ai_review_corrected_claims,
           ai_review_unresolved_claims, ai_review_requires_human,
           ai_official_sources_count, updated_at
    FROM blog_posts
    WHERE slug = ANY(${SLUGS})
    ORDER BY slug
  `) as Array<Record<string, unknown>>;

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.resolve(
    process.cwd(),
    `auditoria-blog/backup-pre-fase3c-${ts}.json`,
  );
  const data = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    body: r.body,
    bodySha256: crypto
      .createHash('sha256')
      .update(String(r.body), 'utf8')
      .digest('hex'),
    aiReviewStatus: r.ai_review_status,
    aiReviewClaimsCount: r.ai_review_claims_count,
    aiReviewConfirmedClaims: r.ai_review_confirmed_claims,
    aiReviewCorrectedClaims: r.ai_review_corrected_claims,
    aiReviewUnresolvedClaims: r.ai_review_unresolved_claims,
    aiReviewRequiresHuman: r.ai_review_requires_human,
    aiOfficialSourcesCount: r.ai_official_sources_count,
    updatedAt: r.updated_at,
  }));
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: ts, posts: data }, null, 2));
  console.log(`Backup: ${outPath} (${data.length} posts)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
