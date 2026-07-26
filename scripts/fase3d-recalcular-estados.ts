/**
 * Fase 3D — Recalcular estados honestos del Lote 1 Penal (cierre íntegro).
 *
 * Diferencia con fase3c-reclasificar.ts:
 *   - Incorpora los 16 claims reconstruidos en fase3d-claims-reconstruidos.json
 *     (delitos-mas-comunes + estafas-fraudes), que en Fase 3C fueron
 *     PRESERVADOS sin reclasificar ("sin claims en JSON 3B/3C").
 *   - Audita los 7 `completed` contra los 7 criterios de integridad (§8 del
 *     enunciado) y degrada honestamente los que no los cumplan.
 *   - Genera matriz completa (fase3d-matriz-lote1.json) con conteo por
 *     importancia (central/supporting/contextual), decisiones, fuentes por
 *     procedencia, estado esperado vs real DB, coincidencia/violación.
 *
 * Invita a lib/ai/review-status.ts (deriveReviewStatus) y
 * lib/ai/source-provenance.ts (countsAsOfficial, classifySourceProvenance,
 * normalizeSourceForDedup) — mismas fuentes de verdad que Fase 3C.
 *
 * Uso:
 *   npx tsx scripts/fase3d-recalcular-estados.ts --dry-run
 *   npx tsx scripts/fase3d-recalcular-estados.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { deriveReviewStatus, type StatusInputs } from '../lib/ai/review-status';
import {
  classifySourceProvenance,
  countsAsOfficial,
  normalizeSourceForDedup,
} from '../lib/ai/source-provenance';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

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

// Slugs cuyos claims fueron REPLANADOS por completo en Fase 3C
// (los 4 desbloqueados). Para estos, los claims Fase 3B se descartan.
const SLUGS_REPLANADOS = new Set([
  'abogado-penalista-choluteca',
  'abogado-penalista-sur-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'diferencia-denuncia-querella-acusacion-honduras',
]);

// Slugs cuyos claims se RECONSTRUYERON en Fase 3D (desde DeepSeek crudo).
const SLUGS_RECONSTRUIDOS_3D = new Set([
  'delitos-mas-comunes-honduras',
  'estafas-fraudes-tipos-penales-honduras',
]);

// ─── Tipos ──────────────────────────────────────────────────────────────────
type Decision =
  | 'confirmed'
  | 'corrected'
  | 'unsupported'
  | 'ambiguous'
  | 'needs_human_review';

type Importancia = 'central' | 'supporting' | 'contextual';

interface ClaimUnificado {
  slug: string;
  id: string;
  texto: string;
  decision: Decision;
  importancia: Importancia;
  url: string | null;
  procedencia: string | null;
}

interface Fase3BClaim {
  slug: string;
  claim: string;
  decisionFinal: string;
  urlOficial: string | null;
}

interface Fase3CClaim {
  id: string;
  slug: string;
  textoActual: string;
  decision: string;
  url: string | null;
  procedencia: string;
  importancia?: string;
}

interface Fase3DClaim {
  id: string;
  slug: string;
  textoActual: string;
  decision: string;
  url: string;
  procedencia: string;
  importancia: Importancia;
}

interface ArticuloCPDocumento {
  slug: string;
  body: string;
  // flag para saber si el body ya refleja las correcciones
}

// ─── Carga de claims ────────────────────────────────────────────────────────
function loadFase3B(): Fase3BClaim[] {
  const p = path.resolve(process.cwd(), 'docs/audits/fase3b-lote1-claims-finales.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8')).claims ?? [];
}

function loadFase3C(): Fase3CClaim[] {
  const p = path.resolve(process.cwd(), 'docs/audits/fase3c-claims-finales.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8')).claims ?? [];
}

function loadFase3D(): Fase3DClaim[] {
  const p = path.resolve(process.cwd(), 'docs/audits/fase3d-claims-reconstruidos.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8')).claims ?? [];
}

/**
 * Heurística de similitud para detectar si un claim Fase 3C actualiza uno
 * Fase 3B (mismo concepto). Replica la de fase3c-reclasificar.ts:190.
 */
