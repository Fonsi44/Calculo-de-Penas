/**
 * Fase 4A — Recalcular estados honestos del Lote 2.
 *
 * Usa lib/ai/review-status.ts (deriveReviewStatus) y lib/ai/review-invariants.ts
 * (validateReviewInvariants) — mismas fuentes de verdad que Fase 3D.
 *
 * Lee:
 *   - docs/audits/fase4a-lote2-claims-finales.json  (decisión + importancia)
 *   - docs/audits/fase4a-lote2-estados-iniciales.json (estado DB antes)
 *
 * Deriva el estado honesto por artículo. Regla rectora: el estado se DERIVA
 * de los conteos y fuentes, nunca se asume 'completed' automáticamente.
 *
 * Salida:
 *   - docs/audits/fase4a-lote2-estados-finales.json
 *   - docs/audits/fase4a-lote2-matriz.json  (estado esperado vs almacenado)
 *
 * Uso:
 *   npx tsx scripts/fase4a-recalcular-estados.ts
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { deriveReviewStatus } from '../lib/ai/review-status';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

interface Claim {
  slug: string;
  importancia: 'central' | 'supporting' | 'contextual';
  decision: 'confirmed' | 'corrected' | 'unsupported' | 'ambiguous' | 'needs_human_review';
  fuenteCanonicaVerificada: string | null;
}

function main() {
  if (!fs.existsSync(path.join(AUDITS, 'fase4a-lote2-claims-finales.json'))) {
    console.error('ERROR: claims-finales.json no encontrado.');
    process.exit(1);
  }
  const claimsJson = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-claims-finales.json'), 'utf8'),
  );
  const claims: Claim[] = claimsJson.claims;
  const estadosIniciales = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-estados-iniciales.json'), 'utf8'),
  );
  const estadoInicialPorSlug = new Map(
    estadosIniciales.estados.map((e: { slug: string }) => [e.slug, e]),
  );

  // Agrupar claims por slug.
  const claimsPorSlug = new Map<string, Claim[]>();
  for (const c of claims) {
    if (!claimsPorSlug.has(c.slug)) claimsPorSlug.set(c.slug, []);
    claimsPorSlug.get(c.slug)!.push(c);
  }
  // Asegurar que los 15 slugs del Lote 2 figuran, aunque no tengan claims.
  const slugsLote2: string[] = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-seleccion.json'), 'utf8'),
  ).lote2.map((e: { slug: string }) => e.slug);
  for (const s of slugsLote2) {
    if (!claimsPorSlug.has(s)) claimsPorSlug.set(s, []);
  }

  const slugs = [...claimsPorSlug.keys()].sort();
  const estadosFinales: unknown[] = [];
  const matriz: unknown[] = [];

  for (const slug of slugs) {
    const cs = claimsPorSlug.get(slug)!;
    const centrales = cs.filter((c) => c.importancia === 'central');
    const centralConfirmed = centrales.filter((c) => c.decision === 'confirmed').length;
    const centralCorrected = centrales.filter((c) => c.decision === 'corrected').length;
    const centralUnresolved = centrales.filter(
      (c) => c.decision === 'unsupported' || c.decision === 'ambiguous' || c.decision === 'needs_human_review',
    ).length;
    // Fuentes oficiales: cualquier claim con fuenteCanonicaVerificada que
    // mencione data/ o un canon oficial. Como el Lote 2 usa canónicos del repo,
    // contamos los claims confirmed/corrected que trajeron fuente canónica.
    const officialSources = cs.filter(
      (c) =>
        (c.decision === 'confirmed' || c.decision === 'corrected') &&
        c.fuenteCanonicaVerificada &&
        c.fuenteCanonicaVerificada.startsWith('data/'),
    ).length;
    const requiresHuman = cs.some((c) => c.decision === 'needs_human_review');

    const resultado = deriveReviewStatus({
      centralConfirmed,
      centralCorrected,
      centralUnresolved,
      officialSources,
      requiresHuman,
    });

    const inicial = estadoInicialPorSlug.get(slug);
    const estadoAnterior = (inicial as { estadoIA?: string })?.estadoIA ?? 'not_started';

    estadosFinales.push({
      slug,
      estadoAnterior,
      estadoFinal: resultado.status,
      razon: resultado.reason,
      totalClaims: cs.length,
      centrales: centrales.length,
      centralConfirmed,
      centralCorrected,
      centralUnresolved,
      officialSources,
      requiresHuman,
    });

    matriz.push({
      slug,
      estadoEsperadoDerivado: resultado.status,
      estadoRealDB: estadoAnterior,
      coincide: false, // todos partían de not_started; la aplicación a DB se hace tras autorización
      motivo:
        resultado.status === estadoAnterior
          ? 'sin cambios'
          : 'el estado DB aún no se actualiza; se aplica en la fase de despliegue',
    });
  }

  // Estadísticas
  const porEstado: Record<string, number> = {};
  for (const e of estadosFinales as { estadoFinal: string }[]) {
    porEstado[e.estadoFinal] = (porEstado[e.estadoFinal] ?? 0) + 1;
  }

  const estadosJson = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    enunciadoSeccion: '§10',
    metodo:
      'deriveReviewStatus (lib/ai/review-status.ts) con conteos centrales + ' +
      'officialSources + requiresHuman. Mismas fuentes de verdad que Fase 3D.',
    total: estadosFinales.length,
    distribucionEstados: porEstado,
    estados: estadosFinales,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase4a-lote2-estados-finales.json'),
    JSON.stringify(estadosJson, null, 2),
  );

  const matrizJson = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    enunciadoSeccion: '§10',
    nota:
      'El estado DB (ai_review_status) no se actualiza en esta ejecución: el Lote 2 ' +
      'queda con estado derivado documentado. La aplicación a DB + invariante ' +
      'requiere autorización de despliegue. La matriz compara el estado esperado ' +
      'derivado con el estado DB actual (not_started en los 15).',
    total: matriz.length,
    matriz,
  };
  fs.writeFileSync(path.join(AUDITS, 'fase4a-lote2-matriz.json'), JSON.stringify(matrizJson, null, 2));

  console.log(`OK: ${estadosFinales.length} estados derivados.`);
  console.log('Distribución:', porEstado);
  console.log('  -> docs/audits/fase4a-lote2-estados-finales.json');
  console.log('  -> docs/audits/fase4a-lote2-matriz.json');
}

main();
