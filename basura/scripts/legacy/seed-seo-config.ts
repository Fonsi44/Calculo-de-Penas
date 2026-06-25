/**
 * script/seed-seo-config.ts
 * Puebla la tabla configuracion_sitio con los valores SEO por defecto.
 *
 * Ejecutar: npx tsx scripts/seed-seo-config.ts
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { configuracionSitio } from '../lib/schema';
import { eq } from 'drizzle-orm';

const SEO_DEFAULTS: Array<{ clave: string; valor: string; descripcion: string }> = [
  { clave: 'seo_title', valor: 'Pineda y Asociados — Bufete jurídico en Nacaome, Valle', descripcion: 'Meta title global por defecto' },
  { clave: 'seo_description', valor: 'Bufete jurídico en Nacaome, Valle, Honduras. Defensa penal técnica y representación legal integral con más de 15 años de ejercicio profesional.', descripcion: 'Meta description global por defecto' },
  { clave: 'seo_keywords', valor: 'abogados Nacaome, bufete jurídico Honduras, defensa penal Honduras, abogado penalista Valle, derecho familia Honduras, abogado laboral Nacaome', descripcion: 'Keywords globales separadas por coma' },
  { clave: 'seo_og_image', valor: 'https://www.pinedayasociadoshn.com/og-image.png', descripcion: 'URL de la imagen OG por defecto' },
  { clave: 'seo_google_verification', valor: '', descripcion: 'Código de verificación de Google Search Console' },
  { clave: 'seo_noindex', valor: 'false', descripcion: 'Activar noindex global (true/false)' },
  { clave: 'seo_sitemap_auto', valor: 'true', descripcion: 'Enviar sitemap a GSC al publicar (true/false)' },
];

async function main() {
  console.log('Poblando configuración SEO...\n');

  for (const item of SEO_DEFAULTS) {
    try {
      const existing = await db
        .select({ id: configuracionSitio.id })
        .from(configuracionSitio)
        .where(eq(configuracionSitio.clave, item.clave))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  [skip] ${item.clave} — ya existe`);
      } else {
        await db.insert(configuracionSitio).values({
          clave: item.clave,
          valor: item.valor,
          descripcion: item.descripcion,
        });
        console.log(`  [ok]   ${item.clave}`);
      }
    } catch (e) {
      console.error(`  [err]  ${item.clave}:`, (e as Error).message?.substring(0, 120));
    }
  }

  console.log('\nHecho.');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
