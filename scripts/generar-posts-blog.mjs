import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

const BLOG_MD = 'blog.md';
const IMAGES_DIR = 'public/images/blog';
const POSTS_DIR = 'data/blog/posts';
const CATEGORIES_FILE = 'data/blog/categories.ts';

if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });

// ========== 1. Parse blog.md into article metadata ==========
const blogMd = readFileSync(BLOG_MD, 'utf-8');
const articles = [];
const categoryMap = new Map();

// Find all ### N. Category Name
const catRegex = /^###\s+(\d+)\.\s+(.+)$/gm;
let catMatch;
while ((catMatch = catRegex.exec(blogMd)) !== null) {
  categoryMap.set(catMatch[1], catMatch[2].trim());
}

// Find all #### Article titles and their metadata blocks
const articleBlocks = blogMd.split(/\n####\s+/).slice(1);

for (const block of articleBlocks) {
  const lines = block.split('\n');
  const title = lines[0].trim();
  if (!title || title === '---') continue;

  const art = { title, imageName: '', category: '', categorySlug: '', description: '', enfoque: '', cta: '', keyword: '', keywords: [], tags: [] };

  let inBody = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('- **Categoría:**')) {
      art.category = line.replace('- **Categoría:**', '').trim();
    } else if (line.startsWith('- **Palabra clave principal:**')) {
      art.keyword = line.replace('- **Palabra clave principal:**', '').trim();
    } else if (line.startsWith('- **Palabras clave secundarias:**')) {
      art.keywords = line.replace('- **Palabras clave secundarias:**', '').trim().split(/,\s*/).filter(k => k);
      art.tags = art.keywords.slice(0, 4).map(k => k.toLowerCase().replace(/[^a-záéíóúñü0-9\s-]/g, '').trim().substring(0, 40));
    } else if (line.startsWith('- **Nombre recomendado de imagen:**')) {
      art.imageName = line.replace('- **Nombre recomendado de imagen:**', '').trim();
    } else if (line.startsWith('- **Descripción breve del artículo:**')) {
      art.description = line.replace('- **Descripción breve del artículo:**', '').trim();
    } else if (line.startsWith('- **Enfoque recomendado:**')) {
      art.enfoque = line.replace('- **Enfoque recomendado:**', '').trim();
    } else if (line.startsWith('- **CTA recomendado:**')) {
      // CTA may span multiple lines until next section or empty
      let cta = line.replace('- **CTA recomendado:**', '').trim();
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '' || lines[j].trim().startsWith('####') || lines[j].trim().startsWith('###') || lines[j].trim().startsWith('---')) break;
        cta += ' ' + lines[j].trim();
      }
      art.cta = cta.replace(/^"/, '').replace(/"$/, '').trim();
    }
    // Stop at next article or section
    if (line.startsWith('####') || line.startsWith('###') || line.startsWith('---')) break;
  }

  if (!art.title || !art.imageName) continue;

  // Map category to slug
  art.categorySlug = categoryNameToSlug(art.category);

  articles.push(art);
}

console.log(`Artículos parseados de blog.md: ${articles.length}`);

// ========== 2. Match with images and skip existing posts ==========
const imageFiles = readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
const imageBases = new Set(imageFiles.map(f => basename(f, '.webp')));

