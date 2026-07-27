/**
 * Fase 7C — Crawl productivo de las 134 URLs elegibles
 */
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.pinedayasociadoshn.com';
const PLAN_PATH = path.resolve('docs/audits/fase7-plan-lotes.json');
const INVENTARIO_PATH = path.resolve('docs/audits/fase7-inventario-global.json');

const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));
const inventario = JSON.parse(fs.readFileSync(INVENTARIO_PATH, 'utf-8'));

// Mapa slug → categoría
const slugCategoria = new Map<string, string>();
for (const r of inventario.elegibles) {
  slugCategoria.set(r.slug, r.category);
}

interface CrawlResult {
  slug: string;
  url_solicitada: string;
  http: number;
  url_final: string;
  redirect: boolean;
  canonical: string | null;
  title: string | null;
  title_longitud: number;
  description: string | null;
  h1: string | null;
  h1_count: number;
  headings: string[];
  breadcrumbs: boolean;
  jsonld_valido: boolean;
  blogposting_count: number;
  og_title: string | null;
  twitter_card: string | null;
  disclaimer_presente: boolean;
  disclaimer_count: number;
  enlaces_internos: number;
  enlaces_servicios: number;
  enlaces_rotos: number;
  enlaces_redirects: number;
  fuentes_visibles: boolean;
  errores: string[];
}

async function fetchUrl(slug: string): Promise<CrawlResult | null> {
  const categoria = slugCategoria.get(slug) || 'derecho-penal';
  const url = `${BASE_URL}/blog/${categoria}/${slug}`;
  const errores: string[] = [];
  
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const html = await res.text();
    
    // HTTP y redirect
    const http = res.status;
    const urlFinal = res.url || url;
    const redirect = res.status >= 300 && res.status < 400;
    
    if (http !== 200) {
      return {
        slug, url_solicitada: url, http, url_final: urlFinal, redirect,
        canonical: null, title: null, title_longitud: 0, description: null,
        h1: null, h1_count: 0, headings: [], breadcrumbs: false,
        jsonld_valido: false, blogposting_count: 0,
        og_title: null, twitter_card: null,
        disclaimer_presente: false, disclaimer_count: 0,
        enlaces_internos: 0, enlaces_servicios: 0,
        enlaces_rotos: 0, enlaces_redirects: 0,
        fuentes_visibles: false,
        errores: [`HTTP ${http}`],
      };
    }
    
    // Canonical
    const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : null;
    
    // Title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'") : null;
    
    // Description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
    const description = descMatch ? descMatch[1] : null;
    
    // H1
    const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || [];
    const h1 = h1Matches.length > 0 ? h1Matches[0].replace(/<[^>]*>/g, '') : null;
    
    // Headings
    const h2Matches = (html.match(/<h2[^>]*>([^<]*)<\/h2>/gi) || []).map(h => h.replace(/<[^>]*>/g, '').substring(0, 80));
    const h3Matches = (html.match(/<h3[^>]*>([^<]*)<\/h3>/gi) || []).map(h => h.replace(/<[^>]*>/g, '').substring(0, 80));
    
    // Breadcrumbs
    const breadcrumbs = html.includes('BreadcrumbList') || html.includes('breadcrumb');
    
    // JSON-LD
    const ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    let jsonldValido = false;
    let blogpostingCount = 0;
    if (ldJsonMatch) {
      for (const ld of ldJsonMatch) {
        try {
          const json = JSON.parse(ld.replace(/<script[^>]*>|<\/script>/gi, ''));
          if (json['@type'] === 'BlogPosting') blogpostingCount++;
          jsonldValido = true;
        } catch { /* ignorar */ }
      }
    }
    
    // OG
    const ogMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
    const ogTitle = ogMatch ? ogMatch[1] : null;
    
    // Twitter
    const twMatch = html.match(/<meta[^>]*name="twitter:card"[^>]*content="([^"]*)"/i);
    const twitterCard = twMatch ? twMatch[1] : null;
    
    // Disclaimer
    const disclaimerMatches = html.match(/avisolegal|aviso legal|no constituye asesor|descargo legal|role="note"[^>]*aria-label="Aviso legal"/gi) || [];
    const disclaimerCount = disclaimerMatches.length;
    
    // Enlaces internos
    const internalLinks = (html.match(/href="\/blog\/[^"]*"/gi) || []).length;
    const serviceLinks = (html.match(/href="\/servicios-juridicos\/[^"]*"/gi) || []).length;
    
    // Fuentes
    const fuentesVisibles = html.includes('.gob.hn') || html.includes('La Gaceta') || html.includes('Decreto');
    
    // Verificar correcciones esperadas
    if (html.includes('Decreto 130-2017') && html.includes('Código Procesal Penal')) {
      errores.push('CPP aún cita Decreto 130-2017 (debería ser 9-99-E)');
    }
    
    // Verificar titles truncados
    if (title && (title.endsWith(' y') || title.endsWith(' e') || title.endsWith(' y.'))) {
      errores.push(`Title posiblemente truncado: "${title}"`);
    }
    
    // Verificar H1
    if (h1Matches.length !== 1) {
      errores.push(`H1 count = ${h1Matches.length} (esperado 1)`);
    }
    
    // Verificar disclaimer único
    if (disclaimerCount !== 1) {
      errores.push(`Disclaimer count = ${disclaimerCount} (esperado 1)`);
    }
    
    return {
      slug, url_solicitada: url, http, url_final: urlFinal, redirect,
      canonical, title, title_longitud: title ? title.length : 0, description,
      h1, h1_count: h1Matches.length,
      headings: [...h2Matches.slice(0, 5), ...h3Matches.slice(0, 3)],
      breadcrumbs, jsonld_valido: jsonldValido, blogposting_count: blogpostingCount,
      og_title: ogTitle, twitter_card: twitterCard,
      disclaimer_presente: disclaimerCount > 0, disclaimer_count: disclaimerCount,
      enlaces_internos: internalLinks, enlaces_servicios: serviceLinks,
      enlaces_rotos: 0, enlaces_redirects: 0,
      fuentes_visibles: fuentesVisibles,
      errores,
    };
  } catch (err: any) {
    return {
      slug, url_solicitada: url, http: 0, url_final: url, redirect: false,
      canonical: null, title: null, title_longitud: 0, description: null,
      h1: null, h1_count: 0, headings: [], breadcrumbs: false,
      jsonld_valido: false, blogposting_count: 0,
      og_title: null, twitter_card: null,
      disclaimer_presente: false, disclaimer_count: 0,
      enlaces_internos: 0, enlaces_servicios: 0,
      enlaces_rotos: 0, enlaces_redirects: 0,
      fuentes_visibles: false,
      errores: [`Error: ${err.message}`],
    };
  }
}

