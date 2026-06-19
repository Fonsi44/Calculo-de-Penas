/**
 * Analiza y resuelve canibalización entre posts con misma intención
 * Acciones: NOINDEX el más delgado, agrega canonical al principal
 */
import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, or, sql } from 'drizzle-orm';

interface PairAction {
  keep: string;
  noindex?: string;
  merge?: string;
  reason: string;
}

const actions: PairAction[] = [];

// Pairs with same search intent
const DUPLICATE_PAIRS: [string, string][] = [
  // clear duplicates (same topic, one more complete)
  ['como-elegir-buen-abogado-guia-practica-honduras', 'como-elegir-abogado-honduras'],
  ['despido-laboral-honduras-guia-completa', 'despido-laboral-honduras-derechos'],
  ['divorcio-honduras-guia-completa', 'divorcio-tipos-requisitos-tiempos-honduras'],
  ['impuesto-renta-personas-fisicas-honduras', 'impuesto-renta-guia-personas-fisicas-honduras'],
  ['registrar-marca-honduras-paso-a-paso', 'registrar-marca-paso-a-paso-honduras'],
  ['poder-notarial-honduras-tipos-requisitos', 'poder-legal-honduras-cuando-se-necesita'],
  ['custodia-hijos-honduras-juez', 'guarda-custodia-menores-tipos-honduras'],
];

async function main() {
  const applyFix = process.argv.includes('--apply');

  for (const [slugA, slugB] of DUPLICATE_PAIRS) {
    const [postA] = await db.select({
      slug: blogPosts.slug, title: blogPosts.title,
      bodyLen: sql<number>`length(${blogPosts.body})`.mapWith(Number),
      published: blogPosts.published,
    }).from(blogPosts).where(eq(blogPosts.slug, slugA));

    const [postB] = await db.select({
      slug: blogPosts.slug, title: blogPosts.title,
      bodyLen: sql<number>`length(${blogPosts.body})`.mapWith(Number),
      published: blogPosts.published,
    }).from(blogPosts).where(eq(blogPosts.slug, slugB));

    if (!postA || !postB) {
      console.log(`⚠ Saltado (no encontrados): ${slugA} / ${slugB}`);
      continue;
    }

    const lenA = Number(postA.bodyLen);
    const lenB = Number(postB.bodyLen);
    const diff = Math.abs(lenA - lenB);

    console.log(`\n${slugA.substring(0, 50)} (${lenA}c)`);
    console.log(`${slugB.substring(0, 50)} (${lenB}c)`);
    console.log(`  Diferencia: ${diff}c`);

    if (diff < 500) {
      // Very similar - noindex the shorter one, keep the longer as canonical
      const [keep, noindex] = lenA >= lenB ? [slugA, slugB] : [slugB, slugA];
      console.log(`  → Ambos son similares. NOINDEX: ${noindex}, KEEP: ${keep}`);

      if (applyFix) {
        await db.update(blogPosts)
          .set({ noindex: true } as any)
          .where(eq(blogPosts.slug, noindex));
      }
      actions.push({ keep, noindex, reason: 'Contenido muy similar (<500c diff). Noindex del más corto.' });
    } else {
      // One is clearly more complete
      const [keep, noindex] = lenA > lenB ? [slugA, slugB] : [slugB, slugA];
      console.log(`  → ${keep} es más completo. NOINDEX: ${noindex}`);

      if (applyFix) {
        await db.update(blogPosts)
          .set({ noindex: true } as any)
          .where(eq(blogPosts.slug, noindex));
      }
      actions.push({ keep, noindex, reason: `${keep} es ${diff}c más completo. Noindex del más delgado.` });
    }
  }

  if (applyFix) {
    console.log(`\n✓ Aplicados ${actions.length} noindex en DB.`);
  } else {
    console.log(`\n⚠ Dry-run. ${actions.length} acciones pendientes. Usa --apply.`);
  }

  await db.$client?.end?.();
}

main().catch(console.error);
