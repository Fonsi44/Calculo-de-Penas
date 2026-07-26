import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import {
  cargarDatosCanonicos,
  extraerClaims,
  verificarClaims,
  analizarSEO,
  wordCount,
  stripHtml,
  extraerHeadings,
  similitudCuerpo,
} from './blog-verify-fix';
import { extractLinks, extractImages, isInternalUrl, isExternalUrl } from './seo-content-audit';

const AUDIT_DIR = path.join(process.cwd(), 'docs', 'audits');

if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

// 10 Ciudades prioritarias de la R18
const CIUDADES_PRIORITARIAS = new Set([
  'nacaome', 'choluteca', 'san lorenzo', 'goascoran', 'san marcos de colon',
  'el triunfo', 'marcovia', 'pespire', 'namasigue', 'orocuina'
]);

async function main() {
  cargarDatosCanonicos();
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.error('❌ DATABASE_URL no configurada.');
    process.exit(1);
  }

  console.log('Connecting to Neon...');
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('Loading published posts...');
  const posts = await sql`
    SELECT id, slug, title, description, body, category, tags, author,
           cover_image, meta_title, meta_description, og_image,
           published, published_at, updated_at, creado_en,
           canonical_url, noindex, featured, reading_time,
           review_status, last_reviewed_at, next_review_due_at,
           legal_review_notes, reviewed_by, reviewed_at
    FROM blog_posts
    WHERE published = true
    ORDER BY creado_en DESC
  `;
  
  console.log(`Analyzing ${posts.length} posts...`);
  
  const inventario = [];
  const totalPosts = posts.length;
  
  // Para cálculo de canibalización y similitudes
  const pairwiseSimilarity = [];
  
  for (let i = 0; i < totalPosts; i++) {
    const post = posts[i];
    const body = post.body || '';
    const plainText = stripHtml(body);
    const palabras = wordCount(body);
    const headings = extraerHeadings(body);
    const links = extractLinks(body);
    const imgs = extractImages(body);
    const claims = extraerClaims(body);
    const discrepancias = verificarClaims(claims);
    const seoHallazgos = analizarSEO({
      id: post.id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      body: post.body,
      category: post.category,
      tags: post.tags,
      coverImage: post.cover_image,
      metaTitle: post.meta_title,
      metaDescription: post.meta_description,
      publishedAt: post.published_at,
      noindex: post.noindex,
      canonicalUrl: post.canonical_url,
      author: post.author,
      ogImage: post.og_image
    }, palabras);

    const h2Count = headings.filter(h => h.nivel === 2).length;
    const h3Count = headings.filter(h => h.nivel === 3).length;
    
    // Identificar enlaces
    const internalLinks = links.filter(l => isInternalUrl(l.href)).map(l => l.href);
    const externalLinks = links.filter(l => isExternalUrl(l.href)).map(l => l.href);
    
    // Detectar fuentes citadas
    const fuentesJuridicas = [];
    if (/código\s+penal/i.test(plainText) || / cp\b/i.test(plainText)) fuentesJuridicas.push('Código Penal');
    if (/código\s+procesal\s+penal/i.test(plainText) || / cpp\b/i.test(plainText)) fuentesJuridicas.push('Código Procesal Penal');
    if (/código\s+civil/i.test(plainText) || / cc\b/i.test(plainText)) fuentesJuridicas.push('Código Civil');
    if (/código\s+de\s+familia/i.test(plainText) || / cf\b/i.test(plainText)) fuentesJuridicas.push('Código de Familia');
    if (/código\s+de\s+trabajo/i.test(plainText) || / ct\b/i.test(plainText)) fuentesJuridicas.push('Código de Trabajo');
    if (/constitución/i.test(plainText)) fuentesJuridicas.push('Constitución de Honduras');
    if (/ley\s+contra\s+la\s+violencia\s+doméstica/i.test(plainText)) fuentesJuridicas.push('Ley contra la Violencia Doméstica');
    if (/niñez\s+y\s+adolescencia/i.test(plainText)) fuentesJuridicas.push('Código de la Niñez y la Adolescencia');
    if (/código\s+de\s+comercio/i.test(plainText)) fuentesJuridicas.push('Código de Comercio');
    if (/código\s+tributario/i.test(plainText)) fuentesJuridicas.push('Código Tributario');

    // Mención de años en title
    const yearMatch = post.title.match(/\b(202\d)\b/);
    const yearInTitle = yearMatch ? yearMatch[1] : null;

    // Verificar si es página local y veracidad
    const isLocal = post.slug.includes('choluteca') || post.slug.includes('nacaome') || post.slug.includes('san-lorenzo') || post.slug.includes('pespire') || post.slug.includes('marcovia');
    
    // Determinar prioridad y acción recomendada
    let priority = 'P3';
    let recommendedAction = 'Mantener';
    
    if (discrepancias.some(d => d.severidad === 'critico')) {
      priority = 'P0';
      recommendedAction = 'Corregir error jurídico urgente';
    } else if (seoHallazgos.some(h => h.severidad === 'critico')) {
      priority = 'P1';
      recommendedAction = 'Corregir SEO crítico / schema';
    } else if (palabras < 600) {
      priority = 'P2';
      recommendedAction = 'Ampliación editorial';
    } else if (seoHallazgos.some(h => h.severidad === 'importante')) {
      priority = 'P2';
      recommendedAction = 'Optimizar SEO / GEO';
    }

    if (isLocal) {
      recommendedAction = 'Consolidar en guía regional / Localizar';
    }

    // Estructurar autor del schema
    const authorStructured = post.author === 'Pineda y Asociados' ? 'Organization' : 'Person';

    inventario.push({
      slug: post.slug,
      url: `https://www.pinedayasociadoshn.com/blog/${post.category}/${post.slug}`,
      category: post.category,
      title: post.title,
      metaTitle: post.meta_title || post.title,
      metaDescription: post.meta_description || post.description,
      h1: post.title,
      publishedAt: post.published_at,
      updatedAt: post.updated_at,
      reviewedAt: post.reviewed_at,
      author: post.author,
      authorStructured,
      reviewedBy: post.reviewed_by,
      reviewStatus: post.review_status,
      wordCount: palabras,
      h2Count,
      h3Count,
      internalLinks,
      externalLinks,
      legalSources: fuentesJuridicas,
      hasCoverImage: !!post.cover_image,
      coverImageAlt: post.cover_image ? post.title : null,
      canonicalUrl: post.canonical_url,
      robots: post.noindex ? 'noindex' : 'index',
      structuredData: true,
      yearInTitle,
      needsUpdate: priority === 'P0' || palabras < 600 || yearInTitle !== null,
      priority,
      recommendedAction,
      body, // temporal para similitud
      possibleCannibalization: [] as any[]
    });
  }

  console.log('Calculating similarity scores between articles...');
  // Calcular similitud Jaccard por pares para detectar duplicación/canibalización
  for (let i = 0; i < totalPosts; i++) {
    for (let j = i + 1; j < totalPosts; j++) {
      const sim = similitudCuerpo(inventario[i].body, inventario[j].body);
      if (sim >= 0.50) {
        pairwiseSimilarity.push({
          postA: inventario[i].slug,
          postB: inventario[j].slug,
          score: sim
        });
        inventario[i].possibleCannibalization.push({ slug: inventario[j].slug, score: sim });
        inventario[j].possibleCannibalization.push({ slug: inventario[i].slug, score: sim });
      }
    }
  }

  // Eliminar el body del inventario JSON para no inflar el tamaño del archivo
  const inventarioFinal = inventario.map(item => {
    const { body, ...rest } = item;
    return rest;
  });

  // Guardar docs/audits/blog-inventario.json
  const inventarioPath = path.join(AUDIT_DIR, 'blog-inventario.json');
  fs.writeFileSync(inventarioPath, JSON.stringify(inventarioFinal, null, 2), 'utf8');
  console.log(`✓ Inventario guardado en ${inventarioPath}`);

  // Guardar docs/audits/blog-canibalizacion.json
  const canibalizacionPath = path.join(AUDIT_DIR, 'blog-canibalizacion.json');
  fs.writeFileSync(canibalizacionPath, JSON.stringify(pairwiseSimilarity, null, 2), 'utf8');
  console.log(`✓ Canibalización guardada en ${canibalizacionPath}`);

  // Guardar docs/audits/blog-fuentes-oficiales.md
  const fuentesUsadas = new Map();
  for (const item of inventarioFinal) {
    for (const src of item.legalSources) {
      const list = fuentesUsadas.get(src) || [];
      list.push(item.slug);
      fuentesUsadas.set(src, list);
    }
  }

  let fuentesMd = `# Fuentes Oficiales y Citas en el Blog Jurídico\n\n`;
  fuentesMd += `Mapeo de fuentes jurídicas canónicas del ordenamiento de Honduras y España citadas en los artículos del blog.\n\n`;
  for (const [fuente, articulos] of fuentesUsadas.entries()) {
    fuentesMd += `## ${fuente} (${articulos.length} artículos)\n\n`;
    for (const art of articulos) {
      fuentesMd += `- [\`${art}\`](/blog/${inventarioFinal.find(x => x.slug === art)?.category || ''}/${art})\n`;
    }
    fuentesMd += `\n`;
  }
  
  const fuentesPath = path.join(AUDIT_DIR, 'blog-fuentes-oficiales.md');
  fs.writeFileSync(fuentesPath, fuentesMd, 'utf8');
  console.log(`✓ Fuentes oficiales guardadas en ${fuentesPath}`);

  // Guardar docs/audits/blog-revision-humana-pendiente.md
  let pendientesMd = `# Artículos Pendientes de Revisión Humana\n\n`;
  pendientesMd += `Listado de artículos que no han sido verificados por un abogado colegiado real o que contienen discrepancias o advertencias.\n\n`;
  
  const pendientes = inventarioFinal.filter(x => x.reviewStatus !== 'verified' || x.priority === 'P0');
  pendientesMd += `Total pendientes: **${pendientes.length}** / **${totalPosts}**\n\n`;
  
  pendientesMd += `| Slug | Categoría | Prioridad | Razón de pendiente |\n`;
  pendientesMd += `| --- | --- | --- | --- |\n`;
  
  for (const p of pendientes) {
    let razon = 'Falta firma humana real';
    if (p.priority === 'P0') razon = 'Error legal detectado';
    else if (p.wordCount < 600) razon = 'Contenido corto (thin content)';
    else if (p.yearInTitle) razon = 'Incluye año en el título (' + p.yearInTitle + ')';
    
    pendientesMd += `| [\`${p.slug}\`](/blog/${p.category}/${p.slug}) | ${p.category} | **${p.priority}** | ${razon} |\n`;
  }
  
  const pendientesPath = path.join(AUDIT_DIR, 'blog-revision-humana-pendiente.md');
  fs.writeFileSync(pendientesPath, pendientesMd, 'utf8');
  console.log(`✓ Pendientes de revisión guardados en ${pendientesPath}`);
  
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
});