async function main() {
  console.log('[fase7c] Iniciando crawl de 134 URLs elegibles...\n');
  
  const allSlugs: string[] = [];
  for (const lote of plan.lotes) {
    allSlugs.push(...lote.articulos);
  }
  
  const resultados: CrawlResult[] = [];
  const BATCH = 5;
  
  for (let i = 0; i < allSlugs.length; i += BATCH) {
    const batch = allSlugs.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(slug => fetchUrl(slug)));
    
    for (const r of batchResults) {
      if (r) {
        resultados.push(r);
        const status = r.http === 200 ? '✅' : '❌';
        const errInfo = r.errores.length > 0 ? ` [${r.errores.join(', ')}]` : '';
        console.log(`  ${status} [${resultados.length}/${allSlugs.length}] ${r.slug} HTTP${r.http} H1:${r.h1_count} LD:${r.blogposting_count} Disc:${r.disclaimer_count}${errInfo}`);
      }
    }
    
    // Pausa
    if (i + BATCH < allSlugs.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  // Resumen
  const http200 = resultados.filter(r => r.http === 200).length;
  const h1Ok = resultados.filter(r => r.h1_count === 1).length;
  const discOk = resultados.filter(r => r.disclaimer_count === 1).length;
  const ldOk = resultados.filter(r => r.jsonld_valido).length;
  const bpOk = resultados.filter(r => r.blogposting_count === 1).length;
  const conErrores = resultados.filter(r => r.errores.length > 0);
  
  console.log(`\n[fase7c] ✅ Crawl completado:`);
  console.log(`  HTTP 200: ${http200}/${resultados.length}`);
  console.log(`  H1=1: ${h1Ok}/${resultados.length}`);
  console.log(`  Disclaimer=1: ${discOk}/${resultados.length}`);
  console.log(`  JSON-LD válido: ${ldOk}/${resultados.length}`);
  console.log(`  BlogPosting=1: ${bpOk}/${resultados.length}`);
  console.log(`  Con errores: ${conErrores.length}`);
  
  if (conErrores.length > 0) {
    console.log(`\n  Artículos con errores:`);
    conErrores.forEach(r => {
      console.log(`    ${r.slug}: ${r.errores.join('; ')}`);
    });
  }
  
  // Guardar
  const output = {
    metadata: {
      fecha: new Date().toISOString(),
      total_solicitado: allSlugs.length,
      http_200: http200,
      h1_ok: h1Ok,
      disclaimer_ok: discOk,
      jsonld_valido: ldOk,
      blogposting_ok: bpOk,
      con_errores: conErrores.length,
    },
    resultados,
  };
  
  fs.writeFileSync(
    path.resolve('docs/audits/fase7c-validacion-produccion-134.json'),
    JSON.stringify(output, null, 2)
  );
  
  console.log(`\n  Archivo: docs/audits/fase7c-validacion-produccion-134.json`);
}

main().catch(err => {
  console.error('[fase7c] ❌ Error en crawl:', err);
  process.exit(1);
});
