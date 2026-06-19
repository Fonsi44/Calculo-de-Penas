// Restore thin posts from pre-generated HTML files in auditoria-blog/
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

if (!process.env.DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Map HTML files to slugs
const FILE_MAP: Record<string, string> = {
  'M1-abogados-en-nacaome.html': 'abogados-en-nacaome',
  'M2-abogados-en-choluteca.html': 'abogados-en-choluteca',
  'M3-abogados-en-san-lorenzo.html': 'abogados-en-san-lorenzo',
  'M4-abogado-penalista-choluteca.html': 'abogado-penalista-choluteca',
  'M5-abogado-laboral-choluteca.html': 'abogado-laboral-choluteca',
  'M6-abogado-familia-choluteca.html': 'abogado-familia-choluteca',
  'M7-abogado-civil-choluteca.html': 'abogado-civil-choluteca',
  'M8-abogado-aduanero-san-lorenzo.html': 'abogado-aduanero-san-lorenzo',
  'M9-abogado-empresas-san-lorenzo.html': 'abogado-empresas-san-lorenzo',
  'S1-divorcio-choluteca.html': 'divorcio-choluteca',
  'S2-pension-alimenticia-choluteca.html': 'pension-alimenticia-choluteca',
  'S3-demanda-laboral-choluteca.html': 'demanda-laboral-choluteca',
  'S4-accidente-transito-choluteca.html': 'accidente-transito-choluteca',
  'S5-cobro-deudas-choluteca.html': 'cobro-deudas-choluteca',
  'S6-defensa-sar-choluteca.html': 'defensa-sar-choluteca',
  'S7-importaciones-san-lorenzo.html': 'importaciones-san-lorenzo',
  'S8-tramites-legales-nacaome.html': 'tramites-legales-nacaome',
  'S9-marcovia-abogados.html': 'abogados-en-marcovia-choluteca',
  'S10-san-marcos-colon-abogados.html': 'abogados-en-san-marcos-de-colon-choluteca',
  'S11-pespire-abogados.html': 'abogados-en-pespire-choluteca',
  'S12-amapala-abogados.html': 'abogados-en-amapala-valle',
  // Thin content posts (T1-T12)
  'T1-delitos-ambientales-honduras.html': 'delitos-ambientales-como-denunciarlos-honduras',
  'T2-mediacion-familiar-honduras.html': 'mediacion-familiar-cuando-funciona-honduras',
  'T3-importar-mercancias-honduras.html': 'importar-mercancias-guia-legal-aduanera-honduras',
  'T4-responsabilidad-medica-honduras.html': 'responsabilidad-medica-mala-praxis-honduras',
  'T5-centro-conciliacion-ccic-honduras.html': 'centro-conciliacion-arbitraje-ccic-guia-honduras',
  'T6-codigo-aduanero-honduras.html': 'codigo-aduanero-centroamericano-basico-honduras',
  'T7-zonas-libres-zoli-honduras.html': 'zonas-libres-zoli-beneficios-fiscales-honduras',
  'T8-registro-sanitario-arsa-honduras.html': 'registro-sanitario-alimentos-arsa-paso-a-paso-honduras',
  'T9-sanciones-administrativas-honduras.html': 'sanciones-administrativas-como-defenderse-honduras',
  'T10-importar-desde-china-honduras.html': 'importar-desde-china-guia-legal-aduanera-honduras',
  'T11-expropiacion-forzosa-honduras.html': 'expropiacion-forzosa-derechos-propietario-honduras',
  'T12-sar-fiscalizacion-honduras.html': 'sar-notifica-fiscalizacion-que-hacer-honduras',
  'T13-calcular-liquidacion-laboral-honduras.html': 'calcular-liquidacion-laboral-honduras',
  // Numbered rewrites (01-59)
  '09-derechos-laborales-basicos-honduras.html': 'derechos-laborales-basicos-honduras',
  '20-derechos-detenido-honduras.html': 'derechos-detenido-honduras-guia-constitucional',
  '21-contratos-trabajo-tipos-honduras.html': 'contratos-trabajo-tipos-clausulas-honduras',
  '27-estafas-fraudes-honduras.html': 'estafas-fraudes-tipos-penales-honduras',
  '28-contratos-franquicia-honduras.html': 'contratos-franquicia-aspectos-legales-honduras',
  '29-adopcion-honduras.html': 'adopcion-requisitos-proceso-honduras',
  '30-union-de-hecho-honduras.html': 'union-de-hecho-requisitos-derechos-honduras',
  '31-sobreseimiento-honduras.html': 'sobreseimiento-definitivo-provisional-diferencias-honduras',
  '32-rtn-honduras.html': 'como-obtener-rtn-personas-empresas-honduras',
  '33-nda-contratos-confidencialidad-honduras.html': 'contratos-confidencialidad-nda-secreto-comercial-honduras',
  '34-tributar-espana-bienes-honduras.html': 'tributar-espana-bienes-honduras-guia-fiscal',
  '35-allanamiento-ilegal-honduras.html': 'allanamiento-ilegal-violacion-domicilio-honduras',
  '36-prescripcion-deudas-honduras.html': 'prescripcion-deudas-plazos-honduras',
  '37-arraigo-social-hondurenos-espana.html': 'arraigo-social-laboral-hondurenos-espana',
  '38-como-preparar-demanda-honduras.html': 'como-preparar-demanda-guia-no-abogados-honduras',
  '39-constituir-empresa-honduras.html': 'constituir-empresa-guia-paso-a-paso-honduras',
  '40-costos-honorarios-abogados-honduras.html': 'costos-honorarios-abogados-como-funcionan-honduras',
  '41-competencia-desleal-honduras.html': 'competencia-desleal-como-denunciar-honduras',
  '42-contratacion-publica-honduras.html': 'contratacion-publica-licitaciones-empresas-honduras',
  '43-facturacion-electronica-honduras.html': 'facturacion-electronica-obligaciones-requisitos-sar-honduras',
  '44-habilitacion-clinicas-honduras.html': 'habilitacion-clinicas-hospitales-privados-honduras',
  '45-derecho-de-peticion-honduras.html': 'derecho-de-peticion-instituciones-honduras',
  '46-herencias-transfronterizas-honduras-espana.html': 'herencias-transfronterizas-bienes-honduras-espana',
  '47-lavado-activos-honduras.html': 'lavado-activos-obligaciones-cumplimiento-empresas-honduras',
  '48-fianza-medidas-cautelares-honduras.html': 'fianza-medidas-cautelares-proceso-penal-honduras',
  '49-libertad-expresion-redes-sociales-honduras.html': 'libertad-expresion-redes-sociales-honduras',
  '50-licencia-ambiental-honduras.html': 'licencia-ambiental-categorias-plazos-honduras',
  '51-mediacion-vs-juicio-honduras.html': 'mediacion-vs-juicio-que-conviene-mas-honduras',
  '52-denuncia-conadeh-honduras.html': 'presentar-denuncia-conadeh-honduras',
  '53-registro-medicamentos-honduras.html': 'registro-medicamentos-productos-farmaceuticos-honduras',
  '54-refugio-asilo-honduras.html': 'refugio-asilo-quien-puede-solicitarlo-honduras',
  '55-tarjetas-credito-honduras.html': 'tarjetas-credito-intereses-cargos-defensa-honduras',
  '56-visas-inversion-honduras.html': 'visas-inversion-inversionista-rentista-pensionado-honduras',
  '57-usucapion-honduras.html': 'usucapion-prescripcion-adquisitiva-honduras',
  '58-cheques-sin-fondo-honduras.html': 'titulos-valores-cheques-sin-fondo-honduras',
  '59-guarda-custodia-menores-honduras.html': 'guarda-custodia-menores-tipos-honduras',
};

const AUDITORIA_DIR = resolve(process.cwd(), 'auditoria-blog');

async function main() {
  console.log('=== RESTAURACIÓN DE POSTS DAÑADOS ===\n');
  
  const allPosts = await db.select({ id: blogPosts.id, slug: blogPosts.slug, body: blogPosts.body }).from(blogPosts).where(eq(blogPosts.published, true));
  
  let restored = 0;
  let skipped = 0;
  
  for (const [filename, slug] of Object.entries(FILE_MAP)) {
    const post = allPosts.find(p => p.slug === slug);
    if (!post) {
      console.log(`  ✗ No encontrado en DB: ${slug}`);
      skipped++;
      continue;
    }
    
    const filepath = resolve(AUDITORIA_DIR, filename);
    try {
      const content = readFileSync(filepath, 'utf8');
      const newWords = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
      const oldWords = post.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
      
      if (newWords < 100) {
        console.log(`  ⚠ ${slug}: HTML file too short (${newWords} words), skipping`);
        skipped++;
        continue;
      }
      
      await db.update(blogPosts).set({
        body: content,
        updatedAt: new Date(),
        lastReviewedAt: new Date(),
        readingTime: `${Math.max(3, Math.round(newWords / 150))} min`,
      }).where(eq(blogPosts.slug, slug));
      
      console.log(`  ✓ ${slug}: ${oldWords} → ${newWords} words (${filename})`);
      restored++;
    } catch (e) {
      console.log(`  ✗ Error reading ${filename}: ${(e as Error).message}`);
      skipped++;
    }
  }
  
  console.log(`\n=== RESULTADO: ${restored} restaurados, ${skipped} omitidos ===`);
  
  // Verify: check which posts still have <100 words
  const remaining = await db.select({ id: blogPosts.id, slug: blogPosts.slug, body: blogPosts.body }).from(blogPosts).where(eq(blogPosts.published, true));
  const stillThin = remaining.filter(p => {
    const wc = p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
    return wc < 100 && !['abogados-en-pespire-choluteca','abogados-en-san-marcos-de-colon-choluteca','abogados-en-marcovia-choluteca'].includes(p.slug);
  });
  
  if (stillThin.length > 0) {
    console.log(`\n⚠ AÚN DAÑADOS (${stillThin.length}):`);
    for (const p of stillThin) {
      const wc = p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
      console.log(`  ${p.slug}: ${wc} words`);
    }
  }
}

main().catch(console.error);
