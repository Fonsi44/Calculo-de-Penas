#!/usr/bin/env node
/**
 * Script de migración: posts TypeScript → WordPress (formato WXR XML)
 *
 * Lee posts desde data/blog/posts/*.ts y genera:
 *   1. wp-export.xml — archivo WXR importable por WordPress
 *   2. redirect-map.csv — redirecciones 301 para URLs legacy
 *
 * Uso:
 *   node wordpress/scripts/migrate-posts-to-wp.js
 *
 * Requisitos:
 *   - Node.js 18+
 *   - Ejecutar desde la raíz del proyecto Next.js
 *
 * Salida:
 *   wordpress/output/wp-export.xml
 *   wordpress/output/redirect-map.csv
 *
 * @package Migration Script
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(process.cwd(), 'data/blog/posts');
const OUTPUT_DIR = path.join(process.cwd(), 'wordpress/output');
const IMAGES_SOURCE_DIR = path.join(process.cwd(), 'public/images/blog');

// Mapeo de categorías antiguas → nuevas (slugs)
const CATEGORY_MAP = {
    'derecho-penal': 'derecho-penal',
    'proceso-penal': 'derecho-penal',
    'defensa-penal': 'derecho-penal',
    'derecho-de-familia': 'derecho-familia',
    'derecho-laboral': 'derecho-laboral',
    'derecho-civil': 'derecho-civil',
    'derecho-civil-y-notarial': 'derecho-civil',
    'derecho-notarial': 'derecho-civil',
    'derecho-mercantil': 'derecho-mercantil',
    'derecho-mercantil-y-empresarial': 'derecho-mercantil',
    'derecho-bancario': 'derecho-mercantil',
    'derecho-bancario-y-financiero': 'derecho-mercantil',
    'derecho-aduanero': 'derecho-mercantil',
    'derecho-aduanero-y-comercio-exterior': 'derecho-mercantil',
    'propiedad-intelectual': 'derecho-mercantil',
    'derecho-ambiental': 'derecho-mercantil',
    'conciliacion-arbitraje': 'derecho-mercantil',
    'conciliación-y-arbitraje': 'derecho-mercantil',
    'derecho-tributario': 'derecho-tributario',
    'tributario-fiscal': 'derecho-tributario',
    'derecho-administrativo': 'derecho-civil',
    'derecho-administrativo-y-servicio-civil': 'derecho-civil',
    'extranjeria-migracion': 'hondurenos-espana',
    'extranjería-y-migración': 'hondurenos-espana',
    'extranjeria': 'hondurenos-espana',
    'hondurenos-en-espana': 'hondurenos-espana',
    'regulacion-sanitaria': 'derecho-civil',
    'noticias-legales': 'actualidad-legal',
    'practica-legal': 'guias-legales',
    'derechos-ciudadanos': 'guias-legales',
    'derecho-de-familia-2': 'derecho-familia',
};

// Categorías destino con sus slugs y nombres
const CATEGORIES = {
    'derecho-penal': { name: 'Derecho Penal', parent: '' },
    'derecho-familia': { name: 'Derecho de Familia', parent: '' },
    'derecho-laboral': { name: 'Derecho Laboral', parent: '' },
    'derecho-civil': { name: 'Derecho Civil y Notarial', parent: '' },
    'derecho-mercantil': { name: 'Derecho Mercantil', parent: '' },
    'hondurenos-espana': { name: 'Hondureños en España', parent: '' },
    'derecho-tributario': { name: 'Derecho Tributario', parent: '' },
    'guias-legales': { name: 'Guías y Tutoriales', parent: '' },
    'actualidad-legal': { name: 'Actualidad Legal', parent: '' },
};

// Tags permitidos (40). Los que no estén aquí se descartan.
const ALLOWED_TAGS = [
    'divorcio', 'custodia', 'pension-alimenticia', 'herencias', 'sucesiones',
    'testamentos', 'despido', 'liquidacion-laboral', 'contratos-laborales',
    'derechos-trabajador', 'accidentes-laborales', 'detencion',
    'audiencia-inicial', 'prision-preventiva', 'medidas-cautelares',
    'recursos-penales', 'proceso-penal', 'defensa-penal',
    'constitucion-empresas', 'contratos-mercantiles', 'propiedad-intelectual',
    'marcas', 'patentes', 'deudas-bancarias', 'central-riesgos',
    'ejecucion-hipotecaria', 'importacion-exportacion', 'aduanas',
    'registro-sanitario', 'licencia-ambiental', 'arbitraje', 'mediacion',
    'hondurenos-espana', 'nacionalidad-espanola', 'arraigo', 'residencia',
    'asilo', 'impuestos', 'sar', 'facturacion-electronica', 'compliance',
];

// Tags canibalizados: grupos de posts similares. El primer slug es el canónico.
const CANNIBALIZATION_GROUPS = [
    { canonical: 'divorcio-honduras-pasos-requisitos', variants: ['divorcio-tipos-requisitos-tiempos-honduras', 'divorcio-express-mutuo-acuerdo-honduras', 'divorcio-express-por-mutuo-acuerdo-en-honduras'] },
    { canonical: 'despido-laboral-honduras-derechos', variants: ['despido-injustificado-honduras-derechos-trabajador', 'despido-empleados-publicos-procedencia-defensa-honduras'] },
    { canonical: 'pension-alimenticia-honduras-como-solicitarla', variants: ['pension-alimenticia-calcular-reclamar-honduras', 'pension-alimenticia-en-honduras-como-solicitarla'] },
    { canonical: 'contratos-mercantiles-esenciales-empresas-honduras', variants: ['contratos-mercantiles-proteger-negocio'] },
    { canonical: 'constitucion-empresas-honduras-pasos-legales', variants: ['constituir-empresa-guia-paso-a-paso-honduras'] },
    { canonical: 'importar-desde-china-guia-legal-aduanera-honduras', variants: ['importar-mercancias-guia-legal-aduanera-honduras'] },
];

/* -------------------------------------------------------------------------- */
/* PARSEO DE POSTS                                                             */
/* -------------------------------------------------------------------------- */

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: content };

    const raw = match[1];
    const body = match[2].trim();
    const frontmatter = {};

    raw.split('\n').forEach(line => {
        const sep = line.indexOf(':');
        if (sep === -1) return;
        const key = line.substring(0, sep).trim();
        let value = line.substring(sep + 1).trim();

        // Arrays: [item1, item2]
        if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
        }
        // Booleans
        else if (value === 'true') value = true;
        else if (value === 'false') value = false;
        // Strings
        else {
            value = value.replace(/^['"]|['"]$/g, '');
        }

        frontmatter[key] = value;
    });

    return { frontmatter, body };
}

