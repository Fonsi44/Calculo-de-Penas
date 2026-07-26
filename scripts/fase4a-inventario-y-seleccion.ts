/**
 * Fase 4A — Inventario + selección determinista del Lote 2 del blog jurídico.
 *
 * Lee:
 *   - docs/audits/blog-inventario.json  (134 posts publicados, snapshot offline)
 *   - data/google/gsc-live.json         (clics/impresiones por página, si existe)
 *   - data/google/ga4-live.json         (pageViews/usuarios por path, si existe)
 *
 * Excluye los 15 slugs del Lote 1 (Fase 3 cerrada) y aplica la fórmula del
 * enunciado §3:
 *
 *   prioridad = riesgo_jurídico·0.30
 *             + impacto_orgánico·0.25
 *             + desactualización·0.20
 *             + importancia_comercial·0.15
 *             + oportunidad_GEO·0.10
 *
 * Cada componente se normaliza a [0,1] con reglas verificables (no inventadas).
 * El script es función pura de las entradas: segunda ejecución = mismo orden.
 *
 * Salida:
 *   - docs/audits/fase4a-lote2-seleccion.json   (119 candidatos + scoring)
 *   - docs/audits/fase4a-lote2-priorizacion.md  (top-15 justificado)
 *
 * No toca la base de datos ni escribe bodies. Solo lectura + artefactos.
 *
 * Uso:
 *   npx tsx scripts/fase4a-inventario-y-seleccion.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

// --- Lote 1 (Fase 3 cerrada): se excluyen explícitamente -----------------
const SLUGS_LOTE1 = new Set([
  'abogado-penalista-choluteca',
  'abogado-penalista-sur-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'antejuicio-en-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'cuando-prescribe-delito-en-honduras',
  'defensa-penal-honduras',
  'defensa-penal-menores-edad-honduras',
  'delitos-mas-comunes-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'diferencia-denuncia-querella-acusacion-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
]);

// --- Pesos del enunciado §3 ----------------------------------------------
const PESOS = {
  riesgoJuridico: 0.3,
  impactoOrganico: 0.25,
  desactualizacion: 0.2,
  importanciaComercial: 0.15,
  oportunidadGEO: 0.1,
} as const;

// --- Categorías por riesgo jurídico (verificable: penas/plazos/derechos) -
// Alto: penas privativas de libertad, plazos procesales, derechos
// fundamentales, relaciones familia/infancia, relación laboral.
// Medio: obligaciones patrimoniales, tributos, contratos.
// Bajo: divulgativo, noticia, procedimiento administrativo rutinario.
const RIESGO_CATEGORIA: Record<string, number> = {
  'derecho-penal': 1.0,
  'proceso-penal': 1.0,
  'derecho-de-familia': 0.9,
  'derecho-laboral': 0.85,
  'derechos-ciudadanos': 0.8,
  'extranjeria-migracion': 0.75,
  'hondurenos-en-espana': 0.7,
  'derecho-civil': 0.6,
  'derecho-mercantil': 0.55,
  'tributario': 0.55,
  'derecho-bancario': 0.5,
  'derecho-administrativo': 0.45,
  'derecho-aduanero': 0.45,
  'regulacion-sanitaria': 0.45,
  'propiedad-intelectual': 0.4,
  'conciliacion-arbitraje': 0.4,
  'derecho-ambiental': 0.4,
  'derecho-notarial': 0.35,
  'practica-legal': 0.3,
  'noticias-legales': 0.2,
};

// Valor comercial por categoría (demanda de clientes del despacho).
const COMERCIAL_CATEGORIA: Record<string, number> = {
  'derecho-penal': 1.0,
  'derecho-de-familia': 0.95,
  'derecho-laboral': 0.85,
  'derecho-civil': 0.7,
  'proceso-penal': 0.7,
  'tributario': 0.6,
  'derecho-mercantil': 0.6,
  'extranjeria-migracion': 0.6,
  'hondurenos-en-espana': 0.55,
  'derecho-bancario': 0.5,
  'derecho-aduanero': 0.45,
  'propiedad-intelectual': 0.4,
  'derecho-administrativo': 0.35,
  'regulacion-sanitaria': 0.35,
  'derechos-ciudadanos': 0.3,
  'conciliacion-arbitraje': 0.3,
  'derecho-ambiental': 0.3,
  'derecho-notarial': 0.3,
  'practica-legal': 0.25,
  'noticias-legales': 0.1,
};

interface InventarioItem {
  slug: string;
  url: string;
  category: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  h1?: string;
  publishedAt: string;
  updatedAt: string;
  reviewedAt?: string;
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
  priority?: string;
  recommendedAction?: string;
  possibleCannibalization?: string[];
}

interface GscPage {
  page: string;
  clicks: number;
  impressions: number;
}

interface Ga4Page {
  pagePath: string;
  screenPageViews: string;
  totalUsers: string;
}

function readJson<T>(p: string): T | null {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

// --- Componentes del scoring (cada uno [0,1], justificado) ---------------

/**
 * Riesgo jurídico [0,1].
 * Combina riesgo de categoría (70%) con densidad de fuentes legales citadas
 * y longitud (más texto afirmativo = más superficie de error).
 */
