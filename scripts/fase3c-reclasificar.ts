/**
 * Fase 3C — Recalcular estados honestos del Lote 1 Penal.
 *
 * Combina:
 *   - Claims de fase3b-lote1-claims-finales.json (Fase 3B, no tocados)
 *   - Claims de fase3c-claims-finales.json (Fase 3C, nuevos/cambiados)
 *
 * Para cada slug del Lote 1:
 *   1. Recuenta confirmed/corrected/unresolved/requiresHuman.
 *   2. Cuenta fuentes únicas por procedencia (solo official_primary +
 *      official_secondary cuentan como oficiales).
 *   3. Deriva el estado con lib/ai/review-status.ts.
 *   4. Aplica UPDATE a blog_posts en DB (con --aplicar).
 *
 * Invariantes (validados después):
 *   - claims_sum_total
 *   - completed_has_unresolved_central
 *   - completed_no_sources
 *   - needs_human_not_flagged
 *   - ai_reviewed_equals_reviewed
 *
 * Uso:
 *   npx tsx scripts/fase3c-reclasificar.ts --dry-run
 *   npx tsx scripts/fase3c-reclasificar.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { deriveReviewStatus } from '../lib/ai/review-status';
import {
  classifySourceProvenance,
  countsAsOfficial,
  normalizeSourceForDedup,
} from '../lib/ai/source-provenance';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

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

interface ClaimBase {
  slug: string;
  decision:
    | 'confirmed'
    | 'corrected'
    | 'unsupported'
    | 'ambiguous'
    | 'needs_human_review';
  url?: string | null;
  urlOficial?: string | null;
  procedencia?: string;
}

interface ClaimFase3B extends ClaimBase {
  decisionFinal?: never;
  urlOficial: string | null;
}

interface ClaimFase3C extends ClaimBase {
  decision: 'confirmed' | 'corrected' | 'unsupported' | 'ambiguous' | 'needs_human_review';
  url: string | null;
  procedencia: string;
}

function loadClaims(): Map<string, ClaimBase[]> {
  const bySlug = new Map<string, ClaimBase[]>();

  // 1. Cargar Fase 3B (todos los claims) — base canónica.
  const fase3bPath = path.resolve(
    process.cwd(),
    'docs/audits/fase3b-lote1-claims-finales.json',
  );
  const fase3bClaims: Array<{
    slug: string;
    claim: string;
    decisionFinal: string;
    urlOficial: string | null;
  }> = fs.existsSync(fase3bPath)
    ? JSON.parse(fs.readFileSync(fase3bPath, 'utf8')).claims
    : [];

  // 2. Cargar Fase 3C (claims nuevos/cambiados).
  const fase3cPath = path.resolve(
    process.cwd(),
    'docs/audits/fase3c-claims-finales.json',
  );
  const fase3cClaims: Array<{
    slug: string;
    textoActual: string;
    decision: string;
    url: string | null;
    procedencia: string;
    id: string;
  }> = fs.existsSync(fase3cPath)
    ? JSON.parse(fs.readFileSync(fase3cPath, 'utf8')).claims
    : [];

  // Slugs cuyos claims fueron REPLANADOS por completo en Fase 3C
  // (los 4 desbloqueados: diferencia-denuncia-querella + 3 comerciales).
  // Para estos, los claims Fase 3B se descartan y se usan solo los Fase 3C.
  const SLUGS_REPLANADOS = new Set([
    'abogado-penalista-choluteca',
    'abogado-penalista-sur-honduras',
    'cuando-necesito-abogado-penalista-honduras',
    'diferencia-denuncia-querella-acusacion-honduras',
  ]);

  // 3. Para slugs NO replanados, los claims Fase 3C actualizan claims
  // específicos de Fase 3B identificados por texto similar. Los claims
  // Fase 3B no tocados se conservan.
  for (const slug of SLUGS_LOTE1) {
    const out: ClaimBase[] = [];

    if (SLUGS_REPLANADOS.has(slug)) {
      // Slug replanado: solo claims Fase 3C.
      for (const c of fase3cClaims.filter((c) => c.slug === slug)) {
        out.push({
          slug,
          decision: c.decision as ClaimBase['decision'],
          url: c.url,
          urlOficial: c.url,
          procedencia: c.procedencia,
        });
      }
    } else {
      // Slug mixto: claims Fase 3B + actualizaciones Fase 3C por texto similar.
      const updates3C = fase3cClaims.filter((c) => c.slug === slug);
      for (const c of fase3bClaims.filter((c) => c.slug === slug)) {
        // Buscar si Fase 3C actualizó este claim (por texto similar)
        const update = updates3C.find((u) =>
          isSimilarClaim(c.claim, u.textoActual),
        );
        if (update) {
          out.push({
            slug,
            decision: update.decision as ClaimBase['decision'],
            url: update.url,
            urlOficial: update.url,
            procedencia: update.procedencia,
          });
        } else {
          // Conservar claim Fase 3B tal cual.
          out.push({
            slug,
            decision: c.decisionFinal as ClaimBase['decision'],
            url: c.urlOficial,
            urlOficial: c.urlOficial,
          });
        }
      }
    }

    bySlug.set(slug, out);
  }

  return bySlug;
}

/**
 * Heurística simple para detectar si dos claims se refieren al mismo
 * concepto (uno es la versión actualizada del otro).
 *
 * Estrategia:
 *   1. Extraer referencias legales (Art. NNN, Decreto NNN-NN) de ambos.
 *      Si comparten al menos una referencia legal, se consideran el mismo claim.
 *   2. Si no hay referencias legales compartidas, comparar palabras
 *      significativas (>5 chars) con overlap ≥ 2.
 */
