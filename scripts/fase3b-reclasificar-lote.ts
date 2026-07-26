/**
 * Fase 3B — Recalcular estados honestos del Lote 1 Penal.
 *
 * Lee docs/audits/fase3b-lote1-claims-finales.json (clasificación revisada con
 * fuentes oficiales) y recalcula los conteos y estados en DB.
 *
 * Semántica de estados (igual que fase3-reclasificar-lote1.ts):
 *   - completed: 0 centrales sin resolver + ≥1 fuente oficial + contenido verificado
 *   - source_checked: mayoría cubierta, quedan 1-2 centrales sin resolver
 *   - needs_human_review: ≥3 centrales sin resolver, o cuestión interpretativa
 *   - blocked: sin fuentes y centrales sin resolver
 *
 * Un artículo NUNCA queda completed si tiene claims centrales unresolved.
 *
 * Uso:
 *   npx tsx scripts/fase3b-reclasificar-lote.ts --dry-run
 *   npx tsx scripts/fase3b-reclasificar-lote.ts --aplicar
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

const CLAIMS_PATH = path.resolve(
  process.cwd(),
  'docs/audits/fase3b-lote1-claims-finales.json',
);

const CLAIMS_OLD_PATH = path.resolve(
  process.cwd(),
  'docs/audits/fase3-lote1-claims-con-importancia.json',
);

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

interface ClaimFinal {
  slug: string;
  decisionFinal:
    | 'confirmed'
    | 'corrected'
    | 'unsupported'
    | 'ambiguous'
    | 'needs_human_review';
  norma: string | null;
  urlOficial: string | null;
}

interface ArticleStat {
  slug: string;
  total: number;
  confirmed: number;
  corrected: number;
  unresolved: number;
  officialSources: number;
  requiresHuman: boolean;
  proposedStatus: string;
  reason: string;
}

/**
 * Mapea decisionFinal → bucket. needs_human_review se cuenta como unresolved
 * (cuestión pendiente) PERO marca requiresHuman=true.
 */
function bucket(d: ClaimFinal['decisionFinal']): {
  confirmed: number;
  corrected: number;
  unresolved: number;
  human: boolean;
} {
  switch (d) {
    case 'confirmed':
      return { confirmed: 1, corrected: 0, unresolved: 0, human: false };
    case 'corrected':
      return { confirmed: 0, corrected: 1, unresolved: 0, human: false };
    case 'unsupported':
    case 'ambiguous':
      return { confirmed: 0, corrected: 0, unresolved: 1, human: false };
    case 'needs_human_review':
      return { confirmed: 0, corrected: 0, unresolved: 1, human: true };
    default:
      return { confirmed: 0, corrected: 0, unresolved: 1, human: false };
  }
}

