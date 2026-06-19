/**
 * Script de auditoría SEO — validación de metadatos (titles, descriptions, OG/Twitter)
 * para todas las URLs públicas indexables del sitio.
 *
 * Ejecutar: npx tsx scripts/validar-meta-seo.ts
 *
 * Evalúa contra límites de Bing Webmaster Tools:
 *   - title: 30-60 caracteres
 *   - meta description: 120-160 caracteres
 *   - OG/Twitter title: ideal ≤ 55, aceptable ≤ 60
 *   - OG/Twitter description: ideal ≤ 160
 *   - Detecta marca duplicada (Pineda y Asociados repetido)
 *   - Detecta mojibake (caracteres de reemplazo �)
 *   - Detecta canonical ausente
 */

const SITE_NAME = 'Pineda y Asociados';
const BRAND = SITE_NAME;
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;
const OG_TITLE_MAX = 60;
const OG_DESC_MAX = 160;

interface RouteMeta {
  path: string;
  title: string;               // Final title with template applied where applicable
  titleRaw: string;            // The raw title from source (before template)
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  hasAbsoluteTitle?: boolean;  // true if uses title.absolute (no template)
  hasTemplate?: boolean;       // true if subject to public layout template `%s | Pineda y Asociados`
  descriptionSource?: string;
}

interface Issue {
  path: string;
  field: string;
  severity: 'ERROR' | 'WARN';
  message: string;
  actual: string | number | null;
  expected: string;
}

const issues: Issue[] = [];

function addIssue(path: string, field: string, severity: 'ERROR' | 'WARN', message: string, actual: string | number | null, expected: string) {
  issues.push({ path, field, severity, message, actual, expected });
}

function checkLen(path: string, field: string, value: string, min: number, max: number) {
  const len = value.length;
  if (len < min) {
    addIssue(path, field, 'WARN', `Demasiado corto (${len} chars)`, len, `${min}-${max}`);
  } else if (len > max) {
    addIssue(path, field, 'ERROR', `Demasiado largo (${len} chars)`, len, `${min}-${max}`);
  }
}

