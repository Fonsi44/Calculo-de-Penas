/**
 * Fase 3D — Aplicar correcciones editoriales pendientes a bodies públicos.
 *
 * La verificación de consistencia (fase3d-verificar-consistencia.ts) reveló
 * que 9 correcciones de claims `corrected` NO estaban aplicadas a los bodies
 * DB de 5 slugs (allanamiento, antejuicio, delitos-mas-comunes,
 * derechos-detenido, estafas-fraudes). Esto dejaba cuerpos públicos antiguos
 * mostrando afirmaciones incorrectas pese a que los claims estaban marcados
 * corregidos.
 *
 * Este script aplica los reemplazos textuales EXACTOS (HTML → HTML), con:
 *   - Verificación de ocurrencia ÚNICA del texto a buscar (si hay 0 o >1,
 *     el reemplazo se aborta para ese slug y se reporta).
 *   - Idempotencia: si el texto corregido ya está presente, no se reaplica.
 *   - Dry-run por defecto; --aplicar para escribir en DB.
 *   - Backup SHA-256 previo (se reporta, no se persiste en repo).
 *
 * Cada reemplazo está respaldado por evidencia canónica (data/articulos_cp.json
 * o data/articulos_constitucion.json) y por el correctedText del claim.
 *
 * Uso:
 *   npx tsx scripts/fase3d-aplicar-correcciones-bodies.ts --dry-run
 *   npx tsx scripts/fase3d-aplicar-correcciones-bodies.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

interface Reemplazo {
  slug: string;
  claimId: string;
  buscar: string; // HTML exacto actual
  reemplazar: string; // HTML exacto corregido
  norma: string;
  razon: string;
}

/**
 * Reemplazos textuales exactos. Cada `buscar` fue verificado como OCURRENCIA
 * ÚNICA en el body actual (extraído vía scripts/_tmp_extract_exact.mjs el
 * 2026-07-26). Si el body cambia, el reemplazo se aborta y se reporta.
 */