function determineStatus(
  total: number,
  confirmed: number,
  corrected: number,
  unresolved: number,
  officialSources: number,
  requiresHuman: boolean,
): { status: string; reason: string } {
  // Invariante: nunca completed con unresolved
  if (unresolved === 0 && confirmed + corrected > 0 && officialSources > 0 && !requiresHuman) {
    return {
      status: 'completed',
      reason: `0 claims sin resolver; ${confirmed} confirmados + ${corrected} corregidos; ${officialSources} fuentes oficiales`,
    };
  }
  if (unresolved === 0 && officialSources === 0) {
    return {
      status: 'needs_human_review',
      reason: '0 claims sin resolver pero sin fuentes oficiales registradas',
    };
  }
  // Sin fuentes y con unresolved → blocked
  if (officialSources === 0 && unresolved > 0 && confirmed === 0) {
    return {
      status: 'blocked',
      reason: `${unresolved} claims centrales sin resolver; sin fuentes oficiales`,
    };
  }
  // Cuestión interpretativa marcada explícitamente → needs_human_review
  if (requiresHuman) {
    return {
      status: 'needs_human_review',
      reason: `${unresolved} claims pendientes de revisión jurídica humana (incluye needs_human_review); ${officialSources} fuentes`,
    };
  }
  // 1-2 unresolved con mayoría cubierta → source_checked
  if (unresolved >= 1 && unresolved <= 2 && confirmed + corrected >= 3) {
    return {
      status: 'source_checked',
      reason: `${unresolved} claims centrales sin resolver; mayoría cubierta (${confirmed}+${corrected}); ${officialSources} fuentes`,
    };
  }
  // Resto → needs_human_review
  return {
    status: 'needs_human_review',
    reason: `${unresolved} claims centrales sin resolver; ${confirmed} confirmados, ${corrected} corregidos; ${officialSources} fuentes`,
  };
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
  if (!fs.existsSync(CLAIMS_PATH)) {
    console.error(`No se encontró ${CLAIMS_PATH}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(CLAIMS_PATH, 'utf-8'));
  const claimsNew: ClaimFinal[] = data.claims;

  // Cargar clasificación original (99 claims) para conservar los ya resueltos
  // (confirmed/incorrect/confirmed_with_context) que NO están en los 46 pendientes.
  const claimsOld: Array<{
    articleSlug: string;
    classification: string;
    importance: string;
  }> = fs.existsSync(CLAIMS_OLD_PATH)
    ? JSON.parse(fs.readFileSync(CLAIMS_OLD_PATH, 'utf-8'))
    : [];

  // Identificamos los claims antiguos a excluir por su clasificación
  // (unsupported/ambiguous), que son justamente los 46 que reclasificamos.

  // Build per-slug stats
  const stats = new Map<string, ArticleStat>();
  for (const slug of SLUGS_LOTE1) {
    stats.set(slug, {
      slug,
      total: 0,
      confirmed: 0,
      corrected: 0,
      unresolved: 0,
      officialSources: 0,
      requiresHuman: false,
      proposedStatus: '',
      reason: '',
    });
  }

  // Slugs cuyos claims pendientes fueron reclasificados en Fase 3B.
  // Para esos slugs, los unsupported/ambiguous antiguos se ignoran (reemplazados).
  // Para los demás slugs, los unsupported/ambiguous antiguos se conservan como unresolved.
  const slugsReclasificadosFase3B = new Set(claimsNew.map((c) => c.slug));

  // 1) Procesar claims antiguos centrales:
  //    - confirmed/incorrect/outdated/confirmed_with_context → resueltos (siempre)
  //    - unsupported/ambiguous/requires_human_judgment → solo si el slug NO fue
  //      reclasificado en Fase 3B (si lo fue, se cuentan en el paso 2)
  for (const c of claimsOld) {
    if (c.importance !== 'central') continue;
    const s = stats.get(c.articleSlug);
    if (!s) continue;
    const isUnresolved =
      c.classification === 'unsupported' ||
      c.classification === 'ambiguous' ||
      c.classification === 'requires_human_judgment';
    if (isUnresolved && slugsReclasificadosFase3B.has(c.articleSlug)) {
      continue; // reclasificado en Fase 3B, se cuenta en paso 2
    }
    s.total++;
    if (c.classification.startsWith('confirmed')) {
      s.confirmed++;
      s.officialSources += 1;
    } else if (c.classification === 'incorrect' || c.classification === 'outdated') {
      s.corrected++;
      s.officialSources += 1;
    } else {
      // unsupported/ambiguous conservado (slug no reclasificado en Fase 3B)
      s.unresolved++;
    }
  }

  // 2) Procesar los 46 claims con clasificación Fase 3B (reemplaza a los unsupported/ambiguous
  //    de los slugs reclasificados)
  for (const c of claimsNew) {
    const s = stats.get(c.slug);
    if (!s) continue;
    s.total++;
    const b = bucket(c.decisionFinal);
    s.confirmed += b.confirmed;
    s.corrected += b.corrected;
    s.unresolved += b.unresolved;
    if (b.human) s.requiresHuman = true;
    if (c.urlOficial) s.officialSources += 1;
  }

  // Determinar estado propuesto
  for (const s of stats.values()) {
    const { status, reason } = determineStatus(
      s.total,
      s.confirmed,
      s.corrected,
      s.unresolved,
      s.officialSources,
      s.requiresHuman,
    );
    s.proposedStatus = status;
    s.reason = reason;
  }

  // Fetch current DB state
  const sql = neon(process.env.DATABASE_URL);
  const dbPosts = (await sql`
    SELECT slug, ai_review_status, ai_review_unresolved_claims,
           ai_review_confirmed_claims, ai_review_corrected_claims,
           ai_official_sources_count
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
    ORDER BY slug
  `) as Array<{
    slug: string;
    ai_review_status: string;
    ai_review_unresolved_claims: number;
    ai_review_confirmed_claims: number;
    ai_review_corrected_claims: number;
    ai_official_sources_count: number;
  }>;

  const output: any[] = [];
  console.log(
    `${'slug'.padEnd(55)} | ${'actual'.padEnd(20)} | ${'propuesto'.padEnd(20)} | ${'cf/co/un'.padEnd(10)} | motivo`,
  );
  console.log('-'.repeat(140));

  for (const db of dbPosts) {
    const s = stats.get(db.slug)!;
    const cambia = db.ai_review_status !== s.proposedStatus;
    const marker = cambia ? '→' : '=';
    console.log(
      `${db.slug.padEnd(55)} | ${db.ai_review_status.padEnd(20)} | ${s.proposedStatus.padEnd(20)} | ${`${s.confirmed}/${s.corrected}/${s.unresolved}`.padEnd(10)} | ${marker} ${s.reason.substring(0, 60)}`,
    );
    output.push({
      slug: db.slug,
      estadoAnterior: db.ai_review_status,
      estadoPropuesto: s.proposedStatus,
      totalClaims: s.total,
      confirmed: s.confirmed,
      corrected: s.corrected,
      unresolved: s.unresolved,
      officialSources: s.officialSources,
      requiresHuman: s.requiresHuman,
      reason: s.reason,
    });
  }

  // Escribir estados finales (siempre, incluso en dry-run, para inspección)
  const estadosPath = path.resolve(
    process.cwd(),
    'docs/audits/fase3b-lote1-estados-finales.json',
  );
  fs.writeFileSync(estadosPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nEstados escritos: ${estadosPath}`);

  if (aplicar) {
    // Backup previo
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(process.cwd(), 'auditoria-blog');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `backup-pre-reclasif-fase3b-${ts}.json`);
    const fullBackup = (await sql`
      SELECT slug, ai_review_status, ai_review_unresolved_claims,
             ai_review_confirmed_claims, ai_review_corrected_claims,
             ai_official_sources_count, ai_review_requires_human,
             body
      FROM blog_posts
      WHERE slug = ANY(${SLUGS_LOTE1})
      ORDER BY slug
    `) as any[];
    for (const r of fullBackup) {
      (r as any).bodySha256 = crypto
        .createHash('sha256')
        .update(r.body || '', 'utf8')
        .digest('hex');
    }
    fs.writeFileSync(backupPath, JSON.stringify(fullBackup, null, 2), 'utf8');
    console.log(`Backup previo: ${backupPath}`);

    // Aplicar en transacción conceptual (una UPDATE por slug)
    let cambios = 0;
    for (const s of stats.values()) {
      await sql`
        UPDATE blog_posts
        SET
          ai_review_status = ${s.proposedStatus},
          ai_review_unresolved_claims = ${s.unresolved},
          ai_review_confirmed_claims = ${s.confirmed},
          ai_review_corrected_claims = ${s.corrected},
          ai_official_sources_count = ${s.officialSources},
          ai_review_requires_human = ${s.requiresHuman},
          ai_reviewed_at = COALESCE(ai_reviewed_at, NOW()),
          updated_at = NOW()
        WHERE slug = ${s.slug}
      `;
      cambios++;
    }
    console.log(`\n✅ ${cambios} artículos actualizados en DB.`);

    // Verificación post
    const postCheck = (await sql`
      SELECT slug, ai_review_status, ai_review_unresolved_claims,
             ai_review_requires_human
      FROM blog_posts
      WHERE slug = ANY(${SLUGS_LOTE1})
      ORDER BY slug
    `) as any[];
    const distrib: Record<string, number> = {};
    for (const r of postCheck) {
      distrib[r.ai_review_status] = (distrib[r.ai_review_status] || 0) + 1;
    }
    console.log('Distribución final:', distrib);
  } else {
    console.log('\n(DRY-RUN: no se modificó la DB. Usa --aplicar para escribir.)');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
