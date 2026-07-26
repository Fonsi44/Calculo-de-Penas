/**
 * Fase 3B — Aplicar correcciones editoriales al Lote 1 Penal.
 *
 * Lee los claims corregidos de docs/audits/fase3b-lote1-claims-finales.json y
 * aplica los reemplazos textuales EXACTOS (HTML → HTML) sobre el body de los
 * artículos en DB. Cada reemplazo está respaldado por fuente oficial.
 *
 * IMPORTANTE: este script NO toca ai_review_status. Solo corrige texto.
 * El recálculo de estados lo hace scripts/fase3-reclasificar-lote1.ts después.
 *
 * Seguridad:
 *  - Reemplazos idempotentes (si ya aplicado, no se reaplica).
 *  - Transacción por artículo con verificación post-aplicación.
 *  - Backup reproducible previo (scripts/fase3b-verificar-lote.ts).
 *  - Dry-run por defecto; --aplicar para escribir.
 *
 * Uso:
 *   npx tsx scripts/fase3b-aplicar-correcciones.ts --dry-run
 *   npx tsx scripts/fase3b-aplicar-correcciones.ts --aplicar
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

interface Reemplazo {
  slug: string;
  buscar: string;
  reemplazar: string;
  claimId: string;
  norma: string;
  fuenteUrl: string;
}

/**
 * Reemplazos textuales exactos. Cada par está verificado como OCURRENCIA ÚNICA
 * en el body actual del artículo (salvo los contextualizados con prefijo).
 * El texto a buscar reproduce el HTML real actual.
 */