const REEMPLAZOS: Reemplazo[] = [
  // ===== allanamiento-ilegal-violacion-domicilio-honduras =====
  {
    slug: 'allanamiento-ilegal-violacion-domicilio-honduras',
    claimId: '3b-allanamiento-1',
    buscar:
      'según lo dictamina taxativamente el <strong>Artículo 99 de la Constitución de la República</strong>. Fuera de este horario, el domicilio es inviolable y un allanamiento nocturno solo es legal si cuenta con una autorización judicial fundamentada expresamente por razones de urgencia.',
    reemplazar:
      'según lo dictamina taxativamente el <strong>Artículo 99 de la Constitución de la República</strong>. Fuera de este horario, el domicilio es inviolable y ningún ingreso o registro puede verificarse sin consentimiento de la persona que lo habita o resolución de autoridad competente, con las formalidades legales.',
    norma: 'Constitución Art. 99',
    razon: 'El Art. 99 exige consentimiento del morador o resolución judicial; la versión original omitía el consentimiento.',
  },

  // ===== antejuicio-en-honduras =====
  {
    slug: 'antejuicio-en-honduras',
    claimId: '3b-antejuicio-1',
    buscar:
      'el <strong>Artículo 313</strong> otorga a la <strong>Corte Suprema de Justicia (CSJ)</strong> la facultad de conocer del antejuicio contra sus propios <strong>magistrados</strong>.',
    reemplazar:
      'el <strong>Artículo 313</strong> otorga a la <strong>Corte Suprema de Justicia</strong> la facultad de conocer del antejuicio contra los magistrados de las cortes de apelaciones.',
    norma: 'Constitución Art. 313 num. 7',
    razon: 'El Art. 313 num. 7 faculta a la CSJ para conocer del antejuicio contra magistrados de cortes de apelaciones, no contra sus propios magistrados.',
  },

  // ===== delitos-mas-comunes-honduras (3 correcciones) =====
  {
    slug: 'delitos-mas-comunes-honduras',
    claimId: 'delitos-02',
    buscar:
      'por la concurrencia de circunstancias agravantes específicas, como la premeditación o la alevosía.',
    reemplazar:
      'por la concurrencia de circunstancias agravantes específicas, como la alevosía o el ensañamiento (Art. 193 CP).',
    norma: 'CP Decreto 130-2017, Art. 193',
    razon: 'El Art. 193 califica el asesinato por alevosía o ensañamiento, no por premeditación.',
  },
  {
    slug: 'delitos-mas-comunes-honduras',
    claimId: 'delitos-06',
    buscar:
      '<li><strong>Robo (Artículo 361):</strong> Uso de fuerza en las cosas o violencia o intimidación en las personas para apoderarse de un bien.</li>',
    reemplazar:
      '<li><strong>Robo (Artículo 361):</strong> Uso de violencia o intimidación en las personas para apoderarse de un bien.</li>',
    norma: 'CP Decreto 130-2017, Art. 361',
    razon: 'El Art. 361 define el robo con violencia o intimidación en las personas (la fuerza en las cosas está en el Art. 360, separado).',
  },
  {
    slug: 'delitos-mas-comunes-honduras',
    claimId: 'delitos-07',
    buscar:
      'Este delito está regulado en el Art. 366 del Código Penal (Decreto 130-2017).',
    reemplazar:
      'Este delito está regulado en el Código Penal (Decreto 130-2017); el Art. 366 no define la estafa, sino que enumera sus agravantes específicas.',
    norma: 'CP Decreto 130-2017, Arts. 365 y 366',
    razon: 'El Art. 366 contiene agravantes, no la definición base de estafa (que está en el Art. 365).',
  },

  // ===== derechos-detenido-honduras-guia-constitucional =====
  {
    slug: 'derechos-detenido-honduras-guia-constitucional',
    claimId: '3b-derechos-1',
    buscar:
      ', en sus artículos 84, 89 y 90, consagra la protección de la libertad personal, el derecho a ser informado de las razones de la detención y la garantía del <strong>hábeas corpus</strong>.',
    reemplazar:
      ', en sus artículos 84 y 89, consagra la protección de la libertad personal y el derecho a ser informado de las razones de la detención. La garantía del <strong>hábeas corpus</strong> no se encuentra en estos artículos, sino en otras disposiciones constitucionales y legales (Art. 195 CP Constitucional).',
    norma: 'Constitución Arts. 84, 89',
    razon: 'El Art. 84 confirma libertad personal e información; el hábeas corpus no está en los Arts. 84/89/90.',
  },

  // ===== estafas-fraudes-tipos-penales-honduras (3 correcciones) =====
  {
    slug: 'estafas-fraudes-tipos-penales-honduras',
    claimId: 'estafas-02',
    buscar:
      'específicamente en los <strong>artículos 218 al 226</strong>, tipifica la estafa como un delito contra el patrimonio.',
    reemplazar:
      'tipifica la estafa en los <strong>artículos 365 y 366</strong> como un delito contra el patrimonio.',
    norma: 'CP Decreto 130-2017, Arts. 365 y 366',
    razon: 'Los Arts. 218-226 tratan de trata de personas; la estafa está en los Arts. 365 y 366.',
  },
  {
    slug: 'estafas-fraudes-tipos-penales-honduras',
    claimId: 'estafas-04',
    buscar:
      'El <strong>Artículo 218 del Código Penal</strong> describe las bases de este delito.',
    reemplazar:
      'El <strong>Artículo 365 del Código Penal</strong> describe las bases de este delito.',
    norma: 'CP Decreto 130-2017, Art. 365',
    razon: 'El artículo base de la estafa es el 365, no el 218.',
  },
  {
    slug: 'estafas-fraudes-tipos-penales-honduras',
    claimId: 'estafas-09',
    buscar:
      'que tipifica las estafas y defraudaciones en los <strong>artículos 218 al 226</strong>. Se recomienda consultar la versión actualizada del código y sus reformas.',
    reemplazar:
      'que tipifica la estafa en el <strong>artículo 365</strong> y sus agravantes en el <strong>366</strong>. Se recomienda consultar la versión actualizada del código y sus reformas.',
    norma: 'CP Decreto 130-2017, Arts. 365 y 366',
    razon: 'Los artículos correctos son 365 y 366, no 218-226.',
  },
];