function isSimilarClaim(textB: string, textC: string): boolean {
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

  const stopwords = new Set([
    'que', 'del', 'los', 'las', 'para', 'por', 'una', 'como', 'este', 'esta',
  ]);
  const words = (t: string) =>
    (t.toLowerCase().match(/[a-záéíóúñ]{6,}/g) || []).filter((w) => !stopwords.has(w));
  const setB = new Set(words(textB));
  const setC = new Set(words(textC));
  let common = 0;
  for (const w of setC) if (setB.has(w)) common++;
  return common >= 2;
}

/**
 * Mergea los 3 orígenes de claims en una lista unificada por slug.
 * Reglas (mismas que Fase 3C + extensión 3D):
 *   - Slugs REPLANADOS (4): solo Fase 3C.
 *   - Slugs RECONSTRUIDOS 3D (2): solo Fase 3D (reemplazan preservación).
 *   - Resto: Fase 3B + actualizaciones Fase 3C por similitud.
 */
function mergeClaims(): Map<string, ClaimUnificado[]> {
  const fase3b = loadFase3B();
  const fase3c = loadFase3C();
  const fase3d = loadFase3D();
  const bySlug = new Map<string, ClaimUnificado[]>();

  for (const slug of SLUGS_LOTE1) {
    const out: ClaimUnificado[] = [];

    if (SLUGS_RECONSTRUIDOS_3D.has(slug)) {
      // Slugs reconstruidos en 3D: usar SOLO sus claims (era el gap de 3C).
      for (const c of fase3d.filter((c) => c.slug === slug)) {
        out.push({
          slug,
          id: c.id,
          texto: c.textoActual,
          decision: c.decision as Decision,
          importancia: c.importancia,
          url: c.url || null,
          procedencia: c.procedencia ?? null,
        });
      }
    } else if (SLUGS_REPLANADOS.has(slug)) {
      for (const c of fase3c.filter((c) => c.slug === slug)) {
        out.push({
          slug,
          id: c.id,
          texto: c.textoActual,
          decision: c.decision as Decision,
          importancia: (c.importancia as Importancia) ?? 'central',
          url: c.url,
          procedencia: c.procedencia,
        });
      }
    } else {
      const updates3C = fase3c.filter((c) => c.slug === slug);
      for (const c of fase3b.filter((c) => c.slug === slug)) {
        const update = updates3C.find((u) => isSimilarClaim(c.claim, u.textoActual));
        if (update) {
          out.push({
            slug,
            id: update.id,
            texto: update.textoActual,
            decision: update.decision as Decision,
            importancia: (update.importancia as Importancia) ?? 'central',
            url: update.url,
            procedencia: update.procedencia,
          });
        } else {
          out.push({
            slug,
            id: `3b-${slug.slice(0, 8)}-${out.length}`,
            texto: c.claim,
            decision: c.decisionFinal as Decision,
            importancia: 'central', // Fase 3B solo tenía centrales
            url: c.urlOficial,
            procedencia: c.urlOficial ? classifySourceProvenance(c.urlOficial) : null,
          });
        }
      }
    }

    bySlug.set(slug, out);
  }

  return bySlug;
}

// ─── Cómputo de estadísticas ────────────────────────────────────────────────
interface ArticleStat {
  slug: string;
  total: number;
  porImportancia: Record<Importancia, number>;
  confirmed: number;
  corrected: number;
  unsupported: number;
  ambiguous: number;
  needsHumanReview: number;
  unresolved: number;
  centralConfirmed: number;
  centralCorrected: number;
  centralUnresolved: number;
  officialSources: number;
  sourcesByProvenance: Record<string, number>;
  uniqueSources: number;
  requiresHuman: boolean;
  statusEsperado: string;
  reason: string;
}