function readPosts() {
    if (!fs.existsSync(POSTS_DIR)) {
        console.error('ERROR: No se encuentra ' + POSTS_DIR);
        console.error('Ejecuta este script desde la raíz del proyecto Next.js.');
        process.exit(1);
    }

    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.ts'));
    const posts = [];

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(raw);
        const slug = file.replace('.ts', '');

        posts.push({
            slug,
            title: frontmatter.title || slug,
            date: frontmatter.date || frontmatter.publishedAt || new Date().toISOString(),
            excerpt: frontmatter.excerpt || frontmatter.description || '',
            body: body,
            categories: Array.isArray(frontmatter.category)
                ? frontmatter.category
                : (frontmatter.category ? [frontmatter.category] : []),
            tags: Array.isArray(frontmatter.tags)
                ? frontmatter.tags
                : (frontmatter.tags ? [frontmatter.tags] : []),
            coverImage: frontmatter.coverImage || null,
            author: frontmatter.author || 'Pineda y Asociados',
            readingTime: frontmatter.readingTime || null,
        });
    });

    posts.sort((a, b) => new Date(a.date) - new Date(b.date));
    return posts;
}

/* -------------------------------------------------------------------------- */
/* GENERACIÓN WXR XML                                                          */
/* -------------------------------------------------------------------------- */

