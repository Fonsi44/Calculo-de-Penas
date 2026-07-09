import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const seoDir = path.join(dataDir, 'seo');
  const googleDir = path.join(dataDir, 'google');
  const bingDir = path.join(dataDir, 'bing');

  // Cargar datos
  const canonicalPathsPath = path.join(seoDir, 'canonical-paths.json');
  const gscPath = path.join(googleDir, 'gsc-live.json');
  const ga4Path = path.join(googleDir, 'ga4-live.json');
  const bingPath = path.join(bingDir, 'bing-live.json');

  let canonicalPaths: any = [];
  try { canonicalPaths = JSON.parse(fs.readFileSync(canonicalPathsPath, 'utf-8')); } catch(e){}

  let gscData = { pages: [] };
  try { gscData = JSON.parse(fs.readFileSync(gscPath, 'utf-8')); } catch(e){}

  let ga4Data = { topPages: [] };
  try { ga4Data = JSON.parse(fs.readFileSync(ga4Path, 'utf-8')); } catch(e){}

  let bingData = { priorityUrls: [] };
  try { bingData = JSON.parse(fs.readFileSync(bingPath, 'utf-8')); } catch(e){}

  // Extraer posts de DB
  const dbPosts = await db.select({
    slug: blogPosts.slug,
    category: blogPosts.category,
    canonicalUrl: blogPosts.canonicalUrl
  }).from(blogPosts).where(and(eq(blogPosts.published, true), eq(blogPosts.noindex, false)));

  const normalize = (url: string) => {
    try {
      if (!url.startsWith('http')) return url.split('?')[0];
      const u = new URL(url);
      return u.pathname === '' ? '/' : u.pathname;
    } catch {
      return url;
    }
  };

  const urls = new Map<string, any>();

  const getUrlObj = (p: string) => {
    let np = normalize(p);
    if (!urls.has(np)) {
      urls.set(np, {
        path: np,
        isCanonical: false,
        isDynamic: false,
        gscImpressions: 0,
        gscClicks: 0,
        ga4Views: 0,
        bingCrawled: false,
        status: 'pending'
      });
    }
    return urls.get(np);
  };

  // 1. Canonicals (Sitemap source)
  const staticRoutes = canonicalPaths.static_routes || canonicalPaths;
  staticRoutes.forEach((p: any) => {
    getUrlObj(p.path || p).isCanonical = true;
  });

  // 1.2 Categories
  try {
    const { blogCategories } = require('../data/blog/categories');
    blogCategories.forEach((c: any) => {
      const obj = getUrlObj(`/blog/${c.slug}`);
      obj.isCanonical = true;
    });
  } catch(e){}

  // 1.5 Dynamic DB routes
  dbPosts.forEach((p) => {
    const postPath = `/blog/${p.category}/${p.slug}`;
    const obj = getUrlObj(postPath);
    obj.isCanonical = true;
    obj.isDynamic = true;
  });

  // 2. GSC
  gscData.pages.forEach((p: any) => {
    const obj = getUrlObj(p.page);
    obj.gscImpressions += p.impressions;
    obj.gscClicks += p.clicks;
  });

  // 3. GA4
  ga4Data.topPages.forEach((p: any) => {
    const obj = getUrlObj(p.path);
    obj.ga4Views += p.views;
  });

  // 4. Bing
  bingData.priorityUrls.forEach((p: any) => {
    const obj = getUrlObj(p.url);
    if (p.crawled && !String(p.crawled).startsWith('/Date(01/01/0001')) {
      obj.bingCrawled = true;
    }
  });

  // Analyze
  let md = `# Auditoría de Indexabilidad de URLs\n\n`;
  md += `Fecha: ${new Date().toISOString()}\n\n`;
  md += `| Ruta | Canónica/Sitemap | Tráfico (GA4/GSC) | Bing Rastreada | Estado/Diagnóstico |\n`;
  md += `|---|---|---|---|---|\n`;

  const results: any[] = [];

  for (const [pathUrl, data] of urls.entries()) {
    let diagnostic = '';
    
    if (!pathUrl) {
      diagnostic = 'URL Inválida';
    } else if (pathUrl.includes('/intranet') || pathUrl.includes('/api') || pathUrl.includes('/admin')) {
      diagnostic = 'Privada/Técnica (No indexar)';
    } else if (data.isCanonical && (data.gscImpressions > 0 || data.ga4Views > 0)) {
      diagnostic = data.isDynamic ? 'Indexable dinámica correcta' : 'Indexable correcta';
    } else if (data.isCanonical && data.gscImpressions === 0 && data.ga4Views === 0) {
      diagnostic = 'Indexable (Sin tráfico)';
    } else if (!data.isCanonical && (data.gscImpressions > 0 || data.ga4Views > 0)) {
      diagnostic = 'Tráfico Huérfano (Falta en sitemap o requiere canonical)';
    } else if (!data.isCanonical && data.gscImpressions === 0 && data.ga4Views === 0) {
      diagnostic = 'Huérfana sin valor (Ignorar o redireccionar)';
    }

    if (diagnostic.includes('Huérfano') && pathUrl) {
       if (pathUrl.includes('?')) diagnostic += ' - Parámetro detectado';
       if (pathUrl.endsWith('/') && pathUrl.length > 1) diagnostic += ' - Trailing slash duplicado';
    }

    data.status = diagnostic;
    results.push(data);
    
    md += `| ${pathUrl} | ${data.isCanonical ? 'Sí' : 'No'} | GSC:${data.gscClicks}c/${data.gscImpressions}i GA4:${data.ga4Views} | ${data.bingCrawled ? 'Sí' : 'No'} | ${diagnostic} |\n`;
  }

  if (!fs.existsSync(seoDir)) fs.mkdirSync(seoDir, { recursive: true });
  fs.writeFileSync(path.join(seoDir, 'url-indexability-audit.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(seoDir, 'url-indexability-audit.md'), md);
  console.log('Indexability audit updated with DB posts.');
  process.exit(0);
}

main().catch(console.error);