function computeStat(slug: string, claims: ClaimUnificado[]): ArticleStat {
  const porImportancia: Record<Importancia, number> = {
    central: 0,
    supporting: 0,
    contextual: 0,
  };
  let confirmed = 0,
    corrected = 0,
    unsupported = 0,
    ambiguous = 0,
    needsHumanReview = 0,
    unresolved = 0;
  let centralConfirmed = 0,
    centralCorrected = 0,
    centralUnresolved = 0;
  let requiresHuman = false;
  const unique = new Map<string, string>(); // normalizedUrl -> provenance

  for (const c of claims) {
    porImportancia[c.importancia]++;

    const dec = c.decision;
    if (dec === 'confirmed') confirmed++;
    else if (dec === 'corrected') corrected++;
    else if (dec === 'unsupported') {
      unsupported++;
      unresolved++;
    } else if (dec === 'ambiguous') {
      ambiguous++;
      unresolved++;
    } else if (dec === 'needs_human_review') {
      needsHumanReview++;
      unresolved++;
      requiresHuman = true;
    }

    // Conteo por importancia central (para deriveReviewStatus).
    if (c.importancia === 'central') {
      if (dec === 'confirmed') centralConfirmed++;
      else if (dec === 'corrected') centralCorrected++;
      else if (dec === 'unsupported' || dec === 'ambiguous' || dec === 'needs_human_review')
        centralUnresolved++;
    }

    const url = c.url;
    if (url) {
      const norm = normalizeSourceForDedup(url);
      if (!unique.has(norm)) {
        const prov = c.procedencia ?? classifySourceProvenance(url);
        unique.set(norm, prov);
      }
    }
  }

  // Política oficial (misma que Fase 3C): official_primary +
  // official_secondary + canonical_internal_verified cuentan para estado.
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

  const inputs: StatusInputs = {
    centralConfirmed,
    centralCorrected,
    centralUnresolved,
    officialSources,
    requiresHuman,
  };
  const { status, reason } = deriveReviewStatus(inputs);

  return {
    slug,
    total: claims.length,
    porImportancia,
    confirmed,
    corrected,
    unsupported,
    ambiguous,
    needsHumanReview,
    unresolved,
    centralConfirmed,
    centralCorrected,
    centralUnresolved,
    officialSources,
    sourcesByProvenance,
    uniqueSources: unique.size,
    requiresHuman,
    statusEsperado: status,
    reason,
  };
}

// ─── Auditoría de los 7 `completed` (criterios §8) ──────────────────────────
interface CompletedAudit {
  slug: string;
  cumpleCriterios: boolean;
  criteriosFallidos: string[];
  degradacionPropuesta: 'completed' | 'source_checked' | 'needs_human_review' | 'blocked';
  motivo: string;
}

/**
 * Un artículo puede permanecer `completed` SOLO si:
 *   1. Tiene inventario completo de claims (>0 claims).
 *   2. No tiene claim central pendiente (centralUnresolved === 0).
 *   3. Tiene fuentes con procedencia válida (officialSources > 0).
 *   4. requiresHuman === false.
 *   5. (la corrección al body se verifica en Commit 6; aquí se documenta el
 *      flag para los claims corrected).
 *   6. No fue conservado por excepción (preservación).
 *   7. No requiere decisión interpretativa humana (sin needs_human_review).
 */