const existingPosts = existsSync(POSTS_DIR)
  ? readdirSync(POSTS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts').map(f => basename(f, '.ts'))
  : [];
const existingSlugs = new Set(existingPosts);

const articlesToCreate = [];

for (const art of articles) {
  const imageBase = basename(art.imageName, '.webp');

  // Skip if image doesn't exist
  if (!imageBases.has(imageBase)) {
    continue;
  }

  // Skip if post already exists
  if (existingSlugs.has(imageBase)) {
    continue;
  }

  articlesToCreate.push({ ...art, slug: imageBase });
}

console.log(`Artículos a crear: ${articlesToCreate.length}`);
console.log(`Posts existentes omitidos: ${existingSlugs.size}`);

// ========== 3. Category name → slug mapping ==========
function categoryNameToSlug(name) {
  const n = name.trim();
  if (n.includes('Penal') && n.includes('Proceso')) return 'proceso-penal';
  if (n.includes('Penal') && !n.includes('Proceso')) return 'derecho-penal';
  if (n.includes('Laboral')) return 'derecho-laboral';
  if (n.includes('Familia')) return 'derecho-de-familia';
  if (n.includes('Civil') || n.includes('Notarial')) return 'derecho-civil';
  if (n.includes('Mercantil') && !n.includes('Propiedad')) return 'derecho-mercantil';
  if (n.includes('Bancario')) return 'derecho-bancario';
  if (n.includes('Administrativo')) return 'derecho-administrativo';
  if (n.includes('Aduanero')) return 'derecho-aduanero';
  if (n.includes('Sanitaria') || n.includes('Regulación')) return 'regulacion-sanitaria';
  if (n.includes('Extranjería') || n.includes('Migración')) return 'extranjeria-migracion';
  if (n.includes('Hondureños en')) return 'hondurenos-en-espana';
  if (n.includes('Propiedad Intelectual')) return 'propiedad-intelectual';
  if (n.includes('Tributario') || n.includes('Fiscal')) return 'tributario';
  if (n.includes('Ambiental')) return 'derecho-ambiental';
  if (n.includes('Conciliación') || n.includes('Mediación') || n.includes('Arbitraje')) return 'conciliacion-arbitraje';
  if (n.includes('Proceso Penal')) return 'proceso-penal';
  if (n.includes('Ciudadanos') || n.includes('Constitucionales')) return 'derechos-ciudadanos';
  if (n.includes('Práctica Legal') || n.includes('Gestión Empresarial')) return 'practica-legal';
  if (n.includes('Pineda') || n.includes('Confianza') || n.includes('Bufete')) return 'practica-legal';
  if (n.includes('Noticias') || n.includes('Actualidad')) return 'noticias-legales';
  return 'practica-legal';
}

// ========== 4. Service slug mapping for internal links ==========
function getServiceSlug(art) {
  const cat = art.categorySlug;
  if (cat === 'derecho-penal' || cat === 'proceso-penal') return '/servicios-juridicos/derecho-penal';
  if (cat === 'derecho-laboral') return '/servicios-juridicos/derecho-laboral';
  if (cat === 'derecho-de-familia') return '/servicios-juridicos/derecho-de-familia';
  if (cat === 'derecho-civil') return '/servicios-juridicos/derecho-civil-y-notarial';
  if (cat === 'derecho-mercantil') return '/servicios-juridicos/derecho-mercantil';
  if (cat === 'derecho-bancario') return '/servicios-juridicos/derecho-bancario';
  if (cat === 'derecho-administrativo') return '/servicios-juridicos/derecho-administrativo';
  if (cat === 'derecho-aduanero') return '/servicios-juridicos/derecho-aduanero';
  if (cat === 'regulacion-sanitaria') return '/servicios-juridicos/regulacion-sanitaria';
  if (cat === 'extranjeria-migracion' || cat === 'hondurenos-en-espana') return '/hondurenos-en-espana';
  if (cat === 'propiedad-intelectual') return '/servicios-juridicos/derecho-mercantil';
  if (cat === 'tributario') return '/servicios-juridicos/derecho-tributario';
  if (cat === 'derecho-ambiental') return '/servicios-juridicos/derecho-ambiental';
  if (cat === 'conciliacion-arbitraje') return '/servicios-juridicos/conciliacion-y-arbitraje';
  return '/servicios-juridicos';
}

function getServiceName(art) {
  const cat = art.categorySlug;
  if (cat === 'derecho-penal' || cat === 'proceso-penal') return 'Derecho Penal';
  if (cat === 'derecho-laboral') return 'Derecho Laboral';
  if (cat === 'derecho-de-familia') return 'Derecho de Familia';
  if (cat === 'derecho-civil') return 'Derecho Civil y Notarial';
  if (cat === 'derecho-mercantil') return 'Derecho Mercantil';
  if (cat === 'derecho-bancario') return 'Derecho Bancario';
  if (cat === 'derecho-administrativo') return 'Derecho Administrativo';
  if (cat === 'derecho-aduanero') return 'Derecho Aduanero';
  if (cat === 'regulacion-sanitaria') return 'Regulación Sanitaria';
  if (cat === 'extranjeria-migracion' || cat === 'hondurenos-en-espana') return 'Hondureños en España';
  if (cat === 'propiedad-intelectual') return 'Propiedad Intelectual';
  if (cat === 'tributario') return 'Derecho Tributario';
  if (cat === 'derecho-ambiental') return 'Derecho Ambiental';
  if (cat === 'conciliacion-arbitraje') return 'Conciliación y Arbitraje';
  return 'Pineda y Asociados';
}

function getAuthSource(art) {
  const cat = art.categorySlug;
  if (cat === 'derecho-penal' || cat === 'proceso-penal') return '<a href="https://www.poderjudicial.gob.hn" target="_blank" rel="noopener noreferrer">Poder Judicial de Honduras</a>';
  if (cat === 'derecho-laboral') return '<a href="https://www.trabajo.gob.hn" target="_blank" rel="noopener noreferrer">Secretaría de Trabajo de Honduras</a>';
  if (cat === 'derecho-de-familia') return 'Código de Familia de Honduras (Decreto 76-84)';
  if (cat === 'derecho-mercantil') return '<a href="https://www.ccichonduras.org" target="_blank" rel="noopener noreferrer">CCIC</a> y Código de Comercio de Honduras';
  if (cat === 'derecho-bancario') return '<a href="https://www.cnbs.gob.hn" target="_blank" rel="noopener noreferrer">Comisión Nacional de Bancos y Seguros (CNBS)</a>';
  if (cat === 'tributario') return '<a href="https://www.sar.gob.hn" target="_blank" rel="noopener noreferrer">Servicio de Administración de Rentas (SAR)</a>';
  if (cat === 'derecho-administrativo') return 'Ley de Procedimiento Administrativo de Honduras y jurisprudencia de la <a href="https://www.poderjudicial.gob.hn" target="_blank" rel="noopener noreferrer">Corte Suprema de Justicia</a>';
  if (cat === 'derecho-aduanero') return 'Código Aduanero Uniforme Centroamericano (CAUCA) y su Reglamento (RECAUCA)';
  if (cat === 'regulacion-sanitaria') return '<a href="https://www.arsa.gob.hn" target="_blank" rel="noopener noreferrer">Agencia de Regulación Sanitaria (ARSA)</a>';
  if (cat === 'propiedad-intelectual') return '<a href="https://www.ip.gob.hn" target="_blank" rel="noopener noreferrer">Dirección General de Propiedad Intelectual (DIGEPIH)</a>';
  if (cat === 'derecho-ambiental') return 'Ley General del Ambiente (Decreto 104-93) y <a href="https://www.miambiente.gob.hn" target="_blank" rel="noopener noreferrer">MiAmbiente+</a>';
  if (cat === 'conciliacion-arbitraje') return '<a href="https://www.ccichonduras.org" target="_blank" rel="noopener noreferrer">Centro de Conciliación y Arbitraje de la CCIC</a>';
  if (cat === 'extranjeria-migracion') return 'Ley de Migración y Extranjería de Honduras';
  if (cat === 'hondurenos-en-espana') return 'Ley de Extranjería de España (LO 4/2000) y su Reglamento';
  return '<a href="https://www.poderjudicial.gob.hn" target="_blank" rel="noopener noreferrer">Poder Judicial de Honduras</a>';
}

// ========== 5. Generate HTML body ==========
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>');
}

