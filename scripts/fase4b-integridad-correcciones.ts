/**
 * Fase 4B — Puerta de integridad de claims corregidos.
 *
 * Regla rectora (enunciado Fase 4B §3):
 *   corrected + no aplicado al body = claim pendiente
 *
 * Lo que hace este script (determinista, reproducible):
 *   1. Lee los 8 claims `corrected` de fase4a-lote2-claims-finales.json.
 *   2. Verifica el body actual en DB buscando el textoAnterior (cuando existe)
 *      y el textoSustituto. Determina aplicado/no-aplicado.
 *   3. Reclasifica los `corrected` NO aplicados como `needs_human_review`
 *      (porque ningún claim trae `correctedText` ni sustitución inequívoca,
 *      requieren decisión jurídica humana).
 *   4. Genera docs/audits/fase4b-integridad-correcciones.json.
 *
 * Fuentes de verdad:
 *   - claims: docs/audits/fase4a-lote2-claims-finales.json (R2)
 *   - body:   blog_posts en Neon (R2)
 *   - textos antiguos/nuevos de pension: scripts/fase4a-aplicar-correcciones.ts
 *
 * Uso:
 *   npx tsx scripts/fase4b-integridad-correcciones.ts
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

// Textos antiguos/nuevos para los 3 claims de pension-alimenticia-porcentaje,
// extraídos de scripts/fase4a-aplicar-correcciones.ts (fuente única de verdad
// de la aplicación). Para los otros 5 claims no existe sustitución inequívoca.
interface ParSustitucion {
  claimId: string;
  textoAnterior: string;
  textoSustituto: string;
  fuente: string;
}
const PARES_SUSTITUCION: ParSustitucion[] = [
  {
    claimId: '4a-pension-alimenticia-porc-01',
    textoAnterior:
      'El <strong>Código Civil de Honduras</strong> también aporta a esta regulación, especialmente en lo referente a alimentos en casos de divorcio y separación, como se detalla en el Artículo 1069 y el Artículo 1230, respectivamente.',
    textoSustituto:
      'La regulación principal de la pensión alimenticia corresponde al <strong>Código de Familia (Decreto 76-84)</strong>, que establece el orden de los obligados a prestar alimentos y los criterios para fijar el monto según las necesidades del beneficiario y la capacidad económica del obligado.',
    fuente: 'Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn); data/codigo_civil.json',
  },
  {
    // El claim 02 comparte párrafo con el 01 (la cita a Art. 1230 aparece en
    // el mismo párrafo que la de Art. 1069). Al aplicar -01 se sustituyó el
    // párrafo entero, así que la cita a Art. 1230 también desapareció. Lo
    // reflejamos como par independiente cuya aguja es la propia cita, y cuya
    // condición de "aplicado" es que esa cita no exista en el body.
    claimId: '4a-pension-alimenticia-porc-02',
    textoAnterior: 'Artículo 1230',
    textoSustituto: 'Código de Familia (Decreto 76-84)',
    fuente: 'Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn)',
  },
  {
    claimId: '4a-pension-alimenticia-porc-03',
    textoAnterior:
      '<li><strong>Código Civil de Honduras:</strong> Artículo 1593 (obligación de alimentar y educar al hijo).</li>',
    textoSustituto:
      '<li><strong>Código de Familia de Honduras (Decreto 76-84):</strong> regula la obligación de alimentos y la fijación judicial del monto según las necesidades del beneficiario y la capacidad del obligado.</li>',
    fuente: 'data/codigo_civil.json (Art. 1593 inexistente); Código de Familia (Decreto 76-84)',
  },
];

interface ClaimFinal {
  id: string;
  slug: string;
  textoExacto: string | null;
  importancia: string;
  decision: string;
  motivo: string;
  articuloMencionado: string | null;
  fuenteCanonicaVerificada: string | null;
  necesitaRevisionHumana: boolean;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const claimsJson = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-claims-finales.json'), 'utf8'),
  );
  const claims = claimsJson.claims as ClaimFinal[];
  const claimsCorrected = claims.filter((c) => c.decision === 'corrected');

  // Body actual en DB por slug
  const slugs = [...new Set(claimsCorrected.map((c) => c.slug))];
  const posts = (await sql`
    SELECT slug, body FROM blog_posts WHERE slug = ANY(${slugs})
  `) as { slug: string; body: string }[];
  const bodyPorSlug = new Map(posts.map((p) => [p.slug, p.body]));

  const filas: unknown[] = [];
  let aplicados = 0;
  let pendientes = 0;

  for (const c of claimsCorrected) {
    const body = bodyPorSlug.get(c.slug) ?? '';
    const par = PARES_SUSTITUCION.find((p) => p.claimId === c.id);

    let aplicadoABody: boolean;
    let textoAnteriorPresente: boolean;
    let textoSustitutoPresente: boolean | null;
    let reclasificacion: string;
    let evidencia: string;

    if (par) {
      // Claim con par buscar/reemplazar documentado.
      textoAnteriorPresente = body.includes(par.textoAnterior);
      textoSustitutoPresente = body.includes(par.textoSustituto);
      // Caso A: sustitución directa aplicada.
      // Caso B (pension-porc-02): la cita residía en el mismo párrafo que la
      // cita principal (pension-porc-01) y se eliminó al corregir el párrafo.
      // La condición honesta es: la cita antigua ya no está en el body, aunque
      // el textoSustituto literal no aparezca (lo aporta el par principal).
      const corregidoPorParPrincipal =
        c.id === '4a-pension-alimenticia-porc-02' && !textoAnteriorPresente;
      aplicadoABody =
        (!textoAnteriorPresente && textoSustitutoPresente) ||
        corregidoPorParPrincipal;
      evidencia = aplicadoABody
        ? textoSustitutoPresente
          ? `textoAnterior ausente y textoSustituto presente en body (len=${body.length})`
          : `textoAnterior ausente; corregido por par principal (pension-porc-01) que sustituyó el párrafo compartido (len=${body.length})`
        : `textoAnterior presente=${textoAnteriorPresente}; textoSustituto presente=${textoSustitutoPresente}`;
    } else {
      // Claim sin sustitución inequívoca: verificar si el texto antiguo
      // (articuloMencionado / textoExacto) sigue presente en el body.
      const aguja = c.textoExacto ?? c.articuloMencionado ?? '';
      textoAnteriorPresente = aguja ? body.includes(aguja) : false;
      textoSustitutoPresente = null;
      aplicadoABody = false; // sin par documentado, no es aplicable automáticamente
      evidencia = aguja
        ? `textoAnterior "${aguja}" presente=${textoAnteriorPresente} en body (len=${body.length}); sin par de sustitución documentado`
        : 'sin aguja verificable; sin par de sustitución documentado';
    }

    if (aplicadoABody) {
      aplicados++;
      reclasificacion = 'corrected'; // se mantiene
    } else {
      pendientes++;
      // Sin sustitución inequívoca ni aplicada → necesita decisión humana.
      reclasificacion = 'needs_human_review';
    }

    filas.push({
      claimId: c.id,
      slug: c.slug,
      importancia: c.importancia,
      textoAnterior: par?.textoAnterior ?? c.textoExacto ?? c.articuloMencionado,
      textoSustituto: par?.textoSustituto ?? null,
      fuente: par?.fuente ?? c.fuenteCanonicaVerificada ?? null,
      evidencia,
      aplicadoABody,
      aplicadoAMetadatos: false, // ninguna corrección toca title/description
      requiereRevisionHumana: !aplicadoABody,
      decisionFase4A: 'corrected',
      decisionFase4B: reclasificacion,
      motivoOriginal: c.motivo,
    });
  }

  const out = {
    generatedAt: new Date().toISOString(),
    fase: '4B',
    lote: 2,
    enunciadoSeccion: '§3 + §5',
    metodo:
      'Verificación directa del body en Neon para cada claim corrected. ' +
      'Reclasificación: corrected + no aplicado al body => needs_human_review.',
    regla: 'corrected + no aplicado al body = claim pendiente (needs_human_review)',
    totalCorrectedFase4A: claimsCorrected.length,
    aplicadosABody: aplicados,
    pendientes: pendientes,
    filas,
  };

  fs.writeFileSync(
    path.join(AUDITS, 'fase4b-integridad-correcciones.json'),
    JSON.stringify(out, null, 2),
  );

  console.log(`OK: ${aplicados} aplicados, ${pendientes} pendientes (reclasificados a needs_human_review).`);
  console.log('  -> docs/audits/fase4b-integridad-correcciones.json');
}

main().catch((e) => {
  console.error('ERROR fatal:', e);
  process.exit(1);
});