function escapeXML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generateWXR(posts) {
    const now = new Date().toISOString();
    let xml = '<?xml version="1.0" encoding="UTF-8" ?>\n';
    xml += '<!-- generator="Pineda Migration Script" created="' + now + '" -->\n';
    xml += '<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">\n';
    xml += '<channel>\n';
    xml += '  <title>Pineda y Asociados Blog</title>\n';
    xml += '  <link>https://www.pinedayasociadoshn.com/blog</link>\n';
    xml += '  <description>Blog Jurídico de Pineda y Asociados</description>\n';
    xml += '  <language>es</language>\n';
    xml += '  <wp:wxr_version>1.2</wp:wxr_version>\n\n';

    // Categories
    const usedCategories = new Set();
    posts.forEach(p => p.categories.forEach(c => usedCategories.add(CATEGORY_MAP[c] || c)));

    xml += '  <!-- CATEGORÍAS -->\n';
    usedCategories.forEach(slug => {
        const cat = CATEGORIES[slug];
        if (!cat) {
            console.warn('  ⚠️ Categoría no mapeada: ' + slug);
            return;
        }
        xml += '  <wp:category>\n';
        xml += '    <wp:term_id>' + escapeXML(slug) + '</wp:term_id>\n';
        xml += '    <wp:category_nicename>' + escapeXML(slug) + '</wp:category_nicename>\n';
        xml += '    <wp:cat_name><![CDATA[' + cat.name + ']]></wp:cat_name>\n';
        xml += '    <wp:category_parent><![CDATA[' + (cat.parent || '') + ']]></wp:category_parent>\n';
        xml += '  </wp:category>\n';
    });
    xml += '\n';

    // Tags (only allowed ones actually used)
    const usedTags = new Set();
    posts.forEach(p => {
        (p.tags || []).forEach(t => {
            const tagSlug = t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (ALLOWED_TAGS.includes(tagSlug)) {
                usedTags.add(tagSlug);
            }
        });
    });

    xml += '  <!-- TAGS -->\n';
    usedTags.forEach(tagSlug => {
        const name = tagSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        xml += '  <wp:tag>\n';
        xml += '    <wp:term_id>' + escapeXML(tagSlug) + '</wp:term_id>\n';
        xml += '    <wp:tag_slug>' + escapeXML(tagSlug) + '</wp:tag_slug>\n';
        xml += '    <wp:tag_name><![CDATA[' + name + ']]></wp:tag_name>\n';
        xml += '  </wp:tag>\n';
    });
    xml += '\n';

    // Authors
    const authors = new Map();
    posts.forEach(p => {
        if (!authors.has(p.author)) {
            const authorSlug = p.author.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            authors.set(p.author, authorSlug);
        }
    });

    xml += '  <!-- AUTORES -->\n';
    authors.forEach((slug, displayName) => {
        const email = slug + '@pinedayasociadoshn.com';
        xml += '  <wp:author>\n';
        xml += '    <wp:author_id>' + escapeXML(slug) + '</wp:author_id>\n';
        xml += '    <wp:author_login>' + escapeXML(slug) + '</wp:author_login>\n';
        xml += '    <wp:author_email>' + escapeXML(email) + '</wp:author_email>\n';
        xml += '    <wp:author_display_name><![CDATA[' + escapeXML(displayName) + ']]></wp:author_display_name>\n';
        xml += '    <wp:author_first_name><![CDATA[]]></wp:author_first_name>\n';
        xml += '    <wp:author_last_name><![CDATA[]]></wp:author_last_name>\n';
        xml += '  </wp:author>\n';
    });
    xml += '\n';

    // Posts
    const skippedSlugs = new Set();
    CANNIBALIZATION_GROUPS.forEach(g => g.variants.forEach(v => skippedSlugs.add(v)));

    let postIndex = 0;
    xml += '  <!-- POSTS -->\n';

    posts.forEach(p => {
        postIndex++;

        // Skip canonicalized variants
        if (skippedSlugs.has(p.slug)) return;

        const canonicalSlug = p.slug;
        const postDate = new Date(p.date).toISOString().replace('Z', '+00:00');
        const postUrl = 'https://www.pinedayasociadoshn.com/blog/' + canonicalSlug;

        // Map categories
        const postCats = p.categories.map(c => CATEGORY_MAP[c] || c).filter(c => CATEGORIES[c]);

        // Filter tags
        const postTags = (p.tags || [])
            .map(t => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
            .filter(t => ALLOWED_TAGS.includes(t));

        // Author
        const authorSlug = authors.get(p.author) || 'pineda-y-asociados';

        // Content
        const content = p.body || '';

        // Cover image
        const imageHtml = p.coverImage
            ? '<figure><img src="' + p.coverImage + '" alt="' + escapeXML(p.title) + '" /></figure>\n\n'
            : '';

        const fullContent = imageHtml + content;

        xml += '  <item>\n';
        xml += '    <title>' + escapeXML(p.title) + '</title>\n';
        xml += '    <link>' + escapeXML(postUrl) + '</link>\n';
        xml += '    <pubDate>' + postDate + '</pubDate>\n';
        xml += '    <dc:creator><![CDATA[' + authorSlug + ']]></dc:creator>\n';
        xml += '    <guid isPermaLink="true">' + escapeXML(postUrl) + '</guid>\n';
        xml += '    <description></description>\n';
        xml += '    <content:encoded><![CDATA[' + fullContent + ']]></content:encoded>\n';
        xml += '    <excerpt:encoded><![CDATA[' + escapeXML(p.excerpt) + ']]></excerpt:encoded>\n';
        xml += '    <wp:post_id>' + postIndex + '</wp:post_id>\n';
        xml += '    <wp:post_date>' + postDate + '</wp:post_date>\n';
        xml += '    <wp:post_date_gmt>' + postDate + '</wp:post_date_gmt>\n';
        xml += '    <wp:post_modified>' + postDate + '</wp:post_modified>\n';
        xml += '    <wp:post_modified_gmt>' + postDate + '</wp:post_modified_gmt>\n';
        xml += '    <wp:comment_status>closed</wp:comment_status>\n';
        xml += '    <wp:ping_status>closed</wp:ping_status>\n';
        xml += '    <wp:post_name>' + escapeXML(canonicalSlug) + '</wp:post_name>\n';
        xml += '    <wp:status>publish</wp:status>\n';
        xml += '    <wp:post_parent>0</wp:post_parent>\n';
        xml += '    <wp:menu_order>0</wp:menu_order>\n';
        xml += '    <wp:post_type>post</wp:post_type>\n';
        xml += '    <wp:post_password></wp:post_password>\n';
        xml += '    <wp:is_sticky>0</wp:is_sticky>\n';

        // Categories
        postCats.forEach(catSlug => {
            const cat = CATEGORIES[catSlug];
            if (cat) {
                xml += '    <category domain="category" nicename="' + escapeXML(catSlug) + '"><![CDATA[' + cat.name + ']]></category>\n';
            }
        });

        // Tags
        postTags.forEach(tagSlug => {
            const name = tagSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            xml += '    <category domain="post_tag" nicename="' + escapeXML(tagSlug) + '"><![CDATA[' + name + ']]></category>\n';
        });

        xml += '  </item>\n\n';
    });

    xml += '</channel>\n</rss>\n';

    // Write output
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'wp-export.xml'), xml, 'utf-8');

    console.log('✅ WXR generado: ' + path.join(OUTPUT_DIR, 'wp-export.xml'));
    console.log('   Posts exportados: ' + postIndex);
    console.log('   Posts omitidos (canibalizados): ' + skippedSlugs.size);
    console.log('   Autores: ' + authors.size);
    console.log('   Categorías activas: ' + usedCategories.size);
    console.log('   Tags activos: ' + usedTags.size);
}

