// Script para insertar páginas de dinero y posts satélite locales
// Ejecutar: npx tsx scripts/fase34-insertar-satelites-locales.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { sanitizeHtml } from '../lib/sanitize';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no configurada');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

interface PageData {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  readingTime: string;
  file: string;
}

const moneyPages: PageData[] = [
  {
    slug: 'abogado-penalista-choluteca',
    title: 'Abogado Penalista en Choluteca: Defensa Penal Local con Resultados Reales',
    description: 'Defensa penal en Choluteca con presencia local en los juzgados de la zona sur. Audiencia inicial, medidas cautelares, apelaciones. Atención 24/7 para detenidos.',
    category: 'derecho-penal',
    tags: ['abogado penalista Choluteca', 'defensa penal zona sur', 'abogado penal Honduras', 'Choluteca', 'abogado detenidos'],
    readingTime: '6 min',
    file: 'M4-abogado-penalista-choluteca.html',
  },
  {
    slug: 'abogado-laboral-choluteca',
    title: 'Abogado Laboral en Choluteca: Despidos, Liquidaciones y Reclamos Laborales',
    description: 'Abogado laboral en Choluteca especializado en despidos injustificados, liquidaciones, reclamos salariales y accidentes laborales. Plazo de 2 meses para reclamar.',
    category: 'derecho-laboral',
    tags: ['abogado laboral Choluteca', 'despido injustificado', 'liquidación laboral', 'demanda laboral', 'reclamo prestaciones'],
    readingTime: '6 min',
    file: 'M5-abogado-laboral-choluteca.html',
  },
  {
    slug: 'abogado-familia-choluteca',
    title: 'Abogado de Familia en Choluteca: Divorcio, Pensión y Custodia',
    description: 'Abogado de familia en Choluteca para divorcio, pensión alimenticia, custodia de menores, adopción y violencia doméstica. Atención personalizada en el Juzgado de Familia.',
    category: 'derecho-de-familia',
    tags: ['abogado familia Choluteca', 'divorcio Choluteca', 'pensión alimenticia', 'custodia menores', 'violencia doméstica'],
    readingTime: '6 min',
    file: 'M6-abogado-familia-choluteca.html',
  },
  {
    slug: 'abogado-civil-choluteca',
    title: 'Abogado Civil en Choluteca: Contratos, Herencias y Propiedades',
    description: 'Abogado civil en Choluteca para contratos, compraventa de inmuebles, testamentos, herencias, cobro de deudas y usucapión. Presencia en juzgados civiles de la zona sur.',
    category: 'derecho-civil',
    tags: ['abogado civil Choluteca', 'contratos civiles', 'herencias Choluteca', 'cobro deudas', 'compraventa inmuebles'],
    readingTime: '6 min',
    file: 'M7-abogado-civil-choluteca.html',
  },
  {
    slug: 'abogado-aduanero-san-lorenzo',
    title: 'Abogado Aduanero en San Lorenzo: Importaciones y Comercio Exterior',
    description: 'Abogado aduanero en San Lorenzo especializado en importaciones, exportaciones, clasificación arancelaria, despacho aduanero y defensa ante el SAR. Presencia en el puerto.',
    category: 'derecho-aduanero',
    tags: ['abogado aduanero San Lorenzo', 'importaciones Honduras', 'comercio exterior', 'puerto San Lorenzo', 'despacho aduanero'],
    readingTime: '6 min',
    file: 'M8-abogado-aduanero-san-lorenzo.html',
  },
  {
    slug: 'abogado-empresas-san-lorenzo',
    title: 'Abogado para Empresas en San Lorenzo: Constitución y Asesoría Legal Empresarial',
    description: 'Abogado empresarial en San Lorenzo para constitución de sociedades, contratos mercantiles, cumplimiento laboral y tributario. Asesoría a importadores y comerciantes.',
    category: 'derecho-mercantil',
    tags: ['abogado empresas San Lorenzo', 'constituir empresa', 'contratos mercantiles', 'asesoría empresarial', 'San Lorenzo'],
    readingTime: '6 min',
    file: 'M9-abogado-empresas-san-lorenzo.html',
  },
];