function checkBrandDuplicate(path: string, field: string, value: string) {
  const count = (value.match(new RegExp(BRAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  if (count > 1) {
    addIssue(path, field, 'ERROR', `Marca duplicada (${count}x): "${value}"`, count, '1');
  }
}

function checkMojibake(path: string, field: string, value: string) {
  if (value.includes('\uFFFD')) {
    addIssue(path, field, 'ERROR', `Contiene mojibake (�): "${value}"`, value, 'Sin caracteres de reemplazo');
  }
}

function applyTemplate(title: string): string {
  return `${title} | ${BRAND}`;
}

function checkAll(path: string, title: string, desc: string, opts?: { noTemplate?: boolean; ogTitle?: string; ogDesc?: string; twTitle?: string; twDesc?: string }) {
  const finalTitle = opts?.noTemplate ? title : applyTemplate(title);
  checkLen(path, 'title', finalTitle, TITLE_MIN, TITLE_MAX);
  checkBrandDuplicate(path, 'title', finalTitle);
  checkMojibake(path, 'title', finalTitle);

  checkLen(path, 'description', desc, DESC_MIN, DESC_MAX);
  checkBrandDuplicate(path, 'description', desc);
  checkMojibake(path, 'description', desc);

  if (opts?.ogTitle) {
    checkLen(path, 'og:title', opts.ogTitle, 1, OG_TITLE_MAX);
    checkBrandDuplicate(path, 'og:title', opts.ogTitle);
    checkMojibake(path, 'og:title', opts.ogTitle);
  }
  if (opts?.ogDesc) {
    checkLen(path, 'og:description', opts.ogDesc, 1, OG_DESC_MAX);
  }
  if (opts?.twTitle) {
    checkLen(path, 'twitter:title', opts.twTitle, 1, OG_TITLE_MAX);
    checkBrandDuplicate(path, 'twitter:title', opts.twTitle);
  }
  if (opts?.twDesc) {
    checkLen(path, 'twitter:description', opts.twDesc, 1, OG_DESC_MAX);
  }
}

// ── STATIC ROUTES ──

const siteTagline = 'Abogados en Nacaome, Valle | Pineda y Asociados'; // site.tagline
const siteDesc = 'Bufete en Nacaome, Valle. Defensa penal, familia, laboral, civil y mercantil. Atención directa y presupuesto por escrito. WhatsApp +504 9536-3724.';

// Public layout default (when no page overrides)
const publicLayoutDefault = `${SITE_NAME} - ${siteTagline}`;
const publicLayoutDesc = siteDesc;

// Home — uses title.absolute
checkAll('/', siteTagline, siteDesc, {
  noTemplate: true,
  ogTitle: siteTagline,
  ogDesc: siteDesc,
  twTitle: siteTagline,
  twDesc: siteDesc,
});

// Servicios Jurídicos
checkAll('/servicios-juridicos',
  'Servicios Jurídicos en Nacaome, Valle',
  'Cobertura legal integral: Nacaome, Valle, San Lorenzo y Choluteca. Penal, familia, laboral, civil, mercantil y tributario. Bufete multidisciplinar.',
  {
    ogTitle: 'Servicios Jurídicos en Nacaome, Valle',
    ogDesc: 'Cobertura legal integral en Nacaome, Valle, Honduras: las ramas principales del derecho bajo un mismo bufete.',
    twTitle: 'Servicios Jurídicos en Nacaome, Valle',
  }
);

// Derecho Penal
const hubPenalDesc = 'Defensa penal técnica y confidencial en Nacaome, Valle, San Lorenzo y Choluteca. Abogados penalistas con sede en Nacaome y cobertura en la zona sur de Honduras.';
checkAll('/derecho-penal',
  'Abogados Penalistas en Nacaome, Valle',
  hubPenalDesc,
  {
    ogTitle: 'Abogados Penalistas en Nacaome, Valle',
    ogDesc: 'Defensa penal técnica y confidencial en Nacaome, Valle. Presencia activa en la zona sur de Honduras: San Lorenzo y Choluteca.',
    twTitle: 'Abogados Penalistas en Nacaome, Valle',
  }
);

// Blog
checkAll('/blog',
  'Blog Jurídico de Abogados en Honduras',
  'Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de Pineda y Asociados.',
  {
    ogTitle: 'Blog Jurídico de Abogados en Honduras',
    ogDesc: 'Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de Pineda y Asociados.',
    twTitle: 'Blog Jurídico de Abogados en Honduras',
  }
);

// Despacho
checkAll('/despacho',
  'El Despacho — Bufete en Nacaome, Valle',
  'Conozca Pineda y Asociados, bufete en Nacaome, Valle. Más de 15 años de defensa penal y soluciones legales en derecho empresarial, de familia, laboral y civil.',
  {
    ogTitle: 'El Despacho — Bufete en Nacaome, Valle',
    ogDesc: 'Conoce Pineda y Asociados: bufete en Nacaome, Valle. Rigor técnico y soluciones legales estratégicas en penal, derecho empresarial y privado.',
    twTitle: 'El Despacho — Bufete en Nacaome, Valle',
  }
);

// Solicitar Consulta
checkAll('/solicitar-consulta',
  'Consulte a un Abogado en Nacaome, Valle',
  'Solicite una consulta confidencial sin costo en Nacaome, Valle. Evaluación inicial de su caso penal, familiar, laboral o civil con presupuesto por escrito.',
  {
    ogTitle: 'Consulte a un Abogado en Nacaome, Valle',
    ogDesc: 'Solicite una consulta confidencial con un abogado en Nacaome, Valle. Le respondemos en horario hábil.',
    twTitle: 'Consulte a un Abogado en Nacaome, Valle',
  }
);

// Hondureños en España (uses absolute title to avoid double brand)
const hondurenosTitle = 'Hondureños en España — Asistencia Legal desde Honduras';
checkAll('/hondurenos-en-espana', hondurenosTitle,
  'Asistencia legal para hondureños en España: gestión documental, actos notariales, divorcios, custodias y sucesiones entre Honduras y España. Pineda y Asociados.',
  {
    noTemplate: true,
    ogTitle: 'Hondureños en España — Asistencia Legal Internacional',
    ogDesc: 'Asistencia legal para hondureños en España: gestión documental, actos notariales, divorcios, custodias y sucesiones entre Honduras y España.',
    twTitle: 'Hondureños en España — Asistencia Legal Internacional',
  }
);

// Preguntas Frecuentes
checkAll('/preguntas-frecuentes',
  'Preguntas Frecuentes en Honduras',
  '73 respuestas a preguntas frecuentes sobre defensa penal, familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas con Pineda y Asociados.',
  {
    ogTitle: 'Preguntas Frecuentes en Honduras',
    ogDesc: '73 respuestas a preguntas frecuentes sobre defensa penal, familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas con Pineda y Asociados.',
    twTitle: 'Preguntas Frecuentes en Honduras',
  }
);

// Cómo Llegar
checkAll('/como-llegar',
  'Cómo Llegar al Bufete en Nacaome, Valle',
  'Indicaciones para llegar a Pineda y Asociados en Nacaome, Valle. Dirección exacta, mapa, rutas, cómo llegar desde Tegucigalpa, Choluteca y San Lorenzo.',
  {
    ogTitle: 'Cómo Llegar al Bufete en Nacaome, Valle | Pineda y Asociados',
    ogDesc: 'Indicaciones para llegar a Pineda y Asociados en Nacaome, Valle. Dirección exacta, mapa y rutas desde Tegucigalpa, Choluteca y San Lorenzo.',
    twTitle: 'Cómo Llegar al Bufete en Nacaome, Valle',
  }
);

// Landings locales
const landings = [
  { path: '/abogados-en-nacaome', title: 'Bufete de Abogados en Nacaome (Sede)', desc: 'Sede principal de Pineda y Asociados en Nacaome, Valle. Defensa penal, familia, laboral, civil y mercantil. Dirección, horario y WhatsApp: +504 9536-3724.' },
  { path: '/abogados-en-choluteca', title: 'Abogados en Choluteca, Honduras', desc: 'Abogados en Choluteca, Honduras. Defensa penal, familia, laboral, mercantil y aduanero. Atención desde nuestra sede en Nacaome. WhatsApp: +504 9536-3724.' },
  { path: '/abogados-en-san-lorenzo', title: 'Abogados en San Lorenzo, Valle (Puerto)', desc: 'Abogados en San Lorenzo, Valle (Honduras). Puerto y zona comercial del sur. Defensa penal, mercantil, laboral, civil y aduanero. WhatsApp: +504 9536-3724.' },
];
for (const l of landings) {
  checkAll(l.path, l.title, l.desc);
}

// Legal pages
const legalPages = [
  { path: '/politica-privacidad', title: 'Política de Privacidad', desc: 'Política de privacidad de Pineda y Asociados, bufete en Nacaome, Valle, Honduras. Protección de datos personales conforme al ordenamiento hondureño.' },
  { path: '/politica-cookies', title: 'Política de Cookies', desc: 'Política de cookies del sitio web de Pineda y Asociados, bufete jurídico en Nacaome, Valle. Información sobre cookies técnicas y de análisis utilizadas.' },
  { path: '/aviso-legal', title: 'Aviso Legal', desc: 'Aviso legal e identificación del titular del sitio web de Pineda y Asociados, bufete jurídico en Nacaome, Valle, Honduras.' },
  { path: '/terminos', title: 'Términos y Condiciones', desc: 'Términos y condiciones de uso del sitio web de Pineda y Asociados en Nacaome, Valle. Reglas de acceso y uso de servicios jurídicos publicados.' },
  { path: '/disclaimer', title: 'Exención de Responsabilidad', desc: 'Exención de responsabilidad de Pineda y Asociados, bufete en Nacaome, Valle, sobre la calculadora de penas, contenidos publicados y servicios legales.' },
  { path: '/politica-editorial', title: 'Política Editorial', desc: 'Política editorial del bufete Pineda y Asociados en Nacaome, Valle: criterios de creación, revisión y actualización de contenidos jurídicos del sitio web.' },
];
for (const p of legalPages) {
  checkAll(p.path, p.title, p.desc);
}

// ── GENERATE REPORT ──
console.log('\n══════════════════════════════════════════════════');
console.log('   AUDITORÍA SEO — METADATOS (Bing Webmaster)');
console.log('══════════════════════════════════════════════════\n');

const errors = issues.filter(i => i.severity === 'ERROR');
const warnings = issues.filter(i => i.severity === 'WARN');

console.log(`Total URLs auditadas: ${[ ...landings, ...legalPages, '/', '/servicios-juridicos', '/derecho-penal', '/blog', '/despacho', '/solicitar-consulta', '/hondurenos-en-espana', '/preguntas-frecuentes', '/como-llegar' ].length}`);
console.log(`\n🔴 ERRORES (deben corregirse): ${errors.length}`);
console.log(`🟡 ADVERTENCIAS (revisar): ${warnings.length}\n`);

if (errors.length > 0) {
  console.log('─── ERRORES ───\n');
  for (const e of errors) {
    console.log(`  [${e.path}] ${e.field}: ${e.message}`);
    console.log(`    Actual:   ${typeof e.actual === 'string' ? `"${e.actual.substring(0, 100)}${e.actual.length > 100 ? '...' : ''}"` : e.actual}`);
    console.log(`    Esperado: ${e.expected}\n`);
  }
}

if (warnings.length > 0) {
  console.log('─── ADVERTENCIAS ───\n');
  for (const w of warnings) {
    console.log(`  [${w.path}] ${w.field}: ${w.message}`);
    console.log(`    Actual:   ${typeof w.actual === 'string' ? `"${w.actual.substring(0, 100)}${w.actual.length > 100 ? '...' : ''}"` : w.actual}`);
    console.log(`    Esperado: ${w.expected}\n`);
  }
}

// Detailed per-route summary
console.log('\n─── DETALLE POR RUTA ───\n');
const allRoutes: RouteMeta[] = [
  { path: '/', title: siteTagline, titleRaw: 'site.tagline', description: siteDesc, hasAbsoluteTitle: true, hasTemplate: false },
  { path: '/servicios-juridicos', title: applyTemplate('Servicios Jurídicos en Nacaome, Valle'), titleRaw: 'Servicios Jurídicos en Nacaome, Valle', description: 'Cobertura legal integral: Nacaome, Valle, San Lorenzo y Choluteca. Penal, familia, laboral, civil, mercantil y tributario. Bufete multidisciplinar.', hasTemplate: true },
  { path: '/derecho-penal', title: applyTemplate('Abogados Penalistas en Nacaome, Valle'), titleRaw: 'Abogados Penalistas en Nacaome, Valle', description: hubPenalDesc, hasTemplate: true },
  { path: '/blog', title: applyTemplate('Blog Jurídico de Abogados en Honduras'), titleRaw: 'Blog Jurídico de Abogados en Honduras', description: 'Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de Pineda y Asociados.', hasTemplate: true },
  { path: '/despacho', title: applyTemplate('El Despacho — Bufete en Nacaome, Valle'), titleRaw: 'El Despacho — Bufete en Nacaome, Valle', description: 'Conozca Pineda y Asociados, bufete en Nacaome, Valle. Más de 15 años de defensa penal y soluciones legales en derecho empresarial, de familia, laboral y civil.', hasTemplate: true },
  { path: '/solicitar-consulta', title: applyTemplate('Consulte a un Abogado en Nacaome, Valle'), titleRaw: 'Consulte a un Abogado en Nacaome, Valle', description: 'Solicite una consulta confidencial sin costo en Nacaome, Valle. Evaluación inicial de su caso penal, familiar, laboral o civil con presupuesto por escrito.', hasTemplate: true },
  { path: '/hondurenos-en-espana', title: hondurenosTitle, titleRaw: hondurenosTitle, description: 'Asistencia legal para hondureños en España: gestión documental, actos notariales, divorcios, custodias y sucesiones entre Honduras y España. Pineda y Asociados.', hasAbsoluteTitle: true, hasTemplate: false },
  { path: '/preguntas-frecuentes', title: applyTemplate('Preguntas Frecuentes en Honduras'), titleRaw: 'Preguntas Frecuentes en Honduras', description: '73 respuestas a preguntas frecuentes sobre defensa penal, familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas con Pineda y Asociados.', hasTemplate: true },
  { path: '/como-llegar', title: applyTemplate('Cómo Llegar al Bufete en Nacaome, Valle'), titleRaw: 'Cómo Llegar al Bufete en Nacaome, Valle', description: 'Indicaciones para llegar a Pineda y Asociados en Nacaome, Valle. Dirección exacta, mapa, rutas, cómo llegar desde Tegucigalpa, Choluteca y San Lorenzo.', hasTemplate: true },
  ...landings.map(l => ({ path: l.path, title: applyTemplate(l.title), titleRaw: l.title, description: l.desc, hasTemplate: true })),
  ...legalPages.map(p => ({ path: p.path, title: applyTemplate(p.title), titleRaw: p.title, description: p.desc, hasTemplate: true })),
];

for (const r of allRoutes) {
  const titleOk = r.title.length >= TITLE_MIN && r.title.length <= TITLE_MAX;
  const descOk = r.description.length >= DESC_MIN && r.description.length <= DESC_MAX;
  const brandDup = (r.title.match(new RegExp(BRAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length > 1;

  const statusIcon = titleOk && descOk && !brandDup ? '✅' : '❌';
  const issues_list: string[] = [];
  if (!titleOk) issues_list.push(`title: ${r.title.length}c`);
  if (!descOk) issues_list.push(`desc: ${r.description.length}c`);
  if (brandDup) issues_list.push('marca duplicada');

  console.log(`  ${statusIcon} ${r.path}`);
  console.log(`     title (${r.title.length}c): ${r.title.substring(0, 80)}${r.title.length > 80 ? '...' : ''}`);
  console.log(`     desc  (${r.description.length}c): ${r.description.substring(0, 80)}${r.description.length > 80 ? '...' : ''}`);
  if (issues_list.length > 0) {
    console.log(`     ⚠ ${issues_list.join(', ')}`);
  }
  console.log('');
}

// Summary
const totalOk = allRoutes.filter(r => {
  const titleOk = r.title.length >= TITLE_MIN && r.title.length <= TITLE_MAX;
  const descOk = r.description.length >= DESC_MIN && r.description.length <= DESC_MAX;
  const brandDup = (r.title.match(new RegExp(BRAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length > 1;
  return titleOk && descOk && !brandDup;
}).length;

console.log('══════════════════════════════════════════════════');
console.log(`  Rutas OK: ${totalOk}/${allRoutes.length}`);
console.log(`  Rutas con issues: ${allRoutes.length - totalOk}`);
console.log(`  Errores title: ${errors.filter(e => e.field === 'title').length}`);
console.log(`  Errores description: ${errors.filter(e => e.field === 'description').length}`);
console.log(`  Errores marca duplicada: ${errors.filter(e => e.message.includes('Marca duplicada')).length}`);
console.log('══════════════════════════════════════════════════\n');