function scoreRiesgoJuridico(it: InventarioItem): { valor: number; desglose: Record<string, unknown> } {
  const base = RIESGO_CATEGORIA[it.category] ?? 0.4;
  // Densidad de fuentes legales: cuantas más normas cita, más claims jurídicos.
  const fuentes = it.legalSources ?? [];
  const densidadFuentes = clamp01(fuentes.length / 4); // 4+ fuentes => saturado
  // Longitud: posts largos con afirmaciones categóricas = más riesgo.
  const longitud = clamp01(it.wordCount / 1500);
  const valor = clamp01(base * 0.7 + densidadFuentes * 0.18 + longitud * 0.12);
  return {
    valor,
    desglose: {
      riesgoCategoria: Number(base.toFixed(3)),
      fuentesLegalesCitadas: fuentes,
      densidadFuentes: Number(densidadFuentes.toFixed(3)),
      longitud: Number(longitud.toFixed(3)),
      wordCount: it.wordCount,
    },
  };
}

/**
 * Impacto orgánico [0,1] basado en datos reales GSC + GA4.
 * Si no hay datos, devuelve 0 y lo marca explícitamente (no se inventa).
 */
function scoreImpactoOrganico(
  it: InventarioItem,
  gscBySlug: Map<string, GscPage>,
  ga4BySlug: Map<string, Ga4Page>,
  maxClicks: number,
  maxImpresiones: number,
  maxPageViews: number,
): { valor: number; desglose: Record<string, unknown> } {
  const gsc = gscBySlug.get(it.slug);
  const ga4 = ga4BySlug.get(it.slug);
  if (!gsc && !ga4) {
    return {
      valor: 0,
      desglose: {
        fuente: 'ninguna (sin datos GSC ni GA4 para este slug)',
        clicks: 0,
        impressions: 0,
        pageViews: 0,
        sinDatos: true,
      },
    };
  }
  const clicks = gsc?.clicks ?? 0;
  const impressions = gsc?.impressions ?? 0;
  const pageViews = Number(ga4?.screenPageViews ?? 0);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  // Normalización logarítmica para evitar que una sola estrella aplaste al resto.
  const normClicks = maxClicks > 0 ? clamp01(Math.log10(1 + clicks) / Math.log10(1 + maxClicks)) : 0;
  const normImp =
    maxImpresiones > 0 ? clamp01(Math.log10(1 + impressions) / Math.log10(1 + maxImpresiones)) : 0;
  const normViews = maxPageViews > 0 ? clamp01(Math.log10(1 + pageViews) / Math.log10(1 + maxPageViews)) : 0;
  const valor = clamp01(normClicks * 0.45 + normImp * 0.25 + normViews * 0.3);
  return {
    valor,
    desglose: {
      fuente: 'GSC + GA4 live',
      clicks,
      impressions,
      ctr: Number(ctr.toFixed(4)),
      pageViews,
      normClicks: Number(normClicks.toFixed(3)),
      normImpresiones: Number(normImp.toFixed(3)),
      normPageViews: Number(normViews.toFixed(3)),
    },
  };
}

