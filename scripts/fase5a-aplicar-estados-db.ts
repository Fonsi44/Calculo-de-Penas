/**
 * Fase 5A — Aplicar estados definitivos del Lote 3 a Neon.
 *
 * Escribe ÚNICAMENTE los campos ai_review_* del Lote 3 (15 slugs), usando los
 * estados derivados por fase5a-recalcular-estados.ts. No toca body ni
 * metadatos editoriales.
 *
 * Uso:
 *   npx tsx scripts/fase5a-aplicar-estados-db.ts            (dry-run)
 *   npx tsx scripts/fase5a-aplicar-estados-db.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

config({ path: ['.env.local', '.env'] });

const APLICAR = process.argv.includes('--aplicar');
const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

const VERSION = '5a.1';
const PROVIDER = 'reglas-locales';
const MODEL = 'fase5a-pipeline-canonico';

function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL!);

  const estados = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase5a-lote3-estados-finales.json'), 'utf8'),
  );

  (async () => {
    const resultados: Array<{ slug: string; aplicar: boolean; estadoAnterior: string; estadoFinal: string }> = [];
    for (const e of estados.estados) {
      // Leer estado actual para reportar
      const rows = (await sql`SELECT ai_review_status FROM blog_posts WHERE slug = ${e.slug}`) as Array<
        { ai_review_status: string }
      >;
      const estadoAnterior = rows[0]?.ai_review_status ?? 'desconocido';
      if (APLICAR) {
        await sql`
          UPDATE blog_posts SET
            ai_review_status = ${e.estadoFinal},
            ai_reviewed_at = NOW(),
            ai_review_provider = ${PROVIDER},
            ai_review_model = ${MODEL},
            ai_review_version = ${VERSION},
            ai_review_confidence = 'high',
            ai_review_claims_count = ${e.totalClaims},
            ai_review_confirmed_claims = ${e.centralConfirmed},
            ai_review_corrected_claims = ${e.centralCorrected},
            ai_review_unresolved_claims = ${e.centralUnresolved},
            ai_review_requires_human = ${e.estadoFinal === 'needs_human_review' || e.requiresHuman}
          WHERE slug = ${e.slug}`;
      }
      resultados.push({
        slug: e.slug,
        aplicar: APLICAR,
        estadoAnterior,
        estadoFinal: e.estadoFinal,
      });
    }

    const out = {
      fase: '5A',
      lote: 3,
      generatedAt: new Date().toISOString(),
      modo: APLICAR ? 'APLICAR' : 'DRY-RUN',
      provider: PROVIDER,
      model: MODEL,
      version: VERSION,
      total: resultados.length,
      resultados,
    };
    fs.writeFileSync(
      path.join(AUDITS, 'fase5a-lote3-aplicacion-estados-db.json'),
      JSON.stringify(out, null, 2),
    );
    console.log(`Modo: ${out.modo}`);
    console.log(`Estados aplicados: ${resultados.filter((r) => r.aplicar).length}`);
    for (const r of resultados) {
      console.log(`  ${r.slug}: ${r.estadoAnterior} -> ${r.estadoFinal}`);
    }
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

main();
