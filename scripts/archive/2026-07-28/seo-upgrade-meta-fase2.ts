import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

/**
 * Fase 2 — Optimización SEO: CTR, intención y canibalización
 *
 * Actualiza metaTitle y metaDescription de los posts seleccionados
 * para mejorar CTR en SERP, diferenciar intenciones y resolver canibalización.
 *
 * Uso: npx tsx scripts/seo-upgrade-meta-fase2.ts
 */

const updates = [
  {
    slug: 'pension-alimenticia-honduras-guia-completa',
    metaTitle: 'Pensión Alimenticia Honduras: Cómo Solicitar y Demandar Pensión',
    metaDescription: 'Guía completa para solicitar pensión alimenticia en Honduras: requisitos, documentos, pasos legales y costo aproximado del proceso judicial.',
  },
  {
    slug: 'prescripcion-deudas-plazos-honduras',
    metaTitle: 'Prescripción de Deudas Honduras: Plazos y ¿A los Cuántos Años Prescriben?',
    metaDescription: '¿En cuánto tiempo prescribe una deuda en Honduras? Plazos para deudas civiles, mercantiles y bancarias. Cómo interrumpir la prescripción y conservar tu derecho de cobro.',
  },
  {
    slug: 'danos-perjuicios-indemnizacion-honduras',
    metaTitle: 'Daños y Perjuicios en Honduras: Demanda e Indemnización',
    metaDescription: '¿Cuándo procede una demanda por daños y perjuicios en Honduras? Daño material y moral, plazos para demandar y cómo se calcula la indemnización.',
  },
  {
    slug: 'poder-legal-honduras-cuando-se-necesita',
    metaTitle: 'Poder Notarial Honduras: Cuándo se Necesita, Tipos y Duración',
    metaDescription: '¿Necesitas un poder notarial en Honduras? Conoce los tipos (general, especial, preventivo), cuánto tiempo dura y cómo se otorga ante notario.',
  },
  {
    slug: 'custodia-hijos-honduras-juez',
    metaTitle: 'Custodia de Hijos en Honduras: Cómo Decide el Juez y Tipos de Custodia',
    metaDescription: '¿Cómo se otorga la custodia de hijos en Honduras? Custodia exclusiva, compartida y criterios que evalúa el juez. Guía para padres.',
  },
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    metaTitle: 'Pensión Alimenticia en Honduras 2026: Porcentajes y Cálculo',
    metaDescription: '¿Cuánto es la pensión alimenticia por hijo en Honduras? Porcentajes del 20% al 40%, criterios de cálculo y pasos para solicitarla.',
  },
  {
    slug: 'divorcio-honduras-guia-completa',
    metaTitle: 'Divorcio en Honduras: Tipos, Costos, Plazos y Requisitos. Guía 2026',
    metaDescription: '¿Qué tipos de divorcio hay en Honduras y cuánto cuesta cada uno? Divorcio voluntario, necesario, causal y notarial. Requisitos y plazos actualizados.',
  },
];

async function main() {
  console.log('Fase 2 — SEO Meta Upgrade\n');
  console.log(`Fecha: ${new Date().toISOString()}\n`);

  for (const update of updates) {
    try {
      const result = await db.update(blogPosts)
        .set({
          metaTitle: update.metaTitle,
          metaDescription: update.metaDescription,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.slug, update.slug))
        .returning({ slug: blogPosts.slug, title: blogPosts.title });

      if (result.length > 0) {
        console.log(`✅ ${update.slug}`);
        console.log(`   Title: ${result[0].title}`);
        console.log(`   Meta: ${update.metaTitle}`);
      } else {
        console.log(`❌ ${update.slug} — no encontrado en DB`);
      }
    } catch (e) {
      console.log(`❌ ${update.slug} — error: ${(e as Error).message?.slice(0, 100)}`);
    }
  }

  console.log('\nPara aplicar a producción: npx tsx scripts/seo-upgrade-meta-fase2.ts');
}

main();
