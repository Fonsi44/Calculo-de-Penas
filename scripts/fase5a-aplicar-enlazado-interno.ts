/**
 * Fase 5A — Aplicar enlazado interno contextual al Lote 3.
 *
 * Añade enlaces internos (<a href="/blog/cat/slug">anchor</a>) en anchors
 * contextuales ya presentes en el body. Conservador: 1 enlace por artículo
 * en la primera ocurrencia del término, sin crear duplicados.
 *
 * Pipeline: dry-run, ocurrencia única del anchor, hash antes/después,
 * idempotencia (no re-enlazar si ya tiene <a>).
 *
 * Uso:
 *   npx tsx scripts/fase5a-aplicar-enlazado-interno.ts            (dry-run)
 *   npx tsx scripts/fase5a-aplicar-enlazado-interno.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

config({ path: ['.env.local', '.env'] });

const APLICAR = process.argv.includes('--aplicar');
const ROOT = process.cwd();

interface Enlace {
  slugOrigen: string;
  anchorBuscar: string; // texto plano a envolver (sin HTML)
  slugDestino: string;
  catDestino: string;
}

// Mapa de categorías (cargado desde selección)
const CATS = JSON.parse(fs.readFileSync(path.join(ROOT, '.secrets/cats-lote3.json'), 'utf8'));

const ENLACES: Enlace[] = [
  { slugOrigen: 'poder-legal-honduras-cuando-se-necesita', anchorBuscar: 'contratos mercantiles', slugDestino: 'contratos-mercantiles-esenciales-empresas-honduras', catDestino: CATS['contratos-mercantiles-esenciales-empresas-honduras'] },
  { slugOrigen: 'banco-demanda-deuda-defensa-opciones-honduras', anchorBuscar: 'reclamar', slugDestino: 'reclamar-deuda-legalmente-honduras', catDestino: CATS['reclamar-deuda-legalmente-honduras'] },
  { slugOrigen: 'reclamar-deuda-legalmente-honduras', anchorBuscar: 'bancaria', slugDestino: 'banco-demanda-deuda-defensa-opciones-honduras', catDestino: CATS['banco-demanda-deuda-defensa-opciones-honduras'] },
  { slugOrigen: 'importar-china-guia-aduanera', anchorBuscar: 'arancel', slugDestino: 'codigo-aduanero-centroamericano', catDestino: CATS['codigo-aduanero-centroamericano'] },
  { slugOrigen: 'importar-mercancias-guia-aduanera', anchorBuscar: 'Código Aduanero', slugDestino: 'codigo-aduanero-centroamericano', catDestino: CATS['codigo-aduanero-centroamericano'] },
  { slugOrigen: 'codigo-aduanero-centroamericano', anchorBuscar: 'importación', slugDestino: 'importar-mercancias-guia-aduanera', catDestino: CATS['importar-mercancias-guia-aduanera'] },
  { slugOrigen: 'patentes-requisitos-proceso-solicitud-honduras', anchorBuscar: 'propiedad', slugDestino: 'contratos-mercantiles-esenciales-empresas-honduras', catDestino: CATS['contratos-mercantiles-esenciales-empresas-honduras'] },
  { slugOrigen: 'adopcion-requisitos-proceso-honduras', anchorBuscar: 'matrimonio', slugDestino: 'union-de-hecho-requisitos-derechos-honduras', catDestino: CATS['union-de-hecho-requisitos-derechos-honduras'] },
  { slugOrigen: 'union-de-hecho-requisitos-derechos-honduras', anchorBuscar: 'familia', slugDestino: 'adopcion-requisitos-proceso-honduras', catDestino: CATS['adopcion-requisitos-proceso-honduras'] },
  { slugOrigen: 'derechos-indigenas-consulta-previa-honduras', anchorBuscar: 'amparo', slugDestino: 'recurso-de-amparo-honduras-guia-completa', catDestino: CATS['recurso-de-amparo-honduras-guia-completa'] },
  { slugOrigen: 'recurso-de-amparo-honduras-guia-completa', anchorBuscar: 'constitucional', slugDestino: 'derechos-indigenas-consulta-previa-honduras', catDestino: CATS['derechos-indigenas-consulta-previa-honduras'] },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL!);

  // Agrupar enlaces por slug origen
  const porSlug = new Map<string, Enlace[]>();
  for (const e of ENLACES) {
    if (!porSlug.has(e.slugOrigen)) porSlug.set(e.slugOrigen, []);
    porSlug.get(e.slugOrigen)!.push(e);
  }

  const resultados: Array<{
    slug: string;
    enlacesAplicados: number;
    hashAntes: string;
    hashDespues: string;
    cambiado: boolean;
    detalle: string[];
  }> = [];

  for (const [slug, enlaces] of porSlug) {
    const rows = (await sql`SELECT body FROM blog_posts WHERE slug = ${slug}`) as Array<
      { body: string }
    >;
    if (rows.length === 0) {
      resultados.push({ slug, enlacesAplicados: 0, hashAntes: '', hashDespues: '', cambiado: false, detalle: ['SLUG NO ENCONTRADO'] });
      continue;
    }
    let body = rows[0].body as string;
    const hashAntes = crypto.createHash('sha256').update(body).digest('hex');
    const detalle: string[] = [];
    let aplicados = 0;

    for (const e of enlaces) {
      const href = `/blog/${e.catDestino}/${e.slugDestino}`;
      // IDEMPOTENCIA ESTRICTA: si el href ya existe en el body, no añadir otro.
      const hrefEsc = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`href=["']${hrefEsc}["']`, 'i').test(body)) {
        detalle.push(`SKIP "${e.anchorBuscar}": href ${href} ya presente (idempotente)`);
        continue;
      }
      // Buscar el anchor como texto plano. Aceptar el primer match que no sea
      // ya parte de un atributo o contenido de un <a> existente. Para evitar
      // falso idempotente, buscar primera ocurrencia del término literal.
      const anchorEsc = e.anchorBuscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const idx = body.search(new RegExp(anchorEsc, 'i'));
      if (idx < 0) {
        detalle.push(`SKIP "${e.anchorBuscar}": no encontrado`);
        continue;
      }
      // Verificar que el match no esté dentro de un <a>...</a> existente.
      const antes = body.slice(0, idx);
      const ultimoA = antes.lastIndexOf('<a ');
      const ultimoCierreA = antes.lastIndexOf('</a>');
      if (ultimoA > ultimoCierreA) {
        detalle.push(`SKIP "${e.anchorBuscar}": dentro de <a> existente`);
        continue;
      }
      const nuevoEnlace = `<a href="${href}">${e.anchorBuscar}</a>`;
      // Reemplazar SOLO la primera ocurrencia
      body = body.replace(new RegExp(anchorEsc, 'i'), nuevoEnlace);
      aplicados++;
      detalle.push(`OK "${e.anchorBuscar}" -> ${href}`);
    }

    const hashDespues = crypto.createHash('sha256').update(body).digest('hex');
    const cambiado = hashAntes !== hashDespues;

    if (APLICAR && cambiado) {
      await sql`UPDATE blog_posts SET body = ${body}, updated_at = NOW() WHERE slug = ${slug}`;
    }

    resultados.push({ slug, enlacesAplicados: aplicados, hashAntes, hashDespues, cambiado, detalle });
  }

  const out = {
    fase: '5A',
    lote: 3,
    generatedAt: new Date().toISOString(),
    modo: APLICAR ? 'APLICAR' : 'DRY-RUN',
    enlacesPlanificados: ENLACES.length,
    enlacesAplicados: resultados.reduce((a, r) => a + r.enlacesAplicados, 0),
    resultados,
  };
  const outPath = path.join(ROOT, 'docs', 'audits', 'fase5a-lote3-aplicacion-enlazado.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(`Modo: ${out.modo}`);
  console.log(`Enlaces planificados: ${out.enlacesPlanificados}`);
  console.log(`Enlaces aplicados: ${out.enlacesAplicados}`);
  for (const r of resultados) {
    console.log(`  ${r.slug}: ${r.enlacesAplicados} enlaces, cambiado=${r.cambiado}`);
    for (const d of r.detalle) console.log(`    ${d}`);
  }
  console.log(`\n  -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