function generateBody(art, allArticles) {
  const serviceSlug = getServiceSlug(art);
  const serviceName = getServiceName(art);
  const authSource = getAuthSource(art);

  // Find related articles in the same category
  const relatedArticles = allArticles
    .filter(a => a.categorySlug === art.categorySlug && a.slug !== art.slug)
    .slice(0, 3);

  const relatedLinks = relatedArticles.length > 0
    ? '\n<p><strong>Artículos relacionados:</strong></p>\n<ul>\n' +
      relatedArticles.map(a => `<li><a href="/blog/${a.slug}">${escapeHtml(a.title)}</a></li>`).join('\n') +
      '\n</ul>\n'
    : '';

  // Build the body sections based on enfoque
  const enfoqueLower = art.enfoque.toLowerCase();
  const isGuide = enfoqueLower.includes('guía') || enfoqueLower.includes('paso');
  const isChecklist = enfoqueLower.includes('checklist');
  const isTable = enfoqueLower.includes('tabla');
  const isArticle = enfoqueLower.includes('artículo');
  const isComparison = enfoqueLower.includes('comparativa');

  let sections = '';

  // Intro section
  sections += `<p>${escapeHtml(art.description)}</p>\n`;
  sections += `<p>En <a href="/servicios-juridicos">Pineda y Asociados</a>, como bufete multidisciplinario con más de 15 años de experiencia en Honduras, queremos brindarle información clara y útil sobre este tema para que pueda tomar decisiones informadas.</p>\n`;

  // Main content based on enfoque type
  if (isGuide || isChecklist) {
    sections += `<h2>Pasos clave que debe conocer</h2>\n`;
    sections += `<p>El proceso legal en Honduras puede variar según las circunstancias específicas de cada caso. Sin embargo, existen pasos generales que aplican en la mayoría de situaciones relacionadas con este tema:</p>\n`;
    sections += `<ol>\n`;
    const steps = ['Identificar la situación legal y recopilar documentación relevante', 'Consultar con un abogado especializado para evaluar el caso', 'Determinar la vía legal más adecuada (judicial, administrativa o extrajudicial)', 'Preparar y presentar los documentos necesarios ante la autoridad competente', 'Dar seguimiento al proceso y cumplir con los plazos establecidos'];
    steps.forEach(s => { sections += `<li>${s}</li>\n`; });
    sections += `</ol>\n`;

    sections += `<h2>Documentación necesaria</h2>\n`;
    sections += `<p>Para cualquier gestión legal relacionada con este tema, es fundamental contar con la siguiente documentación:</p>\n`;
    sections += `<ul>\n`;
    sections += `<li>Documento de identidad (DNI o pasaporte vigente)</li>\n`;
    sections += `<li>Documentos que acrediten la situación (contratos, notificaciones, certificaciones)</li>\n`;
    sections += `<li>Pruebas documentales relevantes al caso</li>\n`;
    sections += `<li>Información de contacto actualizada</li>\n`;
    sections += `<li>Registro Tributario Nacional (RTN) si aplica a personas jurídicas</li>\n`;
    sections += `</ul>\n`;
  }

  if (isArticle) {
    sections += `<h2>¿Qué dice la legislación hondureña al respecto?</h2>\n`;
    sections += `<p>El marco legal hondureño contempla diversas disposiciones sobre este tema. Es importante conocerlas para entender sus derechos y obligaciones:</p>\n`;
    sections += `<p>La normativa aplicable se encuentra principalmente en la legislación vigente y en los criterios interpretativos de los tribunales de justicia. Cada caso debe analizarse individualmente, ya que las circunstancias particulares pueden modificar significativamente el resultado.</p>\n`;
  }

  if (isTable || isComparison) {
    sections += `<h2>Comparativa y plazos</h2>\n`;
    sections += `<p>A continuación presentamos una comparativa de los aspectos más relevantes:</p>\n`;
    sections += `<ul>\n`;
    sections += `<li><strong>Vía judicial:</strong> Mayor duración pero con resolución vinculante. Plazos variables según la materia.</li>\n`;
    sections += `<li><strong>Vía administrativa:</strong> Generalmente más rápida pero con posibilidad de recurso judicial posterior.</li>\n`;
    sections += `<li><strong>Vía extrajudicial:</strong> Negociación directa o mediación. Flexible en plazos y costos.</li>\n`;
    sections += `</ul>\n`;
  }

  // Common section about legal framework
  sections += `<h2>Marco legal aplicable</h2>\n`;
  sections += `<p>Este tema se encuentra regulado en Honduras por diversas disposiciones legales. La interpretación y aplicación de estas normas corresponde a los tribunales de justicia y autoridades administrativas competentes. Para obtener información actualizada, recomendamos consultar fuentes oficiales como ${authSource}.</p>\n`;
  sections += `<p>Consulte también nuestra página de <a href="${serviceSlug}">${serviceName}</a> para conocer más sobre los servicios que ofrecemos en esta área.</p>\n`;

  // Section about when to seek legal help
  sections += `<h2>¿Cuándo debe buscar asesoría legal?</h2>\n`;
  sections += `<p>Si bien este artículo busca orientarlo, existen situaciones en las que definitivamente necesita el acompañamiento de un abogado:</p>\n`;
  sections += `<ul>\n`;
  sections += `<li>Cuando reciba una notificación oficial de una autoridad</li>\n`;
  sections += `<li>Si enfrenta plazos legales que están por vencer</li>\n`;
  sections += `<li>Cuando la otra parte ya cuenta con representación legal</li>\n`;
  sections += `<li>Si el caso involucra montos económicos significativos</li>\n`;
  sections += `<li>Cuando esté en juego su libertad personal o derechos fundamentales</li>\n`;
  sections += `</ul>\n`;

  // Section about the firm's approach
  sections += `<h2>Nuestro enfoque en Pineda y Asociados</h2>\n`;
  sections += `<p>En <a href="/despacho">Pineda y Asociados</a> abordamos cada caso con un análisis personalizado. Ofrecemos consulta inicial sin costo para evaluar su situación y determinar la mejor estrategia legal. Trabajamos con transparencia: presupuesto por escrito y atención directa sin intermediarios.</p>\n`;
  sections += `<p>Nuestra experiencia de más de 15 años en el ejercicio del derecho en Honduras nos permite ofrecerle una defensa técnica y confidencial, respaldada por el conocimiento actualizado de la legislación y la jurisprudencia.</p>\n`;

  // Related articles
  sections += relatedLinks;

  // CTA section
  sections += `<p><strong>${escapeHtml(art.cta)}</strong></p>\n`;

  return sections;
}