/* -------------------------------------------------------------------------- */
/* GENERACIÓN REDIRECT MAP                                                     */
/* -------------------------------------------------------------------------- */

function generateRedirects(posts) {
    let csv = 'ORIGEN,DESTINO,TIPO\n';

    // 1. Posts canibalizados → canónico
    CANNIBALIZATION_GROUPS.forEach(g => {
        g.variants.forEach(v => {
            csv += '/blog/' + v + ',/blog/' + g.canonical + ',301\n';
        });
    });

    // 2. Categorías eliminadas → nuevas
    const removedCats = {};
    Object.keys(CATEGORY_MAP).forEach(oldSlug => {
        const newSlug = CATEGORY_MAP[oldSlug];
        if (oldSlug !== newSlug) {
            removedCats[oldSlug] = newSlug;
        }
    });

    Object.keys(removedCats).forEach(oldCatSlug => {
        const newCatSlug = removedCats[oldCatSlug];
        csv += '/blog/categoria/' + oldCatSlug + ',/blog/categoria/' + newCatSlug + ',301\n';
        // Página 2+ (por si hay)
        csv += '/blog/categoria/' + oldCatSlug + '/page/,' + '/blog/categoria/' + newCatSlug + ',301\n';
    });

    const redirectPath = path.join(OUTPUT_DIR, 'redirect-map.csv');
    fs.writeFileSync(redirectPath, csv, 'utf-8');
    console.log('✅ Redirect map generado: ' + redirectPath);
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                        */
/* -------------------------------------------------------------------------- */

console.log('');
console.log('=== Migración Blog → WordPress (WXR) ===');
console.log('Origen: ' + POSTS_DIR);
console.log('');

const posts = readPosts();
console.log('Posts leídos: ' + posts.length);

generateWXR(posts);
generateRedirects(posts);

console.log('');
console.log('Migración completada.');
console.log('');
console.log('Próximos pasos:');
console.log('  1. En WordPress, ve a Herramientas → Importar → WordPress');
console.log('  2. Sube ' + path.join(OUTPUT_DIR, 'wp-export.xml'));
console.log('  3. Asigna los posts al autor existente o crea los autores');
console.log('  4. Verifica que las categorías y tags se importaron correctamente');
console.log('  5. Configura las redirecciones 301 en Rank Math usando ' + path.join(OUTPUT_DIR, 'redirect-map.csv'));