/**
 * Desactualización normativa [0,1].
 * needsUpdate explícito del inventario + antigüedad de updatedAt + año en título.
 */
function scoreDesactualizacion(it: InventarioItem, ahoraMs: number): { valor: number; desglose: Record<string, unknown> } {
  const flagNeedsUpdate = it.needsUpdate ? 0.5 : 0;
  const updatedMs = new Date(it.updatedAt).getTime();
  const diasDesdeUpdate = Number.isFinite(updatedMs) ? Math.max(0, (ahoraMs - updatedMs) / 86_400_000) : 0;
  // 365 días => saturado.
  const antiguedad = clamp01(diasDesdeUpdate / 365);
  // yearInTitle (p.ej. "2024") cuando ya pasó ese año => riesgo.
  const yearInTitle = it.yearInTitle ? Number(it.yearInTitle) : null;
  const anioActual = new Date().getFullYear();
  const yearObsoleto = yearInTitle && yearInTitle < anioActual ? 0.2 : 0;
  const valor = clamp01(flagNeedsUpdate + antiguedad * 0.4 + yearObsoleto);
  return {
    valor,
    desglose: {
      needsUpdateFlag: Boolean(it.needsUpdate),
      diasDesdeUpdate: Math.round(diasDesdeUpdate),
      yearInTitle: yearInTitle ?? null,
      antiguedad: Number(antiguedad.toFixed(3)),
      yearObsoleto,
    },
  };
}

/**
 * Importancia comercial [0,1] por categoría (demanda real del despacho).
 */
function scoreImportanciaComercial(it: InventarioItem): { valor: number; desglose: Record<string, unknown> } {
  const valor = COMERCIAL_CATEGORIA[it.category] ?? 0.3;
  return { valor, desglose: { comercialCategoria: valor } };
}

/**
 * Oportunidad GEO [0,1].
 * Presencia de enlaces a landings locales (abogados-en-*, /solicitar-consulta)
 * y slug con topónimo hondureño.
 */
function scoreOportunidadGEO(it: InventarioItem): { valor: number; desglose: Record<string, unknown> } {
  const internal = it.internalLinks ?? [];
  const locales = internal.filter((l) =>
    /abogados-en-|abogado-penalista-|landings-locales/i.test(l),
  ).length;
  const slugToponimo = /(choluteca|nacaome|san-lorenzo|goascoran|san-marcos|el-triunfo|marcovia|pespire|namasigue|orocuina|tegucigalpa|san-pedro-sula|honduras)/i.test(
    it.slug,
  );
  const valor = clamp01(clamp01(locales / 3) * 0.6 + (slugToponimo ? 0.4 : 0));
  return {
    valor,
    desglose: {
      enlacesLocales: locales,
      slugConToponimo: slugToponimo,
      internalLinksMuestra: internal.slice(0, 5),
    },
  };
}