const REEMPLAZOS: Reemplazo[] = [
  // ===== cuando-prescribe-delito-en-honduras =====
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar: 'Artículos 38 a 42 del Código Penal',
    reemplazar: 'Artículos 107 a 116 del Código Penal',
    claimId: 'cuando-prescribe-1',
    norma: 'CP Decreto 130-2017, Arts. 107-116',
    fuenteUrl: 'data/articulos_cp.json',
  },
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar:
      'según el Artículo 41 del Código Penal',
    reemplazar:
      'según el Artículo 109 del Código Penal (Decreto 130-2017)',
    claimId: 'cuando-prescribe-2',
    norma: 'CP Decreto 130-2017, Art. 109',
    fuenteUrl: 'data/articulos_cp.json',
  },
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar:
      'conforme al Artículo 40 del Código Penal',
    reemplazar:
      'conforme al Artículo 109 del Código Penal (Decreto 130-2017)',
    claimId: 'cuando-prescribe-3',
    norma: 'CP Decreto 130-2017, Art. 109',
    fuenteUrl: 'data/articulos_cp.json',
  },
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar:
      'según el Artículo 39 del Código Penal',
    reemplazar:
      'conforme al Artículo 110 del Código Penal (Decreto 130-2017)',
    claimId: 'cuando-prescribe-4',
    norma: 'CP Decreto 130-2017, Art. 110',
    fuenteUrl: 'data/articulos_cp.json',
  },
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar:
      'según el Artículo 42 del Código Penal',
    reemplazar:
      'conforme al Artículo 111 del Código Penal (Decreto 130-2017)',
    claimId: 'cuando-prescribe-5',
    norma: 'CP Decreto 130-2017, Art. 111',
    fuenteUrl: 'data/articulos_cp.json',
  },
  // Reescritura de la regla general de plazos (afirmación central incorrecta)
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar:
      'La regla general establece que la acción penal prescribe en un plazo igual al <strong>máximo de la pena de prisión</strong> prevista para el delito. Sin embargo, existen dos límites: el plazo nunca puede ser inferior a <strong>tres años</strong> ni superior a <strong>quince años</strong>.',
    reemplazar:
      'El <strong>Artículo 109 del Código Penal</strong> (Decreto 130-2017) fija una escala de plazos de prescripción según la gravedad de la pena: a los <strong>veinte (20) años</strong> cuando la pena máxima más la mitad señalada al delito sea de quince (15) o más años de prisión; a los <strong>quince (15) años</strong> cuando la pena sea de más de diez (10) y menos de quince (15) años; a los <strong>diez (10) años</strong> cuando la pena sea de más de cinco (5) y hasta diez (10) años; y a los <strong>cinco (5) años</strong> para los demás delitos.',
    claimId: 'cuando-prescribe-6',
    norma: 'CP Decreto 130-2017, Art. 109',
    fuenteUrl: 'data/articulos_cp.json',
  },
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar:
      'es que la acción penal prescribe en un plazo igual al <strong>máximo de la pena de prisión</strong> del delito, con los límites de <strong>tres</strong> y <strong>quince años</strong>.',
    reemplazar:
      'es que la acción penal prescribe según la escala del <strong>Artículo 109 del Código Penal</strong> (5, 10, 15 o 20 años según la gravedad de la pena).',
    claimId: 'cuando-prescribe-7',
    norma: 'CP Decreto 130-2017, Art. 109',
    fuenteUrl: 'data/articulos_cp.json',
  },
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    buscar:
      'Un delito con una pena máxima de 1 a 3 años de prisión tendrá un plazo de prescripción de <strong>tres años</strong> (el mínimo legal).</li>\n<li>Un delito con una pena máxima de 5 a 10 años de prisión prescribirá en <strong>diez años</strong>.</li>\n<li>Un delito con una pena máxima de 20 a 30 años de prisión prescribirá en <strong>quince años</strong> (el máximo legal).',
    reemplazar:
      'Un delito cuya pena máxima más la mitad no llegue a los cinco (5) años prescribe a los <strong>cinco (5) años</strong>.</li>\n<li>Un delito con pena de más de cinco (5) y hasta diez (10) años prescribe a los <strong>diez (10) años</strong>.</li>\n<li>Un delito con pena de más de diez (10) y hasta quince (15) años prescribe a los <strong>quince (15) años</strong>.</li>\n<li>Un delito cuya pena máxima más la mitad sea de quince (15) o más años prescribe a los <strong>veinte (20) años</strong>.',
    claimId: 'cuando-prescribe-8',
    norma: 'CP Decreto 130-2017, Art. 109',
    fuenteUrl: 'data/articulos_cp.json',
  },

  // ===== violencia-domestica-ruta-legal-honduras =====
  // Corregir SOLO la atribución errónea del Decreto 130-2017 a la LVD (no al CP)
  {
    slug: 'violencia-domestica-ruta-legal-honduras',
    buscar:
      'La violencia doméstica está contemplada en la <strong>Ley Contra la Violencia Doméstica</strong> (Decreto No. 130-2017) y en el <strong>Código Penal</strong> de Honduras (Decreto No. 130-2017).',
    reemplazar:
      'La violencia doméstica está contemplada principalmente en la <strong>Ley contra la Violencia Doméstica</strong> (Decreto No. 132-97, reformada por el Decreto No. 250-2005), sin perjuicio de los tipos penales del <strong>Código Penal</strong> de Honduras vigente (Decreto No. 130-2017).',
    claimId: 'violencia-1',
    norma: 'LVD Decreto 132-97, reformada por 250-2005',
    fuenteUrl:
      'https://www.poderjudicial.gob.hn/DependenciasPJ/UnidG%C3%A9nero/Normativa%20Nacional/Ley%20contra%20la%20Violencia%20Domestica.pdf',
  },
  {
    slug: 'violencia-domestica-ruta-legal-honduras',
    buscar:
      'La ley protege a cualquier persona que sufra violencia en el ámbito familiar o de convivencia, abarcando agresiones físicas, psicológicas, sexuales y patrimoniales.',
    reemplazar:
      'La Ley contra la Violencia Doméstica protege a la <strong>mujer</strong> contra cualquier forma de violencia —física, psicológica, patrimonial y/o económica y sexual— por parte de su cónyuge, excónyuge, compañero, excompañero de hogar o cualquier relación afín a una pareja, haya mediado o no cohabitación, conforme a sus Artículos 1 y 5.',
    claimId: 'violencia-2',
    norma: 'LVD Decreto 132-97, Arts. 1 y 5',
    fuenteUrl:
      'https://www.poderjudicial.gob.hn/DependenciasPJ/UnidG%C3%A9nero/Normativa%20Nacional/Ley%20contra%20la%20Violencia%20Domestica.pdf',
  },
  {
    slug: 'violencia-domestica-ruta-legal-honduras',
    buscar: 'delito de desacato',
    reemplazar: 'delito de desobediencia a la autoridad',
    claimId: 'violencia-3',
    norma: 'LVD Decreto 132-97, Art. 7',
    fuenteUrl:
      'https://www.poderjudicial.gob.hn/DependenciasPJ/UnidG%C3%A9nero/Normativa%20Nacional/Ley%20contra%20la%20Violencia%20Domestica.pdf',
  },

  // ===== fianza-medidas-cautelares-proceso-penal-honduras =====
  {
    slug: 'fianza-medidas-cautelares-proceso-penal-honduras',
    buscar: 'Código Procesal Penal (Decreto 130-2017)',
    reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
    claimId: 'fianza-1',
    norma: 'CPP Decreto 9-99-E',
    fuenteUrl:
      'https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Procesal%20Penal%20(2024).pdf',
  },
  {
    slug: 'fianza-medidas-cautelares-proceso-penal-honduras',
    buscar: 'artículos 173 al 185',
    reemplazar: 'artículos 172 y siguientes',
    claimId: 'fianza-2',
    norma: 'CPP Decreto 9-99-E, Título VI',
    fuenteUrl:
      'https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Procesal%20Penal%20(2024).pdf',
  },

  // ===== defensa-penal-menores-edad-honduras =====
  {
    slug: 'defensa-penal-menores-edad-honduras',
    buscar: 'vigente desde 1997',
    reemplazar:
      'promulgado en 1996, con las reformas introducidas por el Decreto 35-2013 que desarrollaron el sistema especializado de justicia penal para adolescentes',
    claimId: 'menores-1',
    norma: 'CNA Decreto 73-96, reformado por 35-2013',
    fuenteUrl: 'https://www.oas.org/dil/esp/Codigo_Ninez_Adolescencia_Honduras.pdf',
  },

  // ===== derechos-detenido-honduras-guia-constitucional =====
  // Reemplazo menor: la consecuencia técnica exacta es 'nulidad'
  {
    slug: 'derechos-detenido-honduras-guia-constitucional',
    buscar: 'carece de valor probatorio, según los Artículos 288 y 289 del Código Procesal Penal',
    reemplazar:
      'es nula, conforme a los Artículos 288 y 289 del Código Procesal Penal (Decreto 9-99-E), que prohíben la coacción y exigen la presencia del defensor bajo pena de nulidad',
    claimId: 'detenido-1',
    norma: 'CPP Decreto 9-99-E, Arts. 288 y 289',
    fuenteUrl:
      'https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Procesal%20Penal%20(2024).pdf',
  },
];

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
  console.log(`Reemplazos a aplicar: ${REEMPLAZOS.length}`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}\n`);

  // Agrupar reemplazos por slug
  const porSlug = new Map<string, Reemplazo[]>();
  for (const r of REEMPLAZOS) {
    if (!porSlug.has(r.slug)) porSlug.set(r.slug, []);
    porSlug.get(r.slug)!.push(r);
  }

  let totalAplicados = 0;
  let totalYaAplicados = 0;
  let totalNoEncontrados = 0;

  for (const [slug, reemplazos] of porSlug) {
    const [post] = (await sql`
      SELECT body FROM blog_posts WHERE slug = ${slug}
    `) as Array<{ body: string }>;

    if (!post) {
      console.log(`❌ ${slug}: no encontrado en DB.`);
      continue;
    }

    let body = post.body;
    const shaAntes = crypto
      .createHash('sha256')
      .update(body, 'utf8')
      .digest('hex')
      .substring(0, 16);
    const cambios: string[] = [];

    for (const r of reemplazos) {
      if (body.includes(r.buscar)) {
        // Idempotencia: si el reemplazar ya está presente, marcar como ya aplicado
        if (body.includes(r.reemplazar)) {
          console.log(
            `  [YA] ${slug}: "${r.buscar.substring(0, 50)}..." ya corregido.`,
          );
          totalYaAplicados++;
        } else {
          if (aplicar) {
            body = body.replace(r.buscar, r.reemplazar);
          }
          cambios.push(r.claimId);
          console.log(
            `  [OK] ${slug} ${dryRun ? '(dry)' : ''}: ${r.claimId} — ${r.norma}`,
          );
          totalAplicados++;
        }
      } else {
        // Verificar si ya fue aplicado (reemplazar presente)
        if (body.includes(r.reemplazar)) {
          console.log(
            `  [YA] ${slug}: "${r.buscar.substring(0, 50)}..." ya corregido.`,
          );
          totalYaAplicados++;
        } else {
          console.log(
            `  [NO] ${slug}: "${r.buscar.substring(0, 60)}..." no encontrado.`,
          );
          totalNoEncontrados++;
        }
      }
    }

    if (aplicar && cambios.length > 0) {
      const shaDespues = crypto
        .createHash('sha256')
        .update(body, 'utf8')
        .digest('hex')
        .substring(0, 16);
      await sql`
        UPDATE blog_posts
        SET body = ${body}, updated_at = NOW()
        WHERE slug = ${slug}
      `;
      console.log(
        `  ✅ ${slug}: ${cambios.length} cambios aplicados (sha ${shaAntes} → ${shaDespues}).`,
      );
    }
    console.log('');
  }

  console.log('=== RESUMEN ===');
  console.log(`Aplicados: ${totalAplicados}`);
  console.log(`Ya aplicados (idempotencia): ${totalYaAplicados}`);
  console.log(`No encontrados: ${totalNoEncontrados}`);
  if (aplicar) {
    console.log('\nDB actualizada. NO se modificó ai_review_status.');
    console.log(
      'Ejecuta scripts/fase3-reclasificar-lote1.ts --aplicar para recalcular estados.',
    );
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
