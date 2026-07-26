/**
 * Fase 4B — Recalcular estados DEFINITIVOS del Lote 2.
 *
 * Diferencia respecto a Fase 4A:
 *   - Usa fase4b-integridad-correcciones.json para reclasificar los claims
 *     `corrected` no aplicados al body como `needs_human_review`.
 *   - Reaplica deriveReviewStatus con los conteos honestos (un claim corrected
 *     no aplicado al body es un claim pendiente y, si es central, fuerza
 *     needs_human_review).
 *
 * Salida:
 *   - docs/audits/fase4b-estados-definitivos.json
 *
 * Uso:
 *   npx tsx scripts/fase4b-recalcular-estados.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { deriveReviewStatus } from '../lib/ai/review-status';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

interface Claim {
  id: string;
  slug: string;
  importancia: 'central' | 'supporting' | 'contextual';
  decision:
    | 'confirmed'
    | 'corrected'
    | 'unsupported'
    | 'ambiguous'
    | 'needs_human_review';
  fuenteCanonicaVerificada: string | null;
}

interface FilaIntegridad {
  claimId: string;
  aplicadoABody: boolean;
  decisionFase4B: 'corrected' | 'needs_human_review';
}

function main() {
  const claimsJson = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-claims-finales.json'), 'utf8'),
  );
  const claims = claimsJson.claims as Claim[];

  const integridadJson = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4b-integridad-correcciones.json'), 'utf8'),
  );
  const filasIntegridad = integridadJson.filas as FilaIntegridad[];
  const decisionPorClaim = new Map(filasIntegridad.map((f) => [f.claimId, f.decisionFase4B]));

  // Slugs del Lote 2
  const slugsLote2: string[] = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-seleccion.json'), 'utf8'),
  ).lote2.map((e: { slug: string }) => e.slug);

  const estados4A = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-estados-finales.json'), 'utf8'),
  ).estados as Array<{
    slug: string;
    estadoFinal: string;
    centralConfirmed: number;
    centralCorrected: number;
    centralUnresolved: number;
    officialSources: number;
    requiresHuman: boolean;
  }>;
  const estado4APorSlug = new Map(estados4A.map((e) => [e.slug, e]));

  // Agrupar claims por slug, aplicando la reclasificación Fase 4B
  const claimsPorSlug = new Map<string, Claim[]>();
  for (const c of claims) {
    if (!claimsPorSlug.has(c.slug)) claimsPorSlug.set(c.slug, []);
    // Reclasificación: si el claim es corrected pero Fase 4B lo marca como
    // needs_human_review (no aplicado), usar esa decisión.
    const decisionB = decisionPorClaim.get(c.id);
    const claimReclasificado: Claim =
      c.decision === 'corrected' && decisionB === 'needs_human_review'
        ? { ...c, decision: 'needs_human_review' }
        : c;
    claimsPorSlug.get(c.slug)!.push(claimReclasificado);
  }
  for (const s of slugsLote2) {
    if (!claimsPorSlug.has(s)) claimsPorSlug.set(s, []);
  }

  const estadosDefinitivos: unknown[] = [];

  for (const slug of [...claimsPorSlug.keys()].sort()) {
    const cs = claimsPorSlug.get(slug)!;
    const centrales = cs.filter((c) => c.importancia === 'central');
    const centralConfirmed = centrales.filter((c) => c.decision === 'confirmed').length;
    // corrected que SIGUE siendo corrected en Fase 4B (aplicado al body)
    const centralCorrectedAplicado = centrales.filter(
      (c) => c.decision === 'corrected',
    ).length;
    const centralUnresolved = centrales.filter(
      (c) =>
        c.decision === 'unsupported' ||
        c.decision === 'ambiguous' ||
        c.decision === 'needs_human_review',
    ).length;
    const officialSources = cs.filter(
      (c) =>
        (c.decision === 'confirmed' || c.decision === 'corrected') &&
        c.fuenteCanonicaVerificada &&
        c.fuenteCanonicaVerificada.startsWith('data/'),
    ).length;
    const requiresHuman = cs.some((c) => c.decision === 'needs_human_review');

    const resultado = deriveReviewStatus({
      centralConfirmed,
      centralCorrected: centralCorrectedAplicado,
      centralUnresolved,
      officialSources,
      requiresHuman,
    });

    const prev = estado4APorSlug.get(slug);

    estadosDefinitivos.push({
      slug,
      estadoFase4A: prev?.estadoFinal ?? 'not_started',
      estadoFase4B: resultado.status,
      cambio:
        prev && prev.estadoFinal !== resultado.status
          ? `${prev.estadoFinal} -> ${resultado.status}`
          : 'sin cambios',
      razon: resultado.reason,
      totalClaims: cs.length,
      centrales: centrales.length,
      centralConfirmed,
      centralCorrectedAplicado,
      centralUnresolved,
      officialSources,
      requiresHuman,
    });
  }

  const porEstado: Record<string, number> = {};
  for (const e of estadosDefinitivos as { estadoFase4B: string }[]) {
    porEstado[e.estadoFase4B] = (porEstado[e.estadoFase4B] ?? 0) + 1;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    fase: '4B',
    lote: 2,
    enunciadoSeccion: '§5 + §6',
    metodo:
      'deriveReviewStatus (lib/ai/review-status.ts) sobre claims reclasificados ' +
      'con fase4b-integridad-correcciones.json. Regla: corrected no aplicado ' +
      'al body => needs_human_review (cuenta como centralUnresolved).',
    regla: 'corrected + no aplicado al body = claim pendiente',
    total: estadosDefinitivos.length,
    distribucionEstadosDefinitivos: porEstado,
    estadosDefinitivos,
  };

  fs.writeFileSync(
    path.join(AUDITS, 'fase4b-estados-definitivos.json'),
    JSON.stringify(out, null, 2),
  );

  console.log(`OK: ${estadosDefinitivos.length} estados definitivos.`);
  console.log('Distribución:', porEstado);
  console.log('  -> docs/audits/fase4b-estados-definitivos.json');
}

main();