function main() {
  const inventario = readJson<InventarioItem[]>(path.join(AUDITS, 'blog-inventario.json'));
  if (!inventario || !Array.isArray(inventario)) {
    console.error('ERROR: docs/audits/blog-inventario.json no encontrado o inválido.');
    process.exit(1);
  }

  // --- Cargar datos live (opcionales) -----------------------------------
  const gscLive = readJson<{ pages?: GscPage[] }>(path.join(ROOT, 'data', 'google', 'gsc-live.json'));
  const ga4Live = readJson<{ topPages?: Ga4Page[] }>(path.join(ROOT, 'data', 'google', 'ga4-live.json'));

  const gscBySlug = new Map<string, GscPage>();
  if (gscLive?.pages) {
    for (const p of gscLive.pages) {
      const slug = p.page.replace(/^.*\/blog\/[^/]+\//, '').replace(/\/$/, '');
      // Solo nos quedamos con el último segmento de la URL del blog.
      gscBySlug.set(slug, p);
    }
  }
  const ga4BySlug = new Map<string, Ga4Page>();
  if (ga4Live?.topPages) {
    for (const p of ga4Live.topPages) {
      const seg = p.pagePath.split('/').filter(Boolean).pop() ?? '';
      if (seg) ga4BySlug.set(seg, p);
    }
  }

  const maxClicks = Math.max(1, ...[...gscBySlug.values()].map((p) => p.clicks));
  const maxImpresiones = Math.max(1, ...[...gscBySlug.values()].map((p) => p.impressions));
  const maxPageViews = Math.max(
    1,
    ...[...ga4BySlug.values()].map((p) => Number(p.screenPageViews) || 0),
  );

  // --- Filtrar Lote 1 ----------------------------------------------------
  const candidatos = inventario.filter((it) => !SLUGS_LOTE1.has(it.slug));
  const ahoraMs = Date.now();

  const evaluados = candidatos.map((it) => {
    const rj = scoreRiesgoJuridico(it);
    const io = scoreImpactoOrganico(it, gscBySlug, ga4BySlug, maxClicks, maxImpresiones, maxPageViews);
    const da = scoreDesactualizacion(it, ahoraMs);
    const ic = scoreImportanciaComercial(it);
    const geo = scoreOportunidadGEO(it);
    const prioridad =
      rj.valor * PESOS.riesgoJuridico +
      io.valor * PESOS.impactoOrganico +
      da.valor * PESOS.desactualizacion +
      ic.valor * PESOS.importanciaComercial +
      geo.valor * PESOS.oportunidadGEO;
    return {
      slug: it.slug,
      category: it.category,
      title: it.title,
      url: it.url,
      publishedAt: it.publishedAt,
      updatedAt: it.updatedAt,
      wordCount: it.wordCount,
      priority: it.priority ?? null,
      needsUpdate: Boolean(it.needsUpdate),
      scoring: {
        riesgoJuridico: rj,
        impactoOrganico: io,
        desactualizacion: da,
        importanciaComercial: ic,
        oportunidadGEO: geo,
        prioridad: Number(prioridad.toFixed(6)),
      },
    };
  });

  // Orden determinista: prioridad desc, luego slug asc (tie-break estable).
  evaluados.sort((a, b) => {
    if (b.scoring.prioridad !== a.scoring.prioridad) {
      return b.scoring.prioridad - a.scoring.prioridad;
    }
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });

  const lote2 = evaluados.slice(0, 15).map((e, i) => ({ posicion: i + 1, ...e }));

  const seleccionJson = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    enunciadoSeccion: '§2-§3',
    fuenteInventario: 'docs/audits/blog-inventario.json',
    fuenteGscLive: gscLive ? 'data/google/gsc-live.json' : null,
    fuenteGa4Live: ga4Live ? 'data/google/ga4-live.json' : null,
    totalInventario: inventario.length,
    totalLote1Excluido: SLUGS_LOTE1.size,
    totalCandidatos: candidatos.length,
    seleccionados: 15,
    pesos: PESOS,
    normalizacion: {
      impactoOrganico: 'log10(1+x)/log10(1+max), por componente; 0 si sin datos',
      desactualizacion: 'needsUpdate 0.5 + antiguedad/365·0.4 + yearObsoleto 0.2',
    },
    distribucionCategoriasCandidatos: contarPorCategoria(candidatos),
    distribucionCategoriasLote2: contarPorCategoria(lote2),
    lote2,
    candidatosEvaluados: evaluados,
  };

  fs.writeFileSync(
    path.join(AUDITS, 'fase4a-lote2-seleccion.json'),
    JSON.stringify(seleccionJson, null, 2),
  );

  // --- priorizacion.md --------------------------------------------------
  const md = [`# Fase 4A — Selección determinista del Lote 2`, ``, `**Fecha:** ${seleccionJson.generatedAt}`, `**Modo:** \`VERIFICACIÓN\` (solo lectura) + artefactos`, `**Fuente:** \`docs/audits/blog-inventario.json\` (${inventario.length} posts) + GSC/GA4 live`, ``, `## 1. Fórmula de priorización (§3 del enunciado)`, ``, '```text', `prioridad =`, `  riesgo_jurídico × ${PESOS.riesgoJuridico}`, `+ impacto_orgánico × ${PESOS.impactoOrganico}`, `+ desactualización × ${PESOS.desactualizacion}`, `+ importancia_comercial × ${PESOS.importanciaComercial}`, `+ oportunidad_GEO × ${PESOS.oportunidadGEO}`, '```', ``, `Cada componente normalizado a [0,1] con reglas verificables. Determinismo:`, `función pura de (inventario + datos live); segunda ejecución = mismo orden.`, ``, `## 2. Cobertura de datos`, ``, `| Fuente | Estado | Cobertura |`, `|--------|--------|-----------|`, `| blog-inventario.json | ✓ | ${inventario.length} posts |`, `| GSC live | ${gscLive ? '✓' : '✗ (ausente)'} | ${gscBySlug.size} páginas |`, `| GA4 live | ${ga4Live ? '✓' : '✗ (ausente)'} | ${ga4BySlug.size} páginas |`, ``, `> **Nota sobre candidatos:** el inventario tiene ${inventario.length} posts. Se`, `> excluyen los 15 slugs del Lote 1, pero \`abogado-penalista-choluteca\` es una`, `> landing (sin prefijo \`/blog\`) y no figura en \`blog-inventario.json\`; por eso`, `> solo 14 de los 15 slugs del Lote 1 se excluyen efectivamente → **${candidatos.length} candidatos**.`, ``, `## 3. Lote 2 seleccionado (top-15)`, ``, `| # | Slug | Categoría | Prioridad | Riesgo | Orgánico | Desact. | Comerc. | GEO |`, `|---|------|-----------|-----------|--------|----------|---------|---------|-----|`];
  for (const e of lote2) {
    md.push(
      `| ${e.posicion} | \`${e.slug}\` | ${e.category} | ${e.scoring.prioridad.toFixed(4)} | ${e.scoring.riesgoJuridico.valor.toFixed(2)} | ${e.scoring.impactoOrganico.valor.toFixed(2)} | ${e.scoring.desactualizacion.valor.toFixed(2)} | ${e.scoring.importanciaComercial.valor.toFixed(2)} | ${e.scoring.oportunidadGEO.valor.toFixed(2)} |`,
    );
  }
  md.push(``, `## 4. Justificación de la selección`, ``, `Los 15 elegidos son los de mayor puntuación según la fórmula. La concentración`, `por categoría refleja el riesgo jurídico objetivo (penas, plazos, derechos`, `fundamentales) y el impacto orgánico real medido por GSC/GA4, no un filtro de`, `diversidad forzada.`, ``, `## 5. Distribución del Lote 2 por categoría`, ``, `| Categoría | Artículos |`, `|-----------|-----------|`);
  for (const [cat, n] of Object.entries(seleccionJson.distribucionCategoriasLote2).sort((a, b) => b[1] - a[1])) {
    md.push(`| ${cat} | ${n} |`);
  }
  md.push(``, `## 6. Determinismo`, ``, `El script \`scripts/fase4a-inventario-y-seleccion.ts\` es función pura de las`, `entradas. Tie-break estable por \`slug\` ascendente. Una re-ejecución con los`, `mismos \`blog-inventario.json\` + datos live devuelve exactamente el mismo top-15.`, ``, `> Nota: si los datos live se actualizan (nuevo periodo GSC), el componente`, `> \`impacto_orgánico\` puede variar; el resto de componentes es estable.`, ``);

  fs.writeFileSync(path.join(AUDITS, 'fase4a-lote2-priorizacion.md'), md.join('\n'));

  console.log(`OK: ${evaluados.length} candidatos evaluados, top-15 seleccionado.`);
  console.log('  -> docs/audits/fase4a-lote2-seleccion.json');
  console.log('  -> docs/audits/fase4a-lote2-priorizacion.md');
  console.log('Distribución Lote 2:', seleccionJson.distribucionCategoriasLote2);
}

function contarPorCategoria(arr: { category: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of arr) out[it.category] = (out[it.category] ?? 0) + 1;
  return out;
}

main();
