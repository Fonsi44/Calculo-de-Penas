/**
 * Fase 4A — Aplicar correcciones editoriales verificables al body del Lote 2.
 *
 * Aplica ÚNICAMENTE las correcciones con evidencia firme (canon del repo +
 * fuente oficial poderjudicial.gob.hn). Patrón: dry-run, ocurrencia única,
 * hash SHA-256 antes/después, idempotencia, rollback verificable.
 *
 * Reglas (§8 del enunciado):
 *   - No inventar experiencia, reseñas ni resultados.
 *   - No prometer éxito, no usar superlativos comerciales.
 *   - No convertir recomendaciones en obligaciones legales.
 *   - No modificar artículos fuera del Lote 2.
 *   - No alterar la identidad visual.
 *
 * Uso:
 *   npx tsx scripts/fase4a-aplicar-correcciones.ts --dry-run
 *   npx tsx scripts/fase4a-aplicar-correcciones.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

// --- Correcciones canónicas (buscar/reemplazar exacto) -------------------
// Cada entrada está verificada contra:
//   1. data/codigo_civil.json (Arts. 1069 y 1230 existen pero tratan otros temas).
//   2. Poder Judicial de Honduras (poderjudicial.gob.hn): la pensión alimenticia
//      se regula en el Código de Familia (Decreto 76-84), no en el Código Civil.
interface CorreccionCanonica {
  slug: string;
  claimId: string;
  buscar: string; // texto EXACTO en el body (HTML)
  reemplazar: string;
  motivo: string;
  fuente: string;
}

const CORRECCIONES: CorreccionCanonica[] = [
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    claimId: '4a-pension-alimenticia-porc-01',
    buscar:
      'El <strong>Código Civil de Honduras</strong> también aporta a esta regulación, especialmente en lo referente a alimentos en casos de divorcio y separación, como se detalla en el Artículo 1069 y el Artículo 1230, respectivamente.',
    reemplazar:
      'La regulación principal de la pensión alimenticia corresponde al <strong>Código de Familia (Decreto 76-84)</strong>, que establece el orden de los obligados a prestar alimentos y los criterios para fijar el monto según las necesidades del beneficiario y la capacidad económica del obligado.',
    motivo:
      'Los Arts. 1069 y 1230 del Código Civil no regulan pensión alimenticia: el Art. 1069 CC trata "asignación desde día cierto" y el Art. 1230 CC trata "tutores, curadores y partición de herencias". La pensión alimenticia se rige por el Código de Familia (Decreto 76-84), Arts. 211 y siguientes.',
    fuente: 'Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn); data/codigo_civil.json',
  },
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    claimId: '4a-pension-alimenticia-porc-05',
    buscar:
      '<li><strong>Código Civil de Honduras:</strong> Artículo 1593 (obligación de alimentar y educar al hijo).</li>',
    reemplazar:
      '<li><strong>Código de Familia de Honduras (Decreto 76-84):</strong> regula la obligación de alimentos y la fijación judicial del monto según las necesidades del beneficiario y la capacidad del obligado.</li>',
    motivo:
      'El Código Civil de Honduras no contiene un Art. 1593 (su articulado no supera los 2400 en el canon, pero el 1593 no existe). La obligación de alimentar y educar al hijo está regulada en el Código de Familia, no en el Código Civil.',
    fuente: 'data/codigo_civil.json (Art. 1593 inexistente); Código de Familia (Decreto 76-84)',
  },
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    claimId: '4a-pension-alimenticia-porc-01b',
    buscar:
      '<li><strong>Código Civil de Honduras:</strong> Artículo 1069 (pensión a cónyuge inocente en divorcio) y Artículo 1230 (negativa de alimentos como causal de separación).</li>',
    reemplazar:
      '<li><strong>Código de Familia de Honduras (Decreto 76-84):</strong> Arts. 207-225 regulan la obligación alimentaria, el orden de los obligados y la fijación judicial del monto.</li>',
    motivo:
      'Los Arts. 1069 y 1230 del Código Civil no regulan pensión alimenticia ni divorcio: el Art. 1069 CC trata "asignación desde día cierto" y el Art. 1230 CC trata "tutores, curadores y partición de herencias". Toda la regulación de alimentos está en el Código de Familia (Decreto 76-84).',
    fuente: 'data/codigo_civil.json (Arts. 1069 y 1230 ajenos al tema); Poder Judicial de Honduras (poderjudicial.gob.hn)',
  },
];

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

async function main() {
  const modo = process.argv.includes('--aplicar') ? 'aplicar' : 'dry-run';
  console.log(`Modo: ${modo}`);

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const slugsUnicos = [...new Set(CORRECCIONES.map((c) => c.slug))];
  const posts = (await sql`
    SELECT id, slug, body FROM blog_posts
    WHERE slug = ANY(${slugsUnicos})
  `) as { id: string; slug: string; body: string }[];
  const porSlug = new Map(posts.map((p) => [p.slug, p]));

  const resultados: unknown[] = [];

  for (const corr of CORRECCIONES) {
    const post = porSlug.get(corr.slug);
    if (!post) {
      resultados.push({ slug: corr.slug, claimId: corr.claimId, aplicado: false, razon: 'slug no encontrado en DB', ocurrencias: 0 });
      continue;
    }
    const body = post.body;
    const hashAntes = sha256(body);
    const ocurrencias = body.split(corr.buscar).length - 1;

    if (ocurrencias === 0) {
      // Idempotencia: si ya está aplicada, el texto buscar no aparece. Verificamos
      // que el texto reemplazar SÍ esté presente (señal de aplicación previa).
      const yaAplicada = body.includes(corr.reemplazar);
      resultados.push({
        slug: corr.slug,
        claimId: corr.claimId,
        aplicado: false,
        razon: yaAplicada ? 'idempotente (ya aplicada previamente)' : 'texto buscar no encontrado',
        ocurrencias: 0,
        hashAntes,
      });
      continue;
    }
    if (ocurrencias > 1) {
      resultados.push({
        slug: corr.slug,
        claimId: corr.claimId,
        aplicado: false,
        razon: `ocurrencia no única (${ocurrencias}) — abortar`,
        ocurrencias,
        hashAntes,
      });
      continue;
    }

    const bodyNuevo = body.replace(corr.buscar, corr.reemplazar);
    const hashDespues = sha256(bodyNuevo);

    if (modo === 'aplicar') {
      await sql`
        UPDATE blog_posts
        SET body = ${bodyNuevo}, updated_at = NOW()
        WHERE id = ${post.id}
      `;
    }

    resultados.push({
      slug: corr.slug,
      claimId: corr.claimId,
      aplicado: modo === 'aplicar',
      razon: modo === 'aplicar' ? 'aplicada' : 'dry-run OK (listo para aplicar)',
      ocurrencias: 1,
      hashAntes,
      hashDespues,
      deltaBytes: bodyNuevo.length - body.length,
    });
  }

  const aplicadas = resultados.filter((r) => (r as { aplicado: boolean }).aplicado).length;
  const out = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    enunciadoSeccion: '§8',
    modo,
    totalCorrecciones: CORRECCIONES.length,
    aplicadas,
    abortadas: CORRECCIONES.length - aplicadas,
    correcciones: CORRECCIONES.map((c) => ({
      slug: c.slug,
      claimId: c.claimId,
      motivo: c.motivo,
      fuente: c.fuente,
    })),
    resultados,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase4a-lote2-aplicacion-correcciones.json'),
    JSON.stringify(out, null, 2),
  );

  console.log(`\nOK: ${aplicadas}/${CORRECCIONES.length} correcciones ${modo === 'aplicar' ? 'aplicadas' : 'validadas (dry-run)'}.`);
  console.log('  -> docs/audits/fase4a-lote2-aplicacion-correcciones.json');
}

main().catch((e) => {
  console.error('ERROR fatal:', e);
  process.exit(1);
});
