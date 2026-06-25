import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Map of slug → file with new content
const thinPosts: Record<string, string> = {
  'delitos-ambientales-como-denunciarlos-honduras': 'T1-delitos-ambientales-honduras.html',
  'mediacion-familiar-cuando-funciona-honduras': 'T2-mediacion-familiar-honduras.html',
  'importar-mercancias-guia-legal-aduanera-honduras': 'T3-importar-mercancias-honduras.html',
  'responsabilidad-medica-mala-praxis-honduras': 'T4-responsabilidad-medica-honduras.html',
  'centro-conciliacion-arbitraje-ccic-guia-honduras': 'T5-centro-conciliacion-ccic-honduras.html',
  'codigo-aduanero-centroamericano-basico-honduras': 'T6-codigo-aduanero-honduras.html',
  'zonas-libres-zoli-beneficios-fiscales-honduras': 'T7-zonas-libres-zoli-honduras.html',
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras': 'T8-registro-sanitario-arsa-honduras.html',
  'sanciones-administrativas-como-defenderse-honduras': 'T9-sanciones-administrativas-honduras.html',
  'importar-desde-china-guia-legal-aduanera-honduras': 'T10-importar-desde-china-honduras.html',
  'expropiacion-forzosa-derechos-propietario-honduras': 'T11-expropiacion-forzosa-honduras.html',
  'sar-notifica-fiscalizacion-que-hacer-honduras': 'T12-sar-fiscalizacion-honduras.html',
  'calcular-liquidacion-laboral-honduras': 'T13-calcular-liquidacion-laboral-honduras.html',
};

const metaUpdates: Record<string, { title: string; description: string }> = {
  'delitos-ambientales-como-denunciarlos-honduras': {
    title: 'Delitos Ambientales en Honduras: Cómo Denunciarlos y Proteger el Entorno',
    description: 'Guía práctica para denunciar delitos ambientales: ante quién presentar la denuncia (MP, SERNA, ICF), qué pruebas necesita y cómo protegerse como denunciante en Honduras.',
  },
  'mediacion-familiar-cuando-funciona-honduras': {
    title: 'Mediación Familiar en Honduras: Cuándo es Obligatoria y Cómo Funciona el Proceso',
    description: 'Cuándo es obligatoria la mediación familiar antes del juicio, cómo funciona el proceso, costos y duración. Diferencias con el litigio y cuándo NO procede mediar.',
  },
  'importar-mercancias-guia-legal-aduanera-honduras': {
    title: 'Importar Mercancías a Honduras: Requisitos Legales, Impuestos y Despacho Aduanero',
    description: 'Requisitos aduaneros, DUA, factura comercial, permisos especiales, impuestos (DAI, ISV) y documentos necesarios para importar mercancías a Honduras sin contratiempos.',
  },
  'responsabilidad-medica-mala-praxis-honduras': {
    title: 'Mala Praxis Médica en Honduras: Cómo Reclamar una Negligencia y Obtener Indemnización',
    description: 'Tipos de negligencia médica, plazo de 1 año para reclamar, pruebas clave (peritaje, historia clínica) y vías de reclamación civil y penal en Honduras.',
  },
  'centro-conciliacion-arbitraje-ccic-guia-honduras': {
    title: 'Centro de Conciliación y Arbitraje CCIC en Honduras: Guía Práctica del Proceso',
    description: 'Conciliación y arbitraje en el CCIC: tipos de conflictos, procedimiento, designación de árbitros, costos estimados y ventajas frente al litigio judicial.',
  },
  'codigo-aduanero-centroamericano-basico-honduras': {
    title: 'Código Aduanero Centroamericano (CAC): Lo Que Debe Saber para Importar en Honduras',
    description: 'Estructura del CAC, obligaciones del importador, sanciones por incumplimiento y papel del agente aduanero en las operaciones de comercio exterior en Honduras.',
  },
  'zonas-libres-zoli-beneficios-fiscales-honduras': {
    title: 'Zonas Libres ZOLI en Honduras: Beneficios Fiscales, Requisitos y Proceso de Autorización',
    description: 'Requisitos para instalarse en una ZOLI, beneficios fiscales (ISR, DAI, ISV), proceso de autorización ante la Comisión de Zonas Libres y obligaciones del inversor.',
  },
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras': {
    title: 'Registro Sanitario de Alimentos en Honduras: Guía ARSA Paso a Paso',
    description: 'Qué productos necesitan registro ARSA, requisitos, proceso paso a paso, plazos de 30-60 días, vigencia de 5 años y renovación. Guía para fabricantes e importadores.',
  },
  'sanciones-administrativas-como-defenderse-honduras': {
    title: 'Sanciones Administrativas en Honduras: Cómo Defenderse y Recurrir',
    description: 'Tipos de sanciones (multas, suspensión, clausura), plazos de 10 días para recurrir, recursos de reposición y apelación, y demanda contencioso-administrativa.',
  },
  'importar-desde-china-guia-legal-aduanera-honduras': {
    title: 'Importar desde China a Honduras: Guía Legal para Importadores',
    description: 'Documentación necesaria, aranceles e impuestos, Incoterms recomendados (FOB, CIF), proceso desde la compra hasta el despacho aduanero en Honduras.',
  },
  'expropiacion-forzosa-derechos-propietario-honduras': {
    title: 'Expropiación Forzosa en Honduras: Derechos del Propietario y Cómo Defenderlos',
    description: 'Fases del procedimiento expropiatorio, cómo impugnar la valoración, hoja de aprecio, Jurado de Expropiación, ocupación urgente y reversión del bien.',
  },
  'sar-notifica-fiscalizacion-que-hacer-honduras': {
    title: 'Fiscalización del SAR en Honduras: Qué Hacer, Plazos y Cómo Defenderse',
    description: 'Tipos de fiscalización, plazos para responder, documentación requerida, cómo impugnar una liquidación incorrecta y consejos para superar una revisión del SAR.',
  },
  'calcular-liquidacion-laboral-honduras': {
    title: 'Calcular Liquidación Laboral en Honduras: Guía Práctica con Ejemplos en Lempiras',
    description: 'Indemnización, preaviso, vacaciones y aguinaldo: cómo calcular cada concepto con ejemplos numéricos. Errores frecuentes que pueden costarle dinero al trabajador.',
  },
};

