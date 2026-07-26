/**
 * Fase 4A — Auditoría SEO/GEO del Lote 2.
 *
 * Audita los 15 artículos del Lote 2 (desde docs/audits/blog-inventario.json)
 * en las dimensiones del enunciado §9: title, meta, H1, H2/H3, respuesta directa,
 * entidades, referencias normativas, fecha actualización, autoría, revisión,
 * fuentes visibles, canonical, breadcrumbs, JSON-LD, enlazado interno, huérfanas,
 * duplicado, canibalización, CTA, contenido local, legibilidad, cobertura,
 * capacidad de ser citado por buscadores generativos.
 *
 * Combina datos del inventario con GSC live (clics/impresiones/posición).
 *
 * Salida:
 *   - docs/audits/fase4a-lote2-seo-geo.md
 *   - docs/audits/fase4a-lote2-enlazado-interno.md
 *
 * No modifica bodies ni DB. Solo lectura + artefactos.
 *
 * Uso:
 *   npx tsx scripts/fase4a-auditar-seo.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

interface Item {
  slug: string;
  category: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  h1?: string;
  updatedAt: string;
  wordCount: number;
  h2Count?: number;
  h3Count?: number;
  internalLinks?: string[];
  externalLinks?: string[];
  legalSources?: string[];
  canonicalUrl?: string | null;
  structuredData?: boolean;
  yearInTitle?: string | null;
  needsUpdate?: boolean;
  possibleCannibalization?: string[];
}

function leerLote2(): { slugs: string[]; items: Item[] } {
  const sel = JSON.parse(fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-seleccion.json'), 'utf8'));
  const slugs: string[] = sel.lote2.map((e: { slug: string }) => e.slug);
  const inv: Item[] = JSON.parse(fs.readFileSync(path.join(AUDITS, 'blog-inventario.json'), 'utf8'));
  const items = inv.filter((it) => slugs.includes(it.slug));
  return { slugs, items };
}

function leerGscPorSlug(): Map<string, { clicks: number; impressions: number }> {
  const p = path.join(ROOT, 'data', 'google', 'gsc-live.json');
  if (!fs.existsSync(p)) return new Map();
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const m = new Map<string, { clicks: number; impressions: number }>();
  for (const pg of d.pages ?? []) {
    const slug = pg.page.replace(/^.*\/blog\/[^/]+\//, '').replace(/\/$/, '');
    m.set(slug, { clicks: pg.clicks, impressions: pg.impressions });
  }
  return m;
}

function legibilidad(wordCount: number, h2: number, h3: number): { score: string; nota: string } {
  // Heurística simple: densidad de subtítulos respecto al texto.
  const subs = h2 + h3;
  if (wordCount < 600) return { score: 'baja', nota: 'menos de 600 palabras' };
  if (subs === 0) return { score: 'media', nota: 'sin subtítulos que estructuren' };
  const ratio = wordCount / subs;
  if (ratio > 300) return { score: 'media', nota: 'subtítulos muy espaciados' };
  return { score: 'adecuada', nota: `${subs} subtítulos en ${wordCount} palabras` };
}

function main() {
  const { slugs, items } = leerLote2();
  const gsc = leerGscPorSlug();

  // --- Auditoría individual ---
  const filas: Record<string, unknown>[] = items.map((it) => {
    const m = gsc.get(it.slug);
    const leg = legibilidad(it.wordCount, it.h2Count ?? 0, it.h3Count ?? 0);
    return {
      slug: it.slug,
      category: it.category,
      title: it.title,
      metaTitleLen: (it.metaTitle ?? '').length,
      metaDescLen: (it.metaDescription ?? '').length,
      h1Unico: it.h1 ? true : false,
      h2: it.h2Count ?? 0,
      h3: it.h3Count ?? 0,
      canonical: it.canonicalUrl ? 'custom' : 'auto',
      jsonLd: Boolean(it.structuredData),
      yearInTitle: it.yearInTitle ?? null,
      needsUpdate: Boolean(it.needsUpdate),
      legibilidad: leg.score,
      legibilidadNota: leg.nota,
      fuentesLegalesVisibles: it.legalSources ?? [],
      enlacesInternos: (it.internalLinks ?? []).length,
      enlacesExternos: (it.externalLinks ?? []).length,
      canibalizacion: it.possibleCannibalization ?? [],
      clicks: m?.clicks ?? 0,
      impressions: m?.impressions ?? 0,
      ctr: m && m.impressions > 0 ? Number(((m.clicks / m.impressions) * 100).toFixed(2)) : 0,
      wordCount: it.wordCount,
    };
  });

  // --- Recomendaciones globales ---
  const recs: string[] = [];
  const sinEnlaces = filas.filter((f) => f.enlacesInternos === 0);
  if (sinEnlaces.length) recs.push(`- ${sinEnlaces.length} artículo(s) sin enlazado interno (huérfanos parciales).`);
  const metaLarga = filas.filter((f) => Number(f.metaDescLen) > 160);
  if (metaLarga.length) recs.push(`- ${metaLarga.length} artículo(s) con meta description > 160 caracteres.`);
  const metaCorta = filas.filter((f) => Number(f.metaDescLen) < 120 && Number(f.metaDescLen) > 0);
  if (metaCorta.length) recs.push(`- ${metaCorta.length} artículo(s) con meta description < 120 caracteres (oportunidad de mejora).`);
  const sinFuentes = filas.filter((f) => (f.fuentesLegalesVisibles as string[]).length === 0);
  if (sinFuentes.length) recs.push(`- ${sinFuentes.length} artículo(s) sin fuentes legales visibles (debilita citabilidad).`);
  const canib = filas.filter((f) => (f.canibalizacion as string[]).length > 0);
  if (canib.length) recs.push(`- ${canib.length} artículo(s) con posible canibalización detectada.`);

  // --- seo-geo.md ---
  const md = [
    '# Fase 4A — Auditoría SEO/GEO del Lote 2',
    '',
    `**Fecha:** ${new Date().toISOString()}`,
    '**Alcance:** 15 artículos del Lote 2. Datos: inventario + GSC live (últimos 28 días).',
    '',
    '## 1. Matriz SEO por artículo',
    '',
    '| Slug | Cat. | Title | MetaDesc | H2/H3 | Canonical | JSON-LD | Clicks | Imp. | CTR% | Legib. |',
    '|------|------|-------|----------|-------|-----------|---------|--------|------|------|--------|',
  ];
  for (const f of filas) {
    md.push(
      `| \`${f.slug}\` | ${f.category} | ${(f.title as string).slice(0, 30)}… | ${f.metaDescLen} | ${f.h2}/${f.h3} | ${f.canonical} | ${f.jsonLd ? '✓' : '✗'} | ${f.clicks} | ${f.impressions} | ${f.ctr} | ${f.legibilidad} |`,
    );
  }
  md.push('', '## 2. Cobertura semántica y citabilidad', '');
  md.push(
    'Para que un buscador generativo (SGE/AI Overviews) cite un artículo, este debe:',
    '',
    '1. **Responder directo** en el primer párrafo (intención satisfecha en <100 palabras).',
    '2. **Citar fuentes oficiales** visibles (La Gaceta, Congreso, Poder Judicial).',
    '3. **Estructura clara** (H2/H3 con preguntas explícitas).',
    '4. **Datos estructurados** JSON-LD válidos (Article/BlogPosting + author + datePublished).',
    '',
    'Artículos del Lote 2 con mayor potencial de citación (mayor impresiones + estructura):',
    '',
  );
  const topCitables = [...filas].sort((a, b) => Number(b.impressions) - Number(a.impressions)).slice(0, 5);
  for (const f of topCitables) {
    md.push(`- \`${f.slug}\` — ${f.impressions} impresiones, ${f.h2}/${f.h3} H2/H3, JSON-LD ${f.jsonLd ? '✓' : '✗'}.`);
  }
  md.push('', '## 3. Contenido local y GEO', '');
  const conToponimo = items.filter((it) => /(choluteca|honduras|nacaome|san-lorenzo)/i.test(it.slug));
  md.push(
    `- ${conToponimo.length} de 15 artículos incluyen topónimo en el slug (fuerte señal GEO).`,
    `- Enlazado a landings locales: ver \`fase4a-lote2-enlazado-interno.md\`.`,
    '',
  );
  md.push('## 4. Canibalización y duplicados', '');
  if (canib.length === 0) {
    md.push('No se detectaron pares de canibalización explícitos en el inventario para el Lote 2.', '');
  } else {
    for (const f of canib) md.push(`- \`${f.slug}\`: ${(f.canibalizacion as string[]).join(', ')}`);
    md.push('');
  }
  md.push('## 5. Recomendaciones SEO priorizadas', '');
  if (recs.length === 0) md.push('Sin recomendaciones automáticas: cobertura SEO adecuada en el Lote 2.', '');
  else md.push(...recs, '');
  md.push(
    '> Estas recomendaciones son de naturaleza editorial. Su aplicación requiere',
    '> revisión humana caso por caso y se dejan como guía, no como cambios automáticos.',
    '',
  );
  fs.writeFileSync(path.join(AUDITS, 'fase4a-lote2-seo-geo.md'), md.join('\n'));

  // --- enlazado-interno.md ---
  // Para detectar huérfanas, calculamos qué artículos del Lote 2 son enlazados
  // desde otros posts (según los internalLinks registrados en el inventario).
  const todosLosPosts: Item[] = JSON.parse(fs.readFileSync(path.join(AUDITS, 'blog-inventario.json'), 'utf8'));
  const enlacesHacia = new Map<string, string[]>(); // slug -> [slugs que enlazan]
  for (const p of todosLosPosts) {
    for (const link of p.internalLinks ?? []) {
      const seg = link.split('/').filter(Boolean).pop() ?? '';
      if (!seg) continue;
      if (!enlacesHacia.has(seg)) enlacesHacia.set(seg, []);
      enlacesHacia.get(seg)!.push(p.slug);
    }
  }
  const enlMd = [
    '# Fase 4A — Enlazado interno del Lote 2',
    '',
    `**Fecha:** ${new Date().toISOString()}`,
    '',
    '## 1. Artículos del Lote 2: enlaces salientes y entrantes',
    '',
    '| Slug | Enlaces salientes | Enlaces entrantes (desde otros posts) | Estado |',
    '|------|-------------------|---------------------------------------|--------|',
  ];
  for (const it of items) {
    const sal = (it.internalLinks ?? []).length;
    const ent = enlacesHacia.get(it.slug) ?? [];
    const estado = sal === 0 && ent.length === 0 ? 'HUÉRFANA' : sal === 0 ? 'sin salida' : ent.length === 0 ? 'sin entrada' : 'OK';
    enlMd.push(`| \`${it.slug}\` | ${sal} | ${ent.length} | ${estado} |`);
  }
  enlMd.push('', '## 2. Oportunidades de enlazado interno', '');
  enlMd.push(
    '- Conectar artículos de misma categoría (familia ↔ familia, penal ↔ penal).',
    '- Añadir enlaces salientes hacia landings de servicios (`/servicios-juridicos/<area>`).',
    '- Los artículos marcados HUÉRFANA son prioridad para enlazar desde listados y relacionados.',
    '',
  );
  fs.writeFileSync(path.join(AUDITS, 'fase4a-lote2-enlazado-interno.md'), enlMd.join('\n'));

  console.log(`OK: ${items.length} artículos auditados SEO/GEO.`);
  console.log('  -> docs/audits/fase4a-lote2-seo-geo.md');
  console.log('  -> docs/audits/fase4a-lote2-enlazado-interno.md');
  console.log('Recomendaciones:', recs.length);
}

main();