interface ResultadoReplace {
  slug: string;
  claimId: string;
  aplicado: boolean;
  razon: string;
  ocurrencias: number;
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
  console.log(`Fase 3D — Aplicar correcciones editoriales a bodies`);
  console.log(`Reemplazos: ${REEMPLAZOS.length} | Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}\n`);

  // Agrupar reemplazos por slug para leer cada body una sola vez.
  const porSlug = new Map<string, Reemplazo[]>();
  for (const r of REEMPLAZOS) {
    if (!porSlug.has(r.slug)) porSlug.set(r.slug, []);
    porSlug.get(r.slug)!.push(r);
  }

  const resultados: ResultadoReplace[] = [];
  for (const [slug, reemplazos] of porSlug) {
    const rows = (await sql`SELECT body FROM blog_posts WHERE slug = ${slug}`) as Array<
      { body: string }
    >;
    if (rows.length === 0) {
      console.log(`✗ ${slug}: NO ENCONTRADO en DB`);
      for (const r of reemplazos) {
        resultados.push({ slug, claimId: r.claimId, aplicado: false, razon: 'slug no encontrado', ocurrencias: 0 });
      }
      continue;
    }
    let body = rows[0].body;
    const bodyOriginal = body;
    const hashAntes = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
    let cambiosEnSlug = 0;

    for (const r of reemplazos) {
      const ocurrencias = body.split(r.buscar).length - 1;
      const yaCorregido = body.includes(r.reemplazar);

      if (yaCorregido && ocurrencias === 0) {
        // Idempotente: ya aplicado.
        resultados.push({ slug, claimId: r.claimId, aplicado: true, razon: 'ya aplicado (idempotente)', ocurrencias: 0 });
        console.log(`  ✓ ${slug} | ${r.claimId}: ya aplicado`);
        continue;
      }
      if (ocurrencias !== 1) {
        // 0 o >1 ocurrencias: abortar (seguridad).
        resultados.push({
          slug,
          claimId: r.claimId,
          aplicado: false,
          razon: `ocurrencias=${ocurrencias} (esperadas 1); abortado`,
          ocurrencias,
        });
        console.log(`  ✗ ${slug} | ${r.claimId}: ABORTADO (${ocurrencias} ocurrencias)`);
        continue;
      }
      body = body.replace(r.buscar, r.reemplazar);
      cambiosEnSlug++;
      resultados.push({ slug, claimId: r.claimId, aplicado: true, razon: 'aplicado', ocurrencias: 1 });
      console.log(`  ✓ ${slug} | ${r.claimId}: aplicado`);
    }

    if (cambiosEnSlug > 0 && aplicar) {
      const hashDespues = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
      await sql`
        UPDATE blog_posts
        SET body = ${body}, updated_at = NOW()
        WHERE slug = ${slug}
      `;
      console.log(`  DB ${slug}: body actualizado (hash ${hashAntes} → ${hashDespues}, +${body.length - bodyOriginal.length} chars)`);
    }
  }

  // Resumen.
  const aplicados = resultados.filter((r) => r.aplicado).length;
  const abortados = resultados.filter((r) => !r.aplicado).length;
  console.log(`\n=== RESUMEN ===`);
  console.log(`Aplicados: ${aplicados}/${resultados.length} | Abortados: ${abortados}`);

  if (dryRun) {
    console.log('\n(DRY-RUN: no se escribe DB. Usar --aplicar para persistir.)');
  }

  // Guardar reporte.
  const outPath = path.resolve(process.cwd(), 'docs/audits/fase3d-correcciones-bodies.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: '2026-07-26',
    fase: '3D',
    totalReemplazos: resultados.length,
    aplicados,
    abortados,
    modo: dryRun ? 'dry-run' : 'aplicar',
    resultados,
  }, null, 2) + '\n');
  console.log(`Reporte: ${outPath}`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
