import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const RECRAWL_DIR = path.join(ROOT_DIR, 'auditoria_seo', 'recrawl_bing');

const BASE_URL = 'https://www.pinedayasociadoshn.com';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractUrls() {
  const urls = new Set();

  // 1. GSC Live JSON
  try {
    const gscPath = path.join(ROOT_DIR, 'data', 'google', 'gsc-live.json');
    const gscData = JSON.parse(await fs.readFile(gscPath, 'utf8'));
    if (gscData.pages) {
      for (const p of gscData.pages) {
        urls.add(p.page);
      }
    }
  } catch (e) {
    console.log('No se pudo leer gsc-live.json');
  }

  // 2. Bing Live JSON (priorityUrls)
  try {
    const bingPath = path.join(ROOT_DIR, 'data', 'bing', 'bing-live.json');
    const bingData = JSON.parse(await fs.readFile(bingPath, 'utf8'));
    if (bingData.priorityUrls) {
      for (const p of bingData.priorityUrls) {
        urls.add(p.url);
      }
    }
  } catch (e) {
    console.log('No se pudo leer bing-live.json');
  }

  // 3. Known fixes from audit files
  const knownFixes = [
    '/blog/:cat/solicitar-consulta',
    '/blog/tributario/abogados-en-choluteca',
    '/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca',
    '/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar',
    '/abogado-civil-nacaome',
    '/abogado-laboralista-nacaome',
    '/abogado-de-familia-nacaome',
    '/abogados-en-langue',
    '/abogados-en-caridad',
    '/abogados-en-san-antonio-de-flores',
    '/abogados-en-concepcion-de-maria',
    '/abogados-en-alianza',
  ];
  for (let url of knownFixes) {
    if (!url.startsWith('http')) url = BASE_URL + url;
    // skip parameterized with :cat
    if (url.includes(':cat')) continue;
    urls.add(url);
  }

  return Array.from(urls);
}

async function validateUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'SEO-Recrawl-Bot/1.0' }
    });
    
    let canonical = '';
    let xRobotsTag = response.headers.get('x-robots-tag') || '';
    
    // Check if redirect
    const redirectChain = response.redirected ? 'Yes' : 'No';
    const finalUrl = response.url;
    const statusCode = response.status;
    
    const text = await response.text();
    const hasNoIndexMeta = text.toLowerCase().includes('name="robots" content="noindex') || text.toLowerCase().includes('name="googlebot" content="noindex');
    
    const canonicalMatch = text.match(/<link\s+rel="canonical"\s+href="(.*?)"/i);
    if (canonicalMatch && canonicalMatch[1]) {
      canonical = canonicalMatch[1];
    }
    
    // Evaluate if it's indexable
    let indexable = true;
    let motivo = '';
    
    if (statusCode !== 200) {
      indexable = false;
      motivo = `Status ${statusCode}`;
    } else if (hasNoIndexMeta) {
      indexable = false;
      motivo = 'Meta robots noindex';
    } else if (xRobotsTag.toLowerCase().includes('noindex')) {
      indexable = false;
      motivo = 'X-Robots-Tag noindex';
    } else if (canonical && canonical !== finalUrl && canonical !== finalUrl + '/') {
      indexable = false;
      motivo = 'Canonical mismatch';
    }
    
    return {
      url_original: url,
      url_final: finalUrl,
      status_code: statusCode,
      redirect_chain: redirectChain,
      canonical: canonical,
      indexable: indexable ? 'Sí' : 'No',
      sitemap_included: 'Pendiente', // Simplification for now
      robots_allowed: 'Sí', // Simplification
      accion_recomendada: indexable ? 'Enviar' : 'Descartar',
      enviar_a_bing: indexable ? 'Sí' : 'No',
      motivo: motivo || 'OK'
    };
  } catch (error) {
    return {
      url_original: url,
      url_final: '',
      status_code: 0,
      redirect_chain: 'N/A',
      canonical: '',
      indexable: 'No',
      sitemap_included: 'No',
      robots_allowed: 'Desconocido',
      accion_recomendada: 'Error',
      enviar_a_bing: 'No',
      motivo: error.message
    };
  }
}

async function run() {
  await fs.mkdir(RECRAWL_DIR, { recursive: true });
  
  console.log('Extracting URLs...');
  const urls = await extractUrls();
  console.log(`Found ${urls.length} unique URLs.`);
  
  const results = [];
  let count = 0;
  for (const url of urls) {
    count++;
    console.log(`Validating ${count}/${urls.length}: ${url}`);
    const res = await validateUrl(url);
    results.push(res);
    await delay(100); // 100ms delay to avoid rate limiting
  }
  
  // Write full CSV
  const header = 'url_original,url_final,status_code,redirect_chain,canonical,indexable,sitemap_included,robots_allowed,accion_recomendada,enviar_a_bing,motivo\n';
  const csvRows = results.map(r => `"${r.url_original}","${r.url_final}",${r.status_code},"${r.redirect_chain}","${r.canonical}","${r.indexable}","${r.sitemap_included}","${r.robots_allowed}","${r.accion_recomendada}","${r.enviar_a_bing}","${r.motivo}"`).join('\n');
  
  await fs.writeFile(path.join(RECRAWL_DIR, 'urls-para-recrawl.csv'), header + csvRows);
  
  // Write no-enviadas CSV
  const discarded = results.filter(r => r.enviar_a_bing === 'No');
  const discardedRows = discarded.map(r => `"${r.url_original}","${r.url_final}",${r.status_code},"${r.redirect_chain}","${r.canonical}","${r.indexable}","${r.sitemap_included}","${r.robots_allowed}","${r.accion_recomendada}","${r.enviar_a_bing}","${r.motivo}"`).join('\n');
  await fs.writeFile(path.join(RECRAWL_DIR, 'urls-no-enviadas.csv'), header + discardedRows);
  
  // Create dry-run IndexNow CSV
  const toSend = results.filter(r => r.enviar_a_bing === 'Sí');
  const sendRows = toSend.map(r => `"${r.url_final}"`).join('\n');
  await fs.writeFile(path.join(RECRAWL_DIR, 'urls-enviadas-indexnow-dryrun.csv'), 'url_final\n' + sendRows);
  
  console.log(`\nResumen:`);
  console.log(`- Total URLs candidatas: ${results.length}`);
  console.log(`- Total descartadas: ${discarded.length}`);
  console.log(`- Total enviadas (dry-run): ${toSend.length}`);
  console.log('Archivos CSV generados en auditoria_seo/recrawl_bing/');
}

run().catch(console.error);
