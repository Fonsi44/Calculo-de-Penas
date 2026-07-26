/**
 * Fase 3C (complemento) — Aplicar corrección del Art. 71 a bodies.
 *
 * El reclasificador marcó defensa-penal-honduras y violencia-domestica como
 * completed/needs_human_review basándose en claims corregidos, pero los
 * bodies públicos aún muestran la afirmación incorrecta "improrrogable 24h".
 * Este script aplica la corrección textual.
 *
 * Uso:
 *   npx tsx scripts/fase3c-art71-bodies.ts --dry-run
 *   npx tsx scripts/fase3c-art71-bodies.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) config({ path: envLocalPath, override: true });
else config();

interface Reemplazo {
  slug: string;
  buscar: string;
  reemplazar: string;
  claimId: string;
}

const REEMPLAZOS: Reemplazo[] = [
  // defensa-penal-honduras: claim Art. 71 "improrrogable 24h" → corregido
  {
    slug: 'defensa-penal-honduras',
    buscar:
      '<strong>Artículo 71 de la Constitución de la República de Honduras</strong> establece un plazo máximo e improrrogable de <strong>24 horas</strong> para que el detenido sea puesto a la orden de un juez competente.',
    reemplazar:
      '<strong>Artículo 71 de la Constitución de la República</strong> (reformado por el Decreto 106-2011, ratificado por el Decreto 88-2012, vigente desde el 15 de junio de 2012) establece que ninguna persona puede ser detenida ni incomunicada por más de <strong>veinticuatro (24) horas</strong> posteriores a su detención, sin ser puesta en libertad o a la orden de autoridad competente. <strong>Excepcionalmente</strong>, este plazo puede extenderse hasta <strong>cuarenta y ocho (48) horas</strong> cuando se trate de delitos de investigación compleja (multiplicidad de hechos, dificultad en la obtención de pruebas, o elevado número de imputados o víctimas), conforme a la reforma desarrollada en el Código Procesal Penal.',
    claimId: 'art71-defensa',
  },
  // violencia-domestica-ruta-legal-honduras: claim plazo "máximo 24h" → corregido
  {
    slug: 'violencia-domestica-ruta-legal-honduras',
    buscar:
      'debe presentarlo ante la autoridad judicial en un plazo máximo de <strong>24 horas</strong>',
    reemplazar:
      'debe presentarlo ante la autoridad judicial dentro de las <strong>veinticuatro (24) horas</strong> siguientes a su detención, plazo que puede extenderse excepcionalmente hasta <strong>cuarenta y ocho (48) horas</strong> en delitos de investigación compleja, conforme al Artículo 71 de la Constitución y los Artículos 176 y 285 del Código Procesal Penal',
    claimId: 'art71-violencia',
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
  console.log(`Fase 3C (complemento) — Corrección Art. 71 en bodies`);
  console.log(`Reemplazos: ${REEMPLAZOS.length} | Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}\n`);

  const porSlug = new Map<string, Reemplazo[]>();
  for (const r of REEMPLAZOS) {
    if (!porSlug.has(r.slug)) porSlug.set(r.slug, []);
    porSlug.get(r.slug)!.push(r);
  }

  for (const [slug, reemplazos] of porSlug) {
    const [post] = (await sql`SELECT body FROM blog_posts WHERE slug = ${slug}`) as Array<{ body: string }>;
    if (!post) {
      console.log(`❌ ${slug}: no encontrado.`);
      continue;
    }
    let body = post.body;
    const shaAntes = crypto.createHash('sha256').update(body, 'utf8').digest('hex').substring(0, 16);
    const cambios: string[] = [];

    for (const r of reemplazos) {
      if (body.includes(r.buscar)) {
        if (body.includes(r.reemplazar)) {
          console.log(`  [YA] ${slug}: ${r.claimId} ya corregido.`);
        } else {
          if (aplicar) body = body.replace(r.buscar, r.reemplazar);
          cambios.push(r.claimId);
          console.log(`  [OK] ${slug} ${dryRun ? '(dry)' : ''}: ${r.claimId}`);
        }
      } else if (body.includes(r.reemplazar)) {
        console.log(`  [YA] ${slug}: ${r.claimId} ya corregido.`);
      } else {
        console.log(`  [NO] ${slug}: ${r.claimId} no encontrado.`);
      }
    }

    if (aplicar && cambios.length > 0) {
      const shaDespues = crypto.createHash('sha256').update(body, 'utf8').digest('hex').substring(0, 16);
      await sql`UPDATE blog_posts SET body = ${body}, updated_at = NOW() WHERE slug = ${slug}`;
      console.log(`  ✅ ${slug}: ${cambios.length} cambios (sha ${shaAntes} → ${shaDespues}).`);
    }
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