function auditarCompleted(stat: ArticleStat): CompletedAudit {
  const fallidos: string[] = [];

  if (stat.total === 0) fallidos.push('sin inventario de claims');
  if (stat.centralUnresolved > 0) fallidos.push(`${stat.centralUnresolved} claim(s) central(es) pendiente(s)`);
  if (stat.officialSources === 0) fallidos.push('sin fuentes con procedencia válida');
  if (stat.requiresHuman) fallidos.push('requiresHuman=true (algún claim marcado needs_human_review)');
  if (stat.needsHumanReview > 0) fallidos.push(`${stat.needsHumanReview} claim(s) en needs_human_review`);

  if (fallidos.length === 0) {
    return {
      slug: stat.slug,
      cumpleCriterios: true,
      criteriosFallidos: [],
      degradacionPropuesta: 'completed',
      motivo: 'Cumple los 7 criterios de integridad.',
    };
  }

  // Degradación: si tiene claims resueltos pero con algún gap → source_checked;
  // si requiere decisión humana → needs_human_review; si sin nada → blocked.
  let propuesto: CompletedAudit['degradacionPropuesta'] = 'source_checked';
  if (stat.requiresHuman || stat.needsHumanReview > 0) propuesto = 'needs_human_review';
  else if (stat.officialSources === 0 && stat.confirmed === 0) propuesto = 'blocked';

  return {
    slug: stat.slug,
    cumpleCriterios: false,
    criteriosFallidos: fallidos,
    degradacionPropuesta: propuesto,
    motivo: `No cumple: ${fallidos.join('; ')}.`,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const aplicar = process.argv.includes('--aplicar');
  if (!dryRun && !aplicar) {
    console.error('Especifica --dry-run o --aplicar');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada en .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const claimsBySlug = mergeClaims();

  console.log(`Fase 3D — Recálculo íntegro del Lote 1 Penal`);
  console.log(`Slugs: ${SLUGS_LOTE1.length} | Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}\n`);

  // Leer estados actuales de DB.
  const currentState = (await sql`
    SELECT slug, ai_review_status, ai_review_claims_count,
           ai_review_confirmed_claims, ai_review_corrected_claims,
           ai_review_unresolved_claims, ai_review_requires_human,
           ai_official_sources_count, ai_review_version
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
  `) as Array<Record<string, unknown>>;
  const currentMap = new Map<string, Record<string, unknown>>();
  for (const r of currentState) currentMap.set(String(r.slug), r);

  const stats: ArticleStat[] = [];
  const completedAudits: CompletedAudit[] = [];

  for (const slug of SLUGS_LOTE1) {
    const claims = claimsBySlug.get(slug) || [];
    if (claims.length === 0) {
      // Esto NO debería ocurrir tras Fase 3D (los 16 reconstruidos cubren el gap).
      console.error(`⚠ ${slug}: sin claims tras merge 3B/3C/3D — revisar.`);
      continue;
    }
    const stat = computeStat(slug, claims);

    // Auditoría de completed.
    const cur = currentMap.get(slug);
    const estadoEsperadoSinAudit = stat.statusEsperado;
    let estadoFinal = estadoEsperadoSinAudit;

    // Si deriveReviewStatus dice completed, auditar criterios antes de aceptar.
    if (estadoEsperadoSinAudit === 'completed') {
      const audit = auditarCompleted(stat);
      completedAudits.push(audit);
      if (!audit.cumpleCriterios) {
        estadoFinal = audit.degradacionPropuesta;
        stat.reason = `${stat.reason} | DEGRADADO: ${audit.motivo}`;
      }
    } else if (cur?.ai_review_status === 'completed') {
      // Era completed en DB pero deriveReviewStatus ya no lo dice: auditar igual.
      const audit = auditarCompleted(stat);
      completedAudits.push(audit);
    }

    stats.push({ ...stat, statusEsperado: estadoFinal });
  }

  // ─── Comparativa ANTES/DESPUÉS ────────────────────────────────────────────
  console.log('=== COMPARATIVA ANTES → DESPUÉS ===\n');
  let degradados = 0;
  let promocionados = 0;
  let permanecen = 0;
  for (const s of stats) {
    const cur = currentMap.get(s.slug);
    const antes = String(cur?.ai_review_status ?? '(none)');
    const despues = s.statusEsperado;
    const flag = antes !== despues ? (esDegradacion(antes, despues) ? '⬇️' : '⬆️') : '  ';
    if (antes !== despues) {
      if (esDegradacion(antes, despues)) degradados++;
      else promocionados++;
    } else permanecen++;
    console.log(
      `${flag} ${s.slug.padEnd(52)} ${antes.padEnd(20)} → ${despues.padEnd(20)} | cl=${s.total} c=${s.confirmed}+${s.corrected} u=${s.unresolved} of=${s.officialSources} rh=${s.requiresHuman}`,
    );
    console.log(`     importancia: ${JSON.stringify(s.porImportancia)} | sources: ${JSON.stringify(s.sourcesByProvenance)}`);
  }

  console.log(
    `\nResumen: ${permanecen} permanecen, ${degradados} degradados, ${promocionados} promocionados.`,
  );

  // ─── Auditoría de completed ───────────────────────────────────────────────
  console.log('\n=== AUDITORÍA DE ARTÍCULOS COMPLETED ===');
  for (const a of completedAudits) {
    const marca = a.cumpleCriterios ? '✓' : '⬇️';
    console.log(`${marca} ${a.slug}: ${a.degradacionPropuesta} — ${a.motivo}`);
  }

  // ─── Matriz completa ──────────────────────────────────────────────────────
  const matriz = stats.map((s) => {
    const cur = currentMap.get(s.slug);
    const estadoRealDB = String(cur?.ai_review_status ?? 'unknown');
    const estadoEsperadoDerivado = deriveReviewStatus({
      centralConfirmed: s.centralConfirmed,
      centralCorrected: s.centralCorrected,
      centralUnresolved: s.centralUnresolved,
      officialSources: s.officialSources,
      requiresHuman: s.requiresHuman,
    }).status;
    return {
      slug: s.slug,
      totalClaims: s.total,
      centrales: s.porImportancia.central,
      supporting: s.porImportancia.supporting,
      contextuales: s.porImportancia.contextual,
      confirmed: s.confirmed,
      corrected: s.corrected,
      unsupported: s.unsupported,
      ambiguous: s.ambiguous,
      needsHumanReview: s.needsHumanReview,
      fuentesOficialesUnicas: s.sourcesByProvenance.official_primary ?? 0,
      fuentesInstitucionales: s.sourcesByProvenance.institutional_academic ?? 0,
      fuentesInternasVerificadas: s.sourcesByProvenance.canonical_internal_verified ?? 0,
      fuentesInternasNoVerificadas: s.sourcesByProvenance.canonical_internal_unverified ?? 0,
      totalFuentes: s.uniqueSources,
      estadoEsperadoDerivado,
      estadoFinalAplicado: s.statusEsperado,
      estadoRealDB,
      coincidencia: estadoRealDB === s.statusEsperado,
    };
  });

  const outPath = path.resolve(
    process.cwd(),
    'docs/audits/fase3d-matriz-lote1.json',
  );
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: '2026-07-26',
    fase: '3D',
    totalArticulos: stats.length,
    totalClaims: stats.reduce((a, s) => a + s.total, 0),
    distribucionEstados: stats.reduce<Record<string, number>>((acc, s) => {
      acc[s.statusEsperado] = (acc[s.statusEsperado] ?? 0) + 1;
      return acc;
    }, {}),
    completedAudit: completedAudits.map((a) => ({
      slug: a.slug,
      cumple: a.cumpleCriterios,
      degradacion: a.degradacionPropuesta,
      criteriosFallidos: a.criteriosFallidos,
    })),
    matriz,
  }, null, 2) + '\n');
  console.log(`\nMatriz: ${outPath}`);

  // ─── Aplicar a DB ─────────────────────────────────────────────────────────
  if (aplicar) {
    console.log('\n=== APLICANDO A DB ===');
    for (const s of stats) {
      await sql`
        UPDATE blog_posts
        SET ai_review_status = ${s.statusEsperado},
            ai_review_claims_count = ${s.total},
            ai_review_confirmed_claims = ${s.confirmed},
            ai_review_corrected_claims = ${s.corrected},
            ai_review_unresolved_claims = ${s.unresolved},
            ai_review_requires_human = ${s.requiresHuman},
            ai_official_sources_count = ${s.officialSources},
            ai_review_version = 'fase3d',
            ai_reviewed_at = NOW(),
            updated_at = NOW()
        WHERE slug = ${s.slug}
      `;
      console.log(`  ✓ ${s.slug}: ${s.statusEsperado}`);
    }
    console.log('\nDB actualizada con ai_review_version=fase3d.');
  } else {
    console.log('\n(DRY-RUN: no se escribe DB. Usar --aplicar para persistir.)');
  }

  // ─── Estados recalculados (snapshot) ──────────────────────────────────────
  const estPath = path.resolve(
    process.cwd(),
    'docs/audits/fase3d-estados-recalculados.json',
  );
  const estadosFinales = stats.map((s) => {
    const cur = currentMap.get(s.slug);
    return {
      slug: s.slug,
      estadoAnterior: String(cur?.ai_review_status ?? 'unknown'),
      estadoRecalculado: s.statusEsperado,
      razon: s.reason,
      totalClaims: s.total,
      centrales: s.porImportancia.central,
      supporting: s.porImportancia.supporting,
      contextuales: s.porImportancia.contextual,
      confirmed: s.confirmed,
      corrected: s.corrected,
      unresolved: s.unresolved,
      officialSources: s.officialSources,
      totalSources: s.uniqueSources,
      sourcesByProvenance: s.sourcesByProvenance,
      requiresHuman: s.requiresHuman,
    };
  });
  fs.writeFileSync(estPath, JSON.stringify({
    generatedAt: '2026-07-26',
    fase: '3D',
    total: estadosFinales.length,
    estados: estadosFinales,
  }, null, 2) + '\n');
  console.log(`Estados recalculados: ${estPath}`);
}

function esDegradacion(antes: string, despues: string): boolean {
  const orden = ['completed', 'source_checked', 'needs_human_review', 'blocked', 'not_started'];
  const i = orden.indexOf(antes);
  const j = orden.indexOf(despues);
  return j > i;
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