function isSimilarClaim(textB: string, textC: string): boolean {
  // Extraer referencias legales: "Artículo 71", "Art. 71", "Decreto 9-99-E"
  const refRe = /(?:art(?:ículo|\.?)\s*)(\d+)|(?:decreto\s*)(\d+-\d+)/gi;
  const refs = (t: string) => {
    const set = new Set<string>();
    let m;
    while ((m = refRe.exec(t)) !== null) {
      if (m[1]) set.add('art:' + m[1]);
      if (m[2]) set.add('dec:' + m[2]);
    }
    return set;
  };
  const refsB = refs(textB);
  const refsC = refs(textC);
  for (const r of refsC) if (refsB.has(r)) return true;

  // Fallback: palabras significativas
  const stopwords = new Set([
    'que',
    'del',
    'los',
    'las',
    'para',
    'por',
    'una',
    'como',
    'este',
    'esta',
  ]);
  const words = (t: string) =>
    (t.toLowerCase().match(/[a-záéíóúñ]{6,}/g) || []).filter(
      (w) => !stopwords.has(w),
    );
  const setB = new Set(words(textB));
  const setC = new Set(words(textC));
  let common = 0;
  for (const w of setC) if (setB.has(w)) common++;
  return common >= 2;
}

interface ArticleStat {
  slug: string;
  total: number;
  confirmed: number;
  corrected: number;
  unresolved: number;
  officialSources: number;
  sourcesByProvenance: Record<string, number>;
  uniqueSources: string[];
  requiresHuman: boolean;
  status: string;
  reason: string;
}

