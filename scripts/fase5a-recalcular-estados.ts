/**
 * Fase 5A — Recalcular estados definitivos del Lote 3.
 *
 * Usa el pipeline canónico (lib/ai/review-status.ts deriveReviewStatus +
 * lib/ai/review-invariants.ts validateReviewInvariants) sobre los claims
 * finales del Lote 3 para derivar el estado honesto de cada artículo.
 *
 * Lee:
 *   - docs/audits/fase5a-lote3-claims-finales.json
 * Escribe:
 *   - docs/audits/fase5a-lote3-estados-finales.json
 *   - docs/audits/fase5a-lote3-matriz.json
 *
 * Uso:
 *   npx tsx scripts/fase5a-recalcular-estados.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  deriveReviewStatus,
  type StatusInputs,
} from '../lib/ai/review-status';
import { validateReviewInvariants } from '../lib/ai/review-invariants';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

interface Claim {
  slug: string;
  decision: string;
  importancia: string;
  fuenteCanonicaVerificada: string | null;
  necesitaRevisionHumana: boolean;
  aplicadoABody?: boolean;
}

function countsAsOfficial(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.gob\.hn\//.test(url) || /^data\//.test(url);
}

function main() {
  const claimsData = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase5a-lote3-claims-finales.json'), 'utf8'),
  );
  const claims: Claim[] = claimsData.claims;

  // Agrupar claims por slug
  const porSlug = new Map<string, Claim[]>();
  for (const c of claims) {
    if (!porSlug.has(c.slug)) porSlug.set(c.slug, []);
    porSlug.get(c.slug)!.push(c);
  }

  const estados: Array<{
    slug: string;
    estadoAnterior: string;
    estadoFinal: string;
    razon: string;
    totalClaims: number;
    centrales: number;
    centralConfirmed: number;
    centralCorrected: number;
    centralUnresolved: number;
    officialSources: number;
    requiresHuman: boolean;
    invarianteOk: boolean;
  }> = [];

  // Cargar estados anteriores desde estados-iniciales
  const estadosIniciales = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase5a-lote3-estados-iniciales.json'), 'utf8'),
  );
  const estadoAnteriorPorSlug: Record<string, string> = {};
  for (const a of estadosIniciales.articulos)
    estadoAnteriorPorSlug[a.slug] = a.aiReviewStatus;

  for (const [slug, claimsSlug] of porSlug) {
    // Contar claims centrales
    const centrales = claimsSlug.filter((c) => c.importancia === 'central');
    const centralConfirmed = centrales.filter(
      (c) => c.decision === 'confirmed',
    ).length;
    const centralCorrected = centrales.filter(
      (c) => c.decision === 'corrected' && c.aplicadoABody !== false,
    ).length;
    const centralUnresolved = centrales.filter(
      (c) =>
        c.decision === 'needs_human_review' ||
        c.decision === 'unsupported' ||
        c.decision === 'ambiguous' ||
        (c.decision === 'corrected' && c.aplicadoABody === false),
    ).length;

    // Fuentes oficiales únicas
    const fuentesOficiales = new Set<string>();
    for (const c of claimsSlug) {
      if (countsAsOfficial(c.fuenteCanonicaVerificada)) {
        fuentesOficiales.add(c.fuenteCanonicaVerificada!);
      }
    }
    const officialSources = fuentesOficiales.size;
    const requiresHuman = claimsSlug.some((c) => c.necesitaRevisionHumana);

    const inputs: StatusInputs = {
      centralConfirmed,
      centralCorrected,
      centralUnresolved,
      officialSources,
      requiresHuman,
    };
    const result = deriveReviewStatus(inputs);

    // Validar invariantes (firma canónica: validateReviewInvariants(slug, data) => InvariantError[])
    const errors = validateReviewInvariants(slug, {
      aiReviewStatus: result.status,
      aiReviewClaimsCount: claimsSlug.length,
      aiReviewConfirmedClaims: claimsSlug.filter((c) => c.decision === 'confirmed').length,
      aiReviewCorrectedClaims: claimsSlug.filter((c) => c.decision === 'corrected').length,
      aiReviewUnresolvedClaims: claimsSlug.filter((c) => c.decision === 'needs_human_review').length,
      aiReviewRequiresHuman: requiresHuman,
      aiOfficialSourcesCount: officialSources,
      aiReviewedAt: new Date().toISOString(),
      reviewedAt: null,
      centralUnresolvedCount: centralUnresolved,
    });

    estados.push({
      slug,
      estadoAnterior: estadoAnteriorPorSlug[slug] ?? 'not_started',
      estadoFinal: result.status,
      razon: result.reason,
      totalClaims: claimsSlug.length,
      centrales: centrales.length,
      centralConfirmed,
      centralCorrected,
      centralUnresolved,
      officialSources,
      requiresHuman,
      invarianteOk: errors.length === 0,
    });
  }

  // Distribución
  const distribucion: Record<string, number> = {};
  for (const e of estados)
    distribucion[e.estadoFinal] = (distribucion[e.estadoFinal] ?? 0) + 1;

  const out = {
    generatedAt: new Date().toISOString(),
    fase: '5A',
    lote: 3,
    enunciadoSeccion: '§10',
    metodo:
      'Estados derivados con deriveReviewStatus (lib/ai/review-status.ts) + ' +
      'validateReviewInvariants (lib/ai/review-invariants.ts) sobre los 80 claims finales.',
    total: estados.length,
    distribucionEstados: distribucion,
    estados,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase5a-lote3-estados-finales.json'),
    JSON.stringify(out, null, 2),
  );

  // Matriz (estado esperado derivado vs estado DB actual)
  const matriz = estados.map((e) => {
    const coincide = e.estadoFinal === e.estadoAnterior;
    return {
      slug: e.slug,
      estadoEsperadoDerivado: e.estadoFinal,
      estadoRealDB: e.estadoAnterior,
      coincide,
      motivo: coincide
        ? 'coincide (estado DB ya actualizado)'
        : 'el estado DB aún no se actualiza; se aplica con fase5a-aplicar-estados-db.ts',
      invarianteOk: e.invarianteOk,
    };
  });
  const outMatriz = {
    generatedAt: new Date().toISOString(),
    fase: '5A',
    lote: 3,
    enunciadoSeccion: '§10',
    nota:
      'Estado esperado derivado del pipeline canónico. El estado real DB se ' +
      'actualiza con fase5a-aplicar-estados-db.ts (--aplicar).',
    total: matriz.length,
    matriz,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase5a-lote3-matriz.json'),
    JSON.stringify(outMatriz, null, 2),
  );

  console.log(`OK: ${estados.length} estados calculados.`);
  console.log('Distribución:', distribucion);
  const invariantesRotos = estados.filter((e) => !e.invarianteOk);
  console.log(
    `Invariantes: ${estados.length - invariantesRotos.length} OK, ${invariantesRotos.length} rotos`,
  );
  if (invariantesRotos.length > 0) {
    console.log('Invariantes rotos:');
    for (const e of invariantesRotos) console.log(`  - ${e.slug}: ${e.estadoFinal}`);
  }
  console.log('  -> docs/audits/fase5a-lote3-estados-finales.json');
  console.log('  -> docs/audits/fase5a-lote3-matriz.json');
}

main();
