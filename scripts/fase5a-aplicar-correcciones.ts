/**
 * Fase 5A — Aplicación de correcciones inequívocas al Lote 3.
 *
 * Aplica ÚNICAMENTE correcciones con sustitución jurídica definida y
 * aplicable (regla §7: corrected = sustitución ya definida y aplicable).
 *
 * Pipeline obligatorio (§8):
 *   1. backup (ya hecho en .secrets/fase5a-lote3-backup.json)
 *   2. dry-run (por defecto)
 *   3. ocurrencia única o reemplazo contextual seguro
 *   4. hash antes
 *   5. actualización
 *   6. hash después
 *   7. comprobación directa
 *   8. segunda ejecución idempotente
 *
 * Uso:
 *   npx tsx scripts/fase5a-aplicar-correcciones.ts            (dry-run)
 *   npx tsx scripts/fase5a-aplicar-correcciones.ts --aplicar  (escribe en Neon)
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

config({ path: ['.env.local', '.env'] });

const APLICAR = process.argv.includes('--aplicar');
const ROOT = process.cwd();

interface Correccion {
  slug: string;
  buscar: string; // texto exacto (con HTML si aplica)
  reemplazar: string;
  motivo: string;
  fuente: string;
}

const CORRECCIONES: Correccion[] = [
  {
    slug: 'poder-legal-honduras-cuando-se-necesita',
    buscar:
      'específicamente en los artículos <strong>1732 al 1750</strong>, que versan sobre el mandato. El Artículo 1732 define el mandato como el contrato por el cual una persona encarga a otra la gestión de uno o más negocios.',
    reemplazar:
      'específicamente en los artículos <strong>1888 al 1912</strong>, que versan sobre el mandato. El Artículo 1888 define el mandato como el contrato por el cual una persona se obliga a prestar algún servicio o hacer alguna cosa, por cuenta o encargo de otra.',
    motivo:
      'Art. 1732-1750 CC tratan de arrendamiento, NO de mandato. El mandato está en Art. 1888-1912 CC (Art. 1888 = "Por el contrato de mandato se obliga una..."; Art. 1911 = "El mandato se acaba...").',
    fuente: 'data/codigo_civil.json (Art. 1888 CC, Art. 1911 CC)',
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL!);

  const resultados: Array<{
    slug: string;
    aplicar: boolean;
    ocurrencias: number;
    hashAntes: string;
    hashDespues: string;
    cambiado: boolean;
    motivo: string;
  }> = [];

  for (const corr of CORRECCIONES) {
    const rows = (await sql`SELECT body FROM blog_posts WHERE slug = ${corr.slug}`) as Array<
      { body: string }
    >;
    if (rows.length === 0) {
      resultados.push({
        slug: corr.slug,
        aplicar: false,
        ocurrencias: 0,
        hashAntes: '',
        hashDespues: '',
        cambiado: false,
        motivo: 'SLUG NO ENCONTRADO',
      });
      continue;
    }
    const bodyAntes = rows[0].body as string;
    const hashAntes = crypto.createHash('sha256').update(bodyAntes).digest('hex');
    const ocurrencias = bodyAntes.split(corr.buscar).length - 1;

    if (ocurrencias === 0) {
      // Idempotencia: si ya fue aplicado, no cambia nada.
      resultados.push({
        slug: corr.slug,
        aplicar: false,
        ocurrencias: 0,
        hashAntes,
        hashDespues: hashAntes,
        cambiado: false,
        motivo: 'IDEMPOTENTE: el texto a corregir ya no está presente (corrección ya aplicada)',
      });
      continue;
    }
    if (ocurrencias > 1) {
      resultados.push({
        slug: corr.slug,
        aplicar: false,
        ocurrencias,
        hashAntes,
        hashDespues: hashAntes,
        cambiado: false,
        motivo: `ABORTA: ${ocurrencias} ocurrencias (no es única). Requiere revisión contextual.`,
      });
      continue;
    }

    const bodyDespues = bodyAntes.replace(corr.buscar, corr.reemplazar);
    const hashDespues = crypto.createHash('sha256').update(bodyDespues).digest('hex');
    const cambiado = bodyAntes !== bodyDespues;

    if (APLICAR && cambiado) {
      await sql`UPDATE blog_posts SET body = ${bodyDespues}, updated_at = NOW() WHERE slug = ${corr.slug}`;
    }

    resultados.push({
      slug: corr.slug,
      aplicar: APLICAR,
      ocurrencias,
      hashAntes,
      hashDespues,
      cambiado,
      motivo: corr.motivo,
    });
  }

  const out = {
    fase: '5A',
    lote: 3,
    generatedAt: new Date().toISOString(),
    modo: APLICAR ? 'APLICAR' : 'DRY-RUN',
    correccionesPlaneadas: CORRECCIONES.length,
    correccionesAplicadas: resultados.filter((r) => r.cambiado && APLICAR).length,
    resultados,
  };
  const outPath = path.join(ROOT, 'docs', 'audits', 'fase5a-lote3-aplicacion-correcciones.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(`Modo: ${out.modo}`);
  for (const r of resultados) {
    console.log(
      `  ${r.slug}: ocurrencias=${r.ocurrencias} cambiado=${r.cambiado} aplicar=${r.aplicar}`,
    );
    if (r.cambiado) {
      console.log(`    hash antes:  ${r.hashAntes.slice(0, 16)}...`);
      console.log(`    hash después:${r.hashDespues.slice(0, 16)}...`);
    }
    console.log(`    motivo: ${r.motivo.slice(0, 100)}`);
  }
  console.log(`\nOK: ${out.correccionesAplicadas} corrección(es) aplicada(s).`);
  console.log(`  -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