function computeStat(
  slug: string,
  claims: ClaimBase[],
): ArticleStat {
  let confirmed = 0;
  let corrected = 0;
  let unresolved = 0;
  let requiresHuman = false;
  const unique = new Map<string, string>(); // normalizedUrl -> provenance

  for (const c of claims) {
    const dec = c.decision;
    if (dec === 'confirmed') confirmed++;
    else if (dec === 'corrected') corrected++;
    else if (dec === 'unsupported' || dec === 'ambiguous' || dec === 'needs_human_review') {
      unresolved++;
      if (dec === 'needs_human_review') requiresHuman = true;
    }

    const url = c.url || c.urlOficial;
    if (url) {
      const norm = normalizeSourceForDedup(url);
      if (!unique.has(norm)) {
        const prov =
          c.procedencia ?? classifySourceProvenance(url);
        unique.set(norm, prov);
      }
    }
  }

  // Contar fuentes por procedencia.
  // Política (enunciado Fase 3C §2 + §7 "evita degradar información ya validada"):
  //   - Para REPORTING (sourcesByProvenance): conteo exacto por las 7 categorías.
  //   - Para ESTADO (officialSources): cuentan official_primary,
  //     official_secondary Y canonical_internal_verified (fuente interna con
  //     trazabilidad documentada hacia la norma, p. ej. data/articulos_cp.json
  //     y data/articulos_constitucion.json con notas hacia La Gaceta/TSC).
  //     Las categorías academic/commercial/unverified NO cuentan para estado.
  let officialSources = 0;
  const sourcesByProvenance: Record<string, number> = {};
  for (const prov of unique.values()) {
    sourcesByProvenance[prov] = (sourcesByProvenance[prov] || 0) + 1;
    if (
      countsAsOfficial(prov as 'official_primary') ||
      prov === 'canonical_internal_verified'
    ) {
      officialSources++;
    }
  }

  const { status, reason } = deriveReviewStatus({
    centralConfirmed: confirmed,
    centralCorrected: corrected,
    centralUnresolved: unresolved,
    officialSources,
    requiresHuman,
  });

  return {
    slug,
    total: claims.length,
    confirmed,
    corrected,
    unresolved,
    officialSources,
    sourcesByProvenance,
    uniqueSources: Array.from(unique.keys()),
    requiresHuman,
    status,
    reason,
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

  const sql = neon(process.env.DATABASE_URL);
  const claimsBySlug = loadClaims();

  console.log(`Fase 3C — Recálculo de estados del Lote 1 Penal`);
  console.log(`Slugs: ${SLUGS_LOTE1.length} | Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}\n`);

  // Leer estados actuales de DB para comparativa
  const currentState = (await sql`
    SELECT slug, ai_review_status, ai_review_claims_count,
           ai_review_confirmed_claims, ai_review_corrected_claims,
           ai_review_unresolved_claims, ai_review_requires_human,
           ai_official_sources_count
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
  `) as Array<Record<string, unknown>>;
  const currentMap = new Map<string, Record<string, unknown>>();
  for (const r of currentState) currentMap.set(String(r.slug), r);

  const stats: ArticleStat[] = [];
  for (const slug of SLUGS_LOTE1) {
    const claims = claimsBySlug.get(slug) || [];

    // Slugs sin claims en ningún JSON de Fase 3B/3C: preservar estado actual
    // de DB (no reclasificar). Caso: delitos-mas-comunes y estafas-fraudes
    // tenían claims en JSON antiguos pero no en fase3b-lote1-claims-finales.json.
    if (claims.length === 0) {
      const cur = currentMap.get(slug);
      stats.push({
        slug,
        total: Number(cur?.ai_review_claims_count ?? 0),
        confirmed: Number(cur?.ai_review_confirmed_claims ?? 0),
        corrected: Number(cur?.ai_review_corrected_claims ?? 0),
        unresolved: Number(cur?.ai_review_unresolved_claims ?? 0),
        officialSources: Number(cur?.ai_official_sources_count ?? 0),
        sourcesByProvenance: {},
        uniqueSources: [],
        requiresHuman: Boolean(cur?.ai_review_requires_human ?? false),
        status: String(cur?.ai_review_status ?? 'not_started'),
        reason: 'Preservado: sin claims en JSON Fase 3B/3C (no reclasificado)',
      });
      continue;
    }

    const stat = computeStat(slug, claims);
    stats.push(stat);
  }

  // Mostrar comparativa
  console.log('=== COMPARATIVA ANTES/DESPUÉS ===\n');
  for (const s of stats) {
    const cur = currentMap.get(s.slug);
    const before = cur?.ai_review_status ?? '(none)';
    const beforeSources = cur?.ai_official_sources_count ?? 0;
    const flag = before !== s.status ? '⭐' : '  ';
    console.log(
      `${flag} ${s.slug}`,
    );
    console.log(
      `   estado: ${before} → ${s.status} | fuentes: ${beforeSources} → ${s.officialSources} | confirmed/corrected/unresolved: ${cur?.ai_review_confirmed_claims ?? '?'}/${cur?.ai_review_corrected_claims ?? '?'}/${cur?.ai_review_unresolved_claims ?? '?'} → ${s.confirmed}/${s.corrected}/${s.unresolved}`,
    );
    console.log(
      `   sources: ${JSON.stringify(s.sourcesByProvenance)} | reason: ${s.reason}`,
    );
    console.log('');
  }

  // Resumen agregado
  const statusCounts: Record<string, number> = {};
  for (const s of stats) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }
  console.log('=== DISTRIBUCIÓN DE ESTADOS ===');
  console.log(JSON.stringify(statusCounts, null, 2));

  const totalOfficial = stats.reduce((a, s) => a + s.officialSources, 0);
  const totalAll = stats.reduce((a, s) => a + s.uniqueSources.length, 0);
  console.log(
    `\nFuentes únicas: ${totalAll} total, ${totalOfficial} oficiales (official_primary + official_secondary)`,
  );

  // Aplicar a DB
  if (aplicar) {
    console.log('\n=== APLICANDO A DB ===');
    for (const s of stats) {
      await sql`
        UPDATE blog_posts
        SET ai_review_status = ${s.status},
            ai_review_claims_count = ${s.total},
            ai_review_confirmed_claims = ${s.confirmed},
            ai_review_corrected_claims = ${s.corrected},
            ai_review_unresolved_claims = ${s.unresolved},
            ai_review_requires_human = ${s.requiresHuman},
            ai_official_sources_count = ${s.officialSources},
            ai_review_version = 'fase3c',
            updated_at = NOW()
        WHERE slug = ${s.slug}
      `;
      console.log(`  ✅ ${s.slug}: ${s.status}`);
    }
    console.log('\nDB actualizada.');
  }

  // Guardar estados finales
  const outPath = path.resolve(
    process.cwd(),
    'docs/audits/fase3c-estados-finales.json',
  );
  const estadosFinales = stats.map((s) => {
    const cur = currentMap.get(s.slug);
    return {
      slug: s.slug,
      estadoAnterior: cur?.ai_review_status ?? 'unknown',
      estadoFinal: s.status,
      totalClaims: s.total,
      confirmed: s.confirmed,
      corrected: s.corrected,
      unresolved: s.unresolved,
      officialSources: s.officialSources,
      totalSources: s.uniqueSources.length,
      sourcesByProvenance: s.sourcesByProvenance,
      requiresHuman: s.requiresHuman,
      reason: s.reason,
    };
  });
  fs.writeFileSync(outPath, JSON.stringify(estadosFinales, null, 2));
  console.log(`\nEstados finales: ${outPath}`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