// ========== 6. Calculate reading time ==========
function calcReadingTime(body) {
  const text = body.replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(3, Math.ceil(words / 200));
}

// ========== 7. Generate .ts post files ==========
let createdCount = 0;
const createdSlugs = [];

// Distribute dates over 60 days starting from 2026-05-15
const startDate = new Date('2026-05-15');
const dateRange = 60;

for (let i = 0; i < articlesToCreate.length; i++) {
  const art = articlesToCreate[i];

  const body = generateBody(art, articlesToCreate);
  const readingTime = calcReadingTime(body);
  const daysOffset = Math.floor((i / articlesToCreate.length) * dateRange) + Math.floor(Math.random() * 3);
  const pubDate = new Date(startDate.getTime() + daysOffset * 86400000);
  const dateStr = pubDate.toISOString().split('T')[0];

  const tags = art.tags.length > 0 ? art.tags : ['derecho', 'honduras', 'asesoria-legal'];

  const content = `import type { Post } from '../types';

export const ${toCamelCase(art.slug)}: Post = {
  slug: '${art.slug}',
  title: '${escapeHtml(art.title)}',
  description: '${escapeHtml(art.description)}',
  publishedAt: '${dateStr}',
  category: '${art.categorySlug}',
  tags: ${JSON.stringify(tags)},
  author: 'Pineda y Asociados',
  readingTime: '${readingTime} min',
  coverImage: '/images/blog/${art.slug}.webp',
  body: \`
${body}
  \`,
};
`;

  const filePath = join(POSTS_DIR, `${art.slug}.ts`);
  writeFileSync(filePath, content, 'utf-8');
  createdSlugs.push(art.slug);
  createdCount++;
}

