/**
 * Fix interlinking rules 1, 2, 4:
 * 1. Correct service page URLs in all blog posts
 * 2. Add /solicitar-consulta link to CTAs
 * 4. Add "Artículos relacionados" section to service page template
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const POSTS_DIR = 'data/blog/posts';

// ====== MAP: blog category slug → correct service page URL ======
const CATEGORY_TO_SERVICE_URL = {
  'proceso-penal': '/derecho-penal',
  'derecho-penal': '/derecho-penal',
  'derecho-laboral': '/servicios-juridicos/derecho-laboral',
  'derecho-de-familia': '/servicios-juridicos/derecho-de-familia',
  'derecho-civil': '/servicios-juridicos/derecho-civil-y-notarial',
  'derecho-mercantil': '/servicios-juridicos/derecho-mercantil-empresarial',
  'derecho-bancario': '/servicios-juridicos/derecho-bancario-y-financiero',
  'derecho-administrativo': '/servicios-juridicos/derecho-administrativo-y-servicio-civil',
  'derecho-aduanero': '/servicios-juridicos/derecho-aduanero-y-comercio-exterior',
  'regulacion-sanitaria': '/servicios-juridicos/regulacion-sanitaria',
  'extranjeria-migracion': '/servicios-juridicos/extranjeria-en-honduras',
  'hondurenos-en-espana': '/hondurenos-en-espana',
  'propiedad-intelectual': '/servicios-juridicos/propiedad-intelectual',
  'tributario': '/servicios-juridicos/tributario-fiscal',
  'derecho-ambiental': '/servicios-juridicos/ambiental-regulatorio',
  'conciliacion-arbitraje': '/servicios-juridicos/conciliacion-y-arbitraje',
  'derechos-ciudadanos': '/servicios-juridicos',
  'practica-legal': '/servicios-juridicos',
  'noticias-legales': '/servicios-juridicos',
};

const CATEGORY_TO_SERVICE_NAME = {
  'proceso-penal': 'Derecho Penal',
  'derecho-penal': 'Derecho Penal',
  'derecho-laboral': 'Derecho Laboral',
  'derecho-de-familia': 'Derecho de Familia',
  'derecho-civil': 'Derecho Civil y Notarial',
  'derecho-mercantil': 'Derecho Mercantil y Empresarial',
  'derecho-bancario': 'Derecho Bancario y Financiero',
  'derecho-administrativo': 'Derecho Administrativo y Servicio Civil',
  'derecho-aduanero': 'Derecho Aduanero y Comercio Exterior',
  'regulacion-sanitaria': 'Regulación Sanitaria',
  'extranjeria-migracion': 'Extranjería en Honduras',
  'hondurenos-en-espana': 'Hondureños en España',
  'propiedad-intelectual': 'Propiedad Intelectual',
  'tributario': 'Derecho Tributario y Fiscal',
  'derecho-ambiental': 'Derecho Ambiental y Regulatorio',
  'conciliacion-arbitraje': 'Conciliación y Arbitraje',
  'derechos-ciudadanos': 'Pineda y Asociados',
  'practica-legal': 'Pineda y Asociados',
  'noticias-legales': 'Pineda y Asociados',
};

// Incorrect service URL patterns to find and replace (unused, kept for reference)
const WRONG_SERVICE_PATTERNS = [];

let fixedLinks = 0;
let fixedCTAs = 0;
let fixedPosts = 0;

const files = readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const filePath = join(POSTS_DIR, file);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Extract category from the file
  const catMatch = content.match(/category:\s*'([^']+)'/);
  if (!catMatch) continue;

  const category = catMatch[1];
  const correctUrl = CATEGORY_TO_SERVICE_URL[category];
  const correctName = CATEGORY_TO_SERVICE_NAME[category];

  if (!correctUrl) continue;

  // Fix 1: Replace incorrect service URL patterns in the body
  // Pattern: <a href="/servicios-juridicos/OLD-SLUG">NAME</a>
  // We need to replace the OLD slug (which was generated incorrectly) with correct one
  // The generator used getServiceSlug() which created incorrect slugs for some categories

  // Find all <a href="/servicios-juridicos/..."> patterns in body
  const serviceLinkRegex = /<a href="\/servicios-juridicos\/([^"]+)"/g;
  let match;
  while ((match = serviceLinkRegex.exec(content)) !== null) {
    const oldSlug = match[1];
    // Only fix if it doesn't match the correct slug and it's not a valid service slug
    if (oldSlug !== correctUrl.replace('/servicios-juridicos/', '') && !oldSlug.includes('y-') && !oldSlug.includes('en-')) {
      const oldUrl = `/servicios-juridicos/${oldSlug}`;
      if (oldUrl !== correctUrl) {
        content = content.replace(oldUrl, correctUrl);
        fixedLinks++;
        modified = true;
      }
    }
    // Also replace the displayed name
    if (correctName) {
      // Replace generic name with correct one if it appears as link text
      content = content.replace(
        new RegExp(`>(${category.replace(/-/g, ' ')}[^<]*)</a>`, 'gi'),
        `>${correctName}</a>`
      );
    }
  }

  // Fix 2: Add /solicitar-consulta hyperlink to CTA paragraphs
  // The CTA is in a <p><strong>...</strong></p> at the end of body
  // Pattern: <p><strong>XXX</strong></p> — wrap in <a>
  const ctaRegex = /<p><strong>((?:(?!<\/strong><\/p>)[\s\S])*?)<\/strong><\/p>/g;
  const ctaMatches = content.match(ctaRegex);
  if (ctaMatches) {
    for (const ctaBlock of ctaMatches) {
      const textOnly = ctaBlock.replace(/<p><strong>/, '').replace(/<\/strong><\/p>/, '').trim();
      if (textOnly.length > 50 && !ctaBlock.includes('<a href=')) {
        // This is a CTA without a link — add solicitar-consulta
        const linkedCTA = `<p><strong><a href="/solicitar-consulta">${textOnly}</a></strong></p>`;
        content = content.replace(ctaBlock, linkedCTA);
        fixedCTAs++;
        modified = true;
      }
    }
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    fixedPosts++;
  }
}

console.log(`=== CORRECCIONES APLICADAS ===`);
console.log(`Posts corregidos: ${fixedPosts}`);
console.log(`Enlaces a servicio corregidos: ${fixedLinks}`);
console.log(`CTAs con link añadido: ${fixedCTAs}`);