// Slug fusionado
const fusionSlug = 'despido-empleados-publicos-procedencia-defensa-honduras';

async function main() {
  console.log('=== FASE 1: Reescribiendo 14 thin posts ===\n');
  let success = 0;
  let errors = 0;

  // 1. Reescribir los 13 thin posts (14 menos el que se fusiona)
  for (const [slug, fileName] of Object.entries(thinPosts)) {
    try {
      const filePath = path.join('auditoria-blog', fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`  ✗ No encontrado: ${filePath}`);
        errors++;
        continue;
      }
      const body = fs.readFileSync(filePath, 'utf-8');
      const meta = metaUpdates[slug];
      const wordCount = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').length;

      await db.update(blogPosts)
        .set({
          body,
          title: meta.title,
          description: meta.description,
          readingTime: wordCount > 700 ? '6 min' : '5 min',
          coverImage: `/images/blog/${slug}.webp`,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.slug, slug));

      console.log(`  ✓ ${slug} → ${wordCount} palabras`);
      success++;
    } catch (err: any) {
      console.error(`  ✗ Error en ${slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nResultado: ${success} actualizados, ${errors} errores`);

  // 2. Fusionar despido-empleados-publicos-procedencia-defensa
  console.log(`\n=== Fusionando ${fusionSlug} ===`);
  try {
    await db.update(blogPosts)
      .set({
        published: false,
        body: '<p>Este contenido se ha fusionado con la guía completa de despido de empleados públicos. Visite: <a href="/blog/derecho-administrativo/despido-empleados-publicos-honduras">Despido de Empleados Públicos en Honduras</a>.</p>',
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.slug, fusionSlug));
    console.log(`  ✓ ${fusionSlug} → fusionado (despublicado)`);
  } catch (err: any) {
    console.error(`  ✗ Error al fusionar ${fusionSlug}: ${err.message}`);
  }

  console.log('\n=== FASE 1 COMPLETADA ===\n');
}

main().catch(console.error);