console.log(`\n=== POSTS CREADOS: ${createdCount} ===`);

// ========== 8. Generate index.ts ==========
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toLowerCase());
}

generateIndex(createdSlugs);
console.log('Índice generado.');

function generateIndex(slugs) {
  const existingImports = [];
  const existingExports = [];

  // Read existing index to preserve old imports
  if (existsSync(join(POSTS_DIR, 'index.ts'))) {
    const existing = readFileSync(join(POSTS_DIR, 'index.ts'), 'utf-8');
    const importRegex = /import\s*\{[^}]+\}\s*from\s*'\.\/([^']+)'/g;
    let m;
    while ((m = importRegex.exec(existing)) !== null) {
      if (!slugs.includes(m[1].replace(/\.ts$/, ''))) {
        existingImports.push(m[0]);
        existingExports.push(toCamelCase(m[1].replace(/\.ts$/, '')));
      }
    }
  }

  const imports = [...existingImports];
  const exports = [...existingExports];

  for (const slug of slugs) {
    const varName = toCamelCase(slug);
    imports.push(`import { ${varName} } from './${slug}';`);
    exports.push(varName);
  }

  const indexContent = `import type { Post } from '../types';

${imports.sort().join('\n')}

export const posts: Post[] = [
  ${exports.join(',\n  ')},
];
`;

  writeFileSync(join(POSTS_DIR, 'index.ts'), indexContent, 'utf-8');
}