const satellitePosts: PageData[] = [
  {
    slug: 'divorcio-choluteca',
    title: 'Divorcio en Choluteca: Tipos, Costos y Cómo Tramitarlo',
    description: 'Divorcio en Choluteca: mutuo consentimiento, express o contencioso. Costos, plazos reales, documentos necesarios y abogados locales en el Juzgado de Familia.',
    category: 'derecho-de-familia',
    tags: ['divorcio Choluteca', 'divorcio mutuo consentimiento', 'Choluteca', 'abogado divorcio', 'disolución matrimonial'],
    readingTime: '7 min',
    file: 'S1-divorcio-choluteca.html',
  },
  {
    slug: 'pension-alimenticia-choluteca',
    title: 'Pensión Alimenticia en Choluteca: Cómo Fijarla o Reclamarla',
    description: 'Pensión alimenticia en Choluteca: cómo solicitarla, calcular el monto, documentos necesarios y qué hacer si el obligado no paga. Abogados de familia en Choluteca.',
    category: 'derecho-de-familia',
    tags: ['pensión alimenticia Choluteca', 'alimentos hijos', 'obligación alimentaria', 'Choluteca', 'Juzgado de Familia'],
    readingTime: '7 min',
    file: 'S2-pension-alimenticia-choluteca.html',
  },
  {
    slug: 'demanda-laboral-choluteca',
    title: 'Demanda Laboral en Choluteca: Pasos, Plazos y Documentación',
    description: 'Demanda laboral en Choluteca por despido injustificado, impago de prestaciones o acoso laboral. Pasos, plazos de 2 meses y abogados laborales en la zona sur.',
    category: 'derecho-laboral',
    tags: ['demanda laboral Choluteca', 'despido injustificado', 'reclamo prestaciones', 'abogado laboral', 'juzgado laboral Choluteca'],
    readingTime: '7 min',
    file: 'S3-demanda-laboral-choluteca.html',
  },
  {
    slug: 'accidente-transito-choluteca',
    title: 'Accidente de Tránsito en Choluteca: Cómo Reclamar Indemnización',
    description: 'Accidente de tránsito en Choluteca: reclamación de indemnización por lesiones, daños materiales y lucro cesante. Plazos, documentos y abogados civiles en zona sur.',
    category: 'derecho-civil',
    tags: ['accidente tránsito Choluteca', 'indemnización accidente', 'lesiones culposas', 'abogado civil', 'daños y perjuicios'],
    readingTime: '7 min',
    file: 'S4-accidente-transito-choluteca.html',
  },
  {
    slug: 'cobro-deudas-choluteca',
    title: 'Cobro de Deudas en Choluteca: Vía Judicial y Alternativas de Recuperación',
    description: 'Cobro de deudas en Choluteca: juicio ejecutivo, embargo de bienes, requerimiento notarial. Recuperamos su dinero con honorarios de éxito. Abogados en zona sur.',
    category: 'derecho-civil',
    tags: ['cobro deudas Choluteca', 'juicio ejecutivo', 'embargo', 'recuperación de deudas', 'abogado civil'],
    readingTime: '7 min',
    file: 'S5-cobro-deudas-choluteca.html',
  },
  {
    slug: 'defensa-sar-choluteca',
    title: 'Defensa ante Fiscalización del SAR en Choluteca: Proteja su Empresa',
    description: 'Defensa ante fiscalización del SAR en Choluteca: plazos para responder, documentación requerida, derechos del contribuyente y cómo impugnar liquidaciones incorrectas.',
    category: 'tributario',
    tags: ['fiscalización SAR', 'defensa tributaria', 'SAR Choluteca', 'abogado tributario', 'impugnación SAR'],
    readingTime: '7 min',
    file: 'S6-defensa-sar-choluteca.html',
  },
  {
    slug: 'importaciones-san-lorenzo',
    title: 'Importaciones en San Lorenzo, Valle: Guía Completa para Importadores',
    description: 'Importaciones en San Lorenzo: requisitos legales, clasificación arancelaria, DUA, impuestos DAI e ISV, permisos especiales y despacho aduanero en el puerto.',
    category: 'derecho-aduanero',
    tags: ['importaciones San Lorenzo', 'puerto San Lorenzo', 'CAC', 'agente aduanero', 'comercio exterior'],
    readingTime: '7 min',
    file: 'S7-importaciones-san-lorenzo.html',
  },
  {
    slug: 'tramites-legales-nacaome',
    title: 'Trámites Legales en Nacaome, Valle: Guía Completa del Bufete Local',
    description: 'Trámites legales en Nacaome: poderes notariales, contratos, escrituras, RTN, demandas. Bufete local con presencia en los juzgados de Valle. Atención personalizada.',
    category: 'practica-legal',
    tags: ['trámites legales Nacaome', 'Nacaome', 'bufete Valle', 'poder notarial', 'abogados Nacaome'],
    readingTime: '6 min',
    file: 'S8-tramites-legales-nacaome.html',
  },
];

const allPages = [...moneyPages, ...satellitePosts];

async function main() {
  console.log(`\nInsertando ${allPages.length} páginas locales y posts satélite...\n`);
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const page of allPages) {
    try {
      const filePath = path.join('auditoria-blog', page.file);
      if (!fs.existsSync(filePath)) {
        console.error(`  ✗ No encontrado: ${filePath}`);
        errors++;
        continue;
      }

      const htmlContent = fs.readFileSync(filePath, 'utf-8');
      const sanitizedBody = sanitizeHtml(htmlContent);
      const wordCount = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;

      const [existing] = await db.select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, page.slug));

      if (existing) {
        await db.update(blogPosts)
          .set({
            title: page.title,
            description: page.description,
            body: sanitizedBody,
            category: page.category,
            tags: page.tags,
            readingTime: page.readingTime,
            coverImage: `/images/blog/${page.slug}.webp`,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, existing.id));
        console.log(`  ✓ ACTUALIZADO: ${page.slug} (${wordCount} palabras)`);
        updated++;
      } else {
        await db.insert(blogPosts).values({
          slug: page.slug,
          title: page.title,
          description: page.description,
          body: sanitizedBody,
          publishedAt: new Date(),
          category: page.category,
          tags: page.tags,
          author: 'Pineda y Asociados',
          readingTime: page.readingTime,
          coverImage: `/images/blog/${page.slug}.webp`,
          featured: false,
          published: true,
        });
        console.log(`  ✓ INSERTADO: ${page.slug} (${wordCount} palabras)`);
        inserted++;
      }
    } catch (err: any) {
      console.error(`  ✗ Error en ${page.slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n---`);
  console.log(`RESULTADO: ${inserted} insertados, ${updated} actualizados, ${errors} errores`);
  console.log(`Total procesados: ${inserted + updated}/${allPages.length}\n`);
}

main().catch(console.error);
