import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

// Mapa: slug_viejo → slug_nuevo
const SLUG_MAP: Record<string, string> = {
  'visas-inversion-inversionista-rentista-pensionado-honduras': 'visas-inversion-rentista-pensionado',
  'contratacion-publica-licitaciones-empresas-honduras': 'contratacion-publica-licitaciones',
  'lavado-activos-obligaciones-cumplimiento-empresas-honduras': 'lavado-activos-obligaciones',
  'sobreseimiento-definitivo-provisional-diferencias-honduras': 'sobreseimiento-definitivo-provisional',
  'centro-conciliacion-arbitraje-ccic-guia-honduras': 'centro-conciliacion-arbitraje-ccic',
  'facturacion-electronica-obligaciones-requisitos-sar-honduras': 'facturacion-electronica-requisitos-sar',
  'habilitacion-clinicas-hospitales-privados-honduras': 'habilitacion-clinicas-hospitales',
  'herencias-transfronterizas-bienes-honduras-espana': 'herencias-transfronterizas-bienes',
  'hondurenos-espana-documentos-legales-extranjero': 'hondurenos-espana-documentos',
  'creditos-reestructuracion-deudas-bancarias-honduras': 'creditos-reestructuracion-deudas',
  'refugio-asilo-quien-puede-solicitarlo-honduras': 'refugio-asilo-solicitarlo',
  'mediacion-vs-juicio-que-conviene-mas-honduras': 'mediacion-vs-juicio-cual-elegir',
  'proteccion-marcas-competencia-desleal-honduras': 'proteccion-marcas-competencia-desleal',
  'riesgos-profesionales-accidentes-laborales-honduras': 'riesgos-profesionales-accidentes',
  'naturalizacion-obtener-nacionalidad-hondurena': 'naturalizacion-nacionalidad-hondurena',
  'importar-desde-china-guia-legal-aduanera-honduras': 'importar-china-guia-aduanera',
  'importar-mercancias-guia-legal-aduanera-honduras': 'importar-mercancias-guia-aduanera',
  'contratos-franquicia-aspectos-legales-honduras': 'contratos-franquicia-aspectos',
  'codigo-aduanero-centroamericano-basico-honduras': 'codigo-aduanero-centroamericano',
  'tributar-espana-bienes-honduras-guia-fiscal': 'tributar-espana-bienes-guia',
  'asuntos-familiares-honduras-viviendo-espana': 'asuntos-familiares-honduras-espana',
  'proceso-consulta-legal-pineda-asociados-honduras': 'proceso-consulta-legal-pineda',
};

async function main() {
  const oldSlugs = Object.keys(SLUG_MAP);

  // 1. Verificar que ningún slug nuevo ya existe
  const newSlugs = Object.values(SLUG_MAP);
  const existing = await db.select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(inArray(blogPosts.slug, newSlugs));
  if (existing.length > 0) {
    console.error('❌ Conflictos: los siguientes slugs nuevos ya existen en DB:');
    existing.forEach((r) => console.error(`   ${r.slug}`));
    process.exit(1);
  }

  // 2. Obtener categorías antes de migrar
  const posts = await db.select({ slug: blogPosts.slug, category: blogPosts.category })
    .from(blogPosts)
    .where(inArray(blogPosts.slug, oldSlugs));

  const categoryMap = new Map(posts.map((p) => [p.slug, p.category]));

  // 3. Migrar slugs
  let ok = 0;
  let err = 0;
  for (const [oldSlug, newSlug] of Object.entries(SLUG_MAP)) {
    try {
      const [result] = await db.update(blogPosts)
        .set({ slug: newSlug })
        .where(eq(blogPosts.slug, oldSlug))
        .returning({ slug: blogPosts.slug, category: blogPosts.category });
      if (result) {
        const cat = categoryMap.get(oldSlug) ?? result.category;
        console.log(`  ✅ /blog/${cat}/${oldSlug}`);
        console.log(`     → /blog/${cat}/${newSlug}`);
        ok++;
      } else {
        console.log(`  ❌ ${oldSlug} → no encontrado`);
        err++;
      }
    } catch (e) {
      console.error(`  ❌ ${oldSlug} → error: ${e}`);
      err++;
    }
  }

  console.log(`\nResultado: ${ok} ok, ${err} errores`);
  console.log('\n--- REDIRECTS para next.config.ts ---');
  for (const [oldSlug, newSlug] of Object.entries(SLUG_MAP)) {
    const cat = categoryMap.get(oldSlug);
    if (cat) {
      console.log(`  { source: '/blog/${cat}/${oldSlug}', destination: '/blog/${cat}/${newSlug}', permanent: true },`);
    }
  }
}

main().catch(console.error);
