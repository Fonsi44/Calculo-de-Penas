#!/usr/bin/env node
'use strict';

/**
 * Aplica los reemplazos literales del paquete
 * docs/audits/paquete-ejecucion-tecnica-2026-08-16.md
 * y del plan docs/audits/plan-implementacion-final-2026-08-16.md.
 *
 * Idempotente: si el texto nuevo ya está y el viejo no, SKIP.
 * Si el texto viejo no está y el nuevo tampoco, FAIL (no escribe).
 * Solo escribe rutas de ALLOWED_FILES.
 *
 * Uso:
 *   node scripts/patch-utils.js
 *   node scripts/patch-utils.js --dry-run
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const ALLOWED_FILES = [
  'data/blog/blog-metadata-overrides.ts',
  'app/(public)/despacho/page.tsx',
  'app/(public)/preguntas-frecuentes/page.tsx',
  'data/landings-locales.ts',
  'tests/fase2-arquitectura-publica.test.ts',
  'components/blog/blog-toc.tsx',
  'components/marketing/public-footer.tsx',
  'lib/legal-content.ts',
  'app/(public)/politica-privacidad/page.tsx',
  'app/robots.ts',
  'scripts/seo-live-collect.mjs',
  'scripts/google-search-console-live.mjs',
  'scripts/google-analytics-live.mjs',
  'scripts/bing-webmaster-live.mjs',
];

const INSERT_OVERRIDES = [
  "  'pension-alimenticia-porcentaje-honduras-2026': {",
  "    title: 'Pensión alimenticia Honduras 2026: porcentaje',",
  "    description: 'Cómo estima el juez el porcentaje de pensión alimenticia en Honduras en 2026: ingresos, necesidades del menor y tope de embargo. Nacaome.',",
  '  },',
  "  'divorcio-honduras-guia-completa': {",
  "    title: 'Divorcio en Honduras: mutuo acuerdo, causal y plazos',",
  "    description: 'Tres vías de divorcio en Honduras: mutuo consentimiento, causal y separación. Documentos, hijos y pensión. Bufete en Nacaome.',",
  '  },',
  "  'nacionalidad-espanola-para-hondurenos-residencia-plazos': {",
  "    title: 'Nacionalidad española para hondureños: plazos',",
  "    description: 'Requisitos generales de nacionalidad española por residencia. El bufete en Nacaome orienta trámites hondureños; no ejerce derecho español.',",
  '  },',
  '',
].join('\n');

const NACAOME_INTRO_SUFFIX =
  ' Indicaciones de ruta, mapa y accesos desde Tegucigalpa, Choluteca y San Lorenzo están en /como-llegar. Para contratar defensa o asesoría, use la página principal / o solicite una evaluación inicial confidencial.';

const FOOTER_DISAMBIGUATION = [
  '            <p className="text-xs text-text-inverse/70 leading-relaxed mt-2 text-pretty">',
  '              Sede en {site.address.city}, {site.address.department}. No tenemos oficina en',
  '              Tegucigalpa ni relación con despachos homónimos.',
  '            </p>',
].join('\n');

function relToAbs(rel) {
  if (!ALLOWED_FILES.includes(rel)) {
    throw new Error(`Ruta no permitida: ${rel}`);
  }
  return path.join(ROOT, rel);
}

function countOcc(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n += 1;
    i += needle.length;
  }
  return n;
}

function replaceOnce(content, find, replace, id) {
  if (content.includes(replace) && !content.includes(find)) {
    return { content, status: 'SKIP', id, detail: 'ya aplicado' };
  }
  const n = countOcc(content, find);
  if (n === 0) {
    return {
      content,
      status: 'FAIL',
      id,
      detail: 'patrón viejo no encontrado y texto nuevo ausente',
    };
  }
  if (n !== 1) {
    return {
      content,
      status: 'FAIL',
      id,
      detail: `el patrón aparece ${n} veces (se exige 1)`,
    };
  }
  return {
    content: content.replace(find, replace),
    status: 'APPLIED',
    id,
  };
}

function applyFile(rel, mutators) {
  const abs = relToAbs(rel);
  let content = fs.readFileSync(abs, 'utf8');
  const original = content;
  const steps = [];
  for (const mut of mutators) {
    const result = mut(content);
    steps.push({ id: result.id, status: result.status, detail: result.detail || '' });
    if (result.status === 'FAIL') {
      return { rel, ok: false, written: false, steps, error: result.detail };
    }
    content = result.content;
  }
  const changed = content !== original;
  if (changed && !DRY_RUN) {
    const bak = `${abs}.bak`;
    fs.copyFileSync(abs, bak);
    fs.writeFileSync(abs, content, 'utf8');
    fs.unlinkSync(bak);
  }
  return { rel, ok: true, written: changed && !DRY_RUN, dryRun: DRY_RUN && changed, steps };
}

function insertOverrides(content) {
  const id = 'blog-overrides-insert';
  if (content.includes("'divorcio-honduras-guia-completa':")) {
    return { content, status: 'SKIP', id, detail: 'claves nuevas ya presentes' };
  }
  const anchor = "  'poder-legal-honduras-cuando-se-necesita': {";
  if (!content.includes(anchor)) {
    return { content, status: 'FAIL', id, detail: 'ancla poder-legal no encontrada' };
  }
  return {
    content: content.replace(anchor, `${INSERT_OVERRIDES}${anchor}`),
    status: 'APPLIED',
    id,
  };
}

function appendNacaomeIntro(content) {
  const id = 'nacaome-intro-suffix';
  if (content.includes('/como-llegar. Para contratar defensa')) {
    return { content, status: 'SKIP', id, detail: 'sufijo ya presente' };
  }
  const oldIntro =
    "      'Nacaome, cabecera del departamento de Valle, concentra gran parte de la actividad judicial y comercial del sur de Honduras. Nuestra sede está ubicada en el centro de la ciudad, cuadra y media al este de Hondutel, contiguo a la Clínica Dental Dra. Andara. Atendemos particulares, familias y empresas de Nacaome, San Lorenzo, Amapala y toda la zona sur.',";
  const newIntro = oldIntro.replace("zona sur.',", `zona sur.${NACAOME_INTRO_SUFFIX}',`);
  return replaceOnce(content, oldIntro, newIntro, id);
}

function insertFooter(content) {
  const id = 'footer-disambiguation';
  if (content.includes('despachos homónimos')) {
    return { content, status: 'SKIP', id, detail: 'frase ya presente' };
  }
  const anchor = [
    '              pilar fundacional. Atención directa con presencia activa en juzgados del sur de Honduras.',
    '            </p>',
    '            <p className="text-xs text-text-inverse/80 leading-relaxed mt-2 text-pretty">',
    '              Aplicación rigurosa del {LEGAL_FRAME_BADGE}.',
  ].join('\n');
  const next = [
    '              pilar fundacional. Atención directa con presencia activa en juzgados del sur de Honduras.',
    '            </p>',
    FOOTER_DISAMBIGUATION,
    '            <p className="text-xs text-text-inverse/80 leading-relaxed mt-2 text-pretty">',
    '              Aplicación rigurosa del {LEGAL_FRAME_BADGE}.',
  ].join('\n');
  return replaceOnce(content, anchor, next, id);
}

const jobs = [
  [
    'data/blog/blog-metadata-overrides.ts',
    [
      (c) =>
        replaceOnce(
          c,
          [
            "  'pension-alimenticia-honduras-guia-completa': {",
            "    title: 'Pensión Alimenticia en Honduras: Requisitos y Pasos',",
            "    description: 'Requisitos y procedimiento para solicitar pensión alimenticia en Honduras. Montos, plazos, documentos y ejecución ante incumplimiento.',",
            '  },',
          ].join('\n'),
          [
            "  'pension-alimenticia-honduras-guia-completa': {",
            "    title: 'Pensión alimenticia Honduras: requisitos y pasos',",
            "    description: 'Cómo solicitar pensión alimenticia en Honduras: documentos, demanda, plazos y cobro ante incumplimiento. Guía de procedimiento. Nacaome.',",
            '  },',
          ].join('\n'),
          'pension-guia-meta',
        ),
      insertOverrides,
      (c) =>
        replaceOnce(
          c,
          [
            "  'que-hacer-si-me-detienen-en-honduras': {",
            "    title: '¿Qué hacer si me detienen en Honduras? Guía práctica',",
            "    description: 'Recomendaciones generales para actuar con prudencia ante una detención y solicitar asistencia jurídica sin interferir con la actuación de la autoridad.',",
            '  },',
          ].join('\n'),
          [
            "  'que-hacer-si-me-detienen-en-honduras': {",
            "    title: 'Detención en Honduras: derechos, 24 h y qué no firmar',",
            "    description: 'Si lo detienen en Honduras: pida el motivo, no declare sin defensor y no firme lo que no entienda. Plazo de 24 horas ante el juez.',",
            '  },',
          ].join('\n'),
          'detencion-meta',
        ),
    ],
  ],
  [
    'app/(public)/despacho/page.tsx',
    [
      (c) =>
        replaceOnce(
          c,
          [
            'export const metadata: Metadata = buildMetadata({',
            '  // 50 chars. Plan maestro §6.1: "Bufete de Abogados en Nacaome | Nuestro Equipo"',
            '  title: `Bufete de Abogados en ${site.address.city} | Nuestro Equipo`,',
            '  // 155 chars. Plan §6.1',
            '  description: `Conozca a los abogados colegiados de ${site.name}, sus áreas de práctica y la metodología de atención del bufete en ${site.address.city} y la zona sur de Honduras.`,',
          ].join('\n'),
          [
            'export const metadata: Metadata = buildMetadata({',
            '  // CHANGED A.1 — 46 chars. Desambiguación Nacaome vs Tegucigalpa.',
            "  title: 'Abogados colegiados en Nacaome, Valle | Equipo',",
            "  description: 'Equipo del bufete en Nacaome, Valle, no Tegucigalpa: áreas de práctica, método de atención y evaluación inicial confidencial.',",
          ].join('\n'),
          'despacho-metadata',
        ),
    ],
  ],
  [
    'app/(public)/preguntas-frecuentes/page.tsx',
    [
      (c) =>
        replaceOnce(
          c,
          [
            '  return {',
            "    title: 'Preguntas frecuentes sobre consultas y honorarios',",
            '    description: `${total} respuestas sobre evaluación inicial confidencial, documentación, honorarios, presupuesto y atención de ${site.name}.`,',
          ].join('\n'),
          [
            '  return {',
            "    title: { absolute: 'Honorarios y primera consulta | FAQ' },",
            '    description: `${total} respuestas sobre evaluación inicial confidencial, documentación, honorarios, presupuesto y atención de ${site.name} en Nacaome.`,',
          ].join('\n'),
          'faq-absolute-title',
        ),
      (c) =>
        replaceOnce(
          c,
          [
            '    twitter: {',
            "      card: 'summary_large_image',",
            "      title: 'Preguntas frecuentes sobre consultas y honorarios',",
          ].join('\n'),
          [
            '    twitter: {',
            "      card: 'summary_large_image',",
            "      title: 'Honorarios y primera consulta | FAQ',",
          ].join('\n'),
          'faq-twitter-title',
        ),
      (c) =>
        replaceOnce(
          c,
          [
            '    openGraph: {',
            "      title: 'Preguntas frecuentes sobre consultas y honorarios',",
          ].join('\n'),
          [
            '    openGraph: {',
            "      title: 'Honorarios y primera consulta | FAQ',",
          ].join('\n'),
          'faq-og-title',
        ),
    ],
  ],
  [
    'data/landings-locales.ts',
    [
      (c) =>
        replaceOnce(
          c,
          "    heroTitle: 'Cómo visitar nuestra oficina en Nacaome',",
          "    heroTitle: 'Sede en Nacaome: dirección, horario y visita',",
          'nacaome-hero-title',
        ),
      appendNacaomeIntro,
    ],
  ],
  [
    'tests/fase2-arquitectura-publica.test.ts',
    [
      (c) =>
        replaceOnce(
          c,
          "    expect(landing?.heroTitle).toBe('Cómo visitar nuestra oficina en Nacaome');",
          "    expect(landing?.heroTitle).toBe('Sede en Nacaome: dirección, horario y visita');",
          'fase2-hero-title',
        ),
    ],
  ],
  [
    'components/blog/blog-toc.tsx',
    [
      (c) =>
        replaceOnce(
          c,
          [
            ' *   - Este componente recibe `headings` como prop y se renderiza en SSR.',
            ' *   - El smooth-scroll al hacer clic se mantiene como enhancement progresivo.',
            ' *',
            " * El componente sigue siendo `'use client'` porque necesita `onClick` para el",
            ' * scroll suave y el pushState, pero el HTML inicial (el que ven crawlers y',
            ' * LLMs) ya contiene el TOC completo con los anchors correctos.',
          ].join('\n'),
          [
            ' *   - Este componente recibe `headings` como prop y se renderiza en SSR.',
            ' *   - El smooth-scroll al hacer clic no escribe `#` en el historial (A.2).',
            ' *',
            " * El componente sigue siendo `'use client'` porque necesita `onClick` para el",
            ' * scroll suave. Los `id` de los H2 siguen en el HTML servidor (lib/blog-toc.ts).',
          ].join('\n'),
          'toc-comment',
        ),
      (c) =>
        replaceOnce(
          c,
          [
            '            <li key={h.id}>',
            '              <a',
            '                href={`#${h.id}`}',
            '                className="text-sm text-text-secondary hover:text-primary transition-colors no-underline border-b border-dotted border-border/30 hover:border-accent/50"',
            '                onClick={(e) => {',
            '                  e.preventDefault();',
            '                  const el = document.getElementById(h.id);',
            '                  if (el) {',
            '                    const top = el.getBoundingClientRect().top + window.scrollY - 100;',
            "                    window.scrollTo({ top, behavior: 'smooth' });",
            "                    history.pushState(null, '', `#${h.id}`);",
            '                  }',
            '                }}',
            '              >',
            '                {h.text}',
            '              </a>',
          ].join('\n'),
          [
            '            <li key={h.id}>',
            '              <button',
            '                type="button"',
            '                className="text-sm text-text-secondary hover:text-primary transition-colors text-left w-full border-b border-dotted border-border/30 hover:border-accent/50"',
            '                onClick={() => {',
            '                  const el = document.getElementById(h.id);',
            '                  if (el) {',
            '                    const top = el.getBoundingClientRect().top + window.scrollY - 100;',
            "                    window.scrollTo({ top, behavior: 'smooth' });",
            '                  }',
            '                }}',
            '              >',
            '                {h.text}',
            '              </button>',
          ].join('\n'),
          'toc-button',
        ),
    ],
  ],
  ['components/marketing/public-footer.tsx', [insertFooter]],
  [
    'lib/legal-content.ts',
    [
      (c) =>
        replaceOnce(
          c,
          [
            "  'politica-privacidad': {",
            "    title: 'Política de Privacidad',",
            "    subtitle: 'Compromiso con la protección de sus datos personales conforme a la Ley de Protección de Datos de Honduras.',",
            "    version: '0.5',",
            "    lastUpdated: 'Julio 2026',",
            '  },',
          ].join('\n'),
          [
            "  'politica-privacidad': {",
            "    title: 'Política de Privacidad',",
            "    subtitle: 'Protección de datos personales conforme a la Constitución de Honduras (Arts. 76 a 80).',",
            "    version: '0.6',",
            "    lastUpdated: 'Agosto 2026',",
            '  },',
          ].join('\n'),
          'legal-privacidad-default',
        ),
    ],
  ],
  [
    'app/(public)/politica-privacidad/page.tsx',
    [
      (c) =>
        replaceOnce(
          c,
          [
            '        <p>',
            '          A la fecha de publicación de esta política, la República de',
            '          Honduras no cuenta con una autoridad regulatoria independiente',
            '          de protección de datos personales. El bufete aplica de forma',
            '          voluntaria los principios generales del derecho a la intimidad',
            "          reconocidos en los <strong className=\"font-semibold text-primary\">Arts. 76 a 80 de la Constitución de la República</strong>{' '}",
            '          y en los tratados internacionales en materia de derechos humanos',
            '          ratificados por Honduras.',
            '        </p>',
          ].join('\n'),
          [
            '        <p>',
            '          A la fecha de esta política, la República de Honduras no cuenta con',
            '          una autoridad administrativa independiente de protección de datos',
            '          personales equivalente a las agencias de otros países. El bufete',
            '          aplica de forma voluntaria los principios del derecho a la intimidad,',
            "          al honor y a la propia imagen reconocidos en los{' '}",
            '          <strong className="font-semibold text-primary">Arts. 76 a 80 de la Constitución de la República</strong>,',
            '          el deber de secreto profesional del abogado conforme a la Ley Orgánica',
            '          del Colegio de Abogados de Honduras, y las reglas generales del Código',
            '          Civil sobre responsabilidad por el uso ilícito de datos e imagen. Esta',
            '          política no afirma la vigencia de una ley general de protección de',
            '          datos personales que no esté identificada por decreto en el cuerpo',
            '          del documento.',
            '        </p>',
          ].join('\n'),
          'privacidad-parrafo-1',
        ),
    ],
  ],
  [
    'app/robots.ts',
    [
      (c) =>
        replaceOnce(
          c,
          [
            '    rules: [',
            '      ...ALLOWED_CRAWLER_USER_AGENTS.map((userAgent) => ({',
            '        userAgent,',
            "        allow: '/',",
            '        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],',
            '      })),',
            '      ...FULLY_BLOCKED_USER_AGENTS.map((userAgent) => ({',
          ].join('\n'),
          [
            '    rules: [',
            "      ...ALLOWED_CRAWLER_USER_AGENTS.filter((userAgent) => userAgent !== 'Bingbot').map((userAgent) => ({",
            '        userAgent,',
            "        allow: '/',",
            '        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],',
            '      })),',
            '      {',
            "        userAgent: 'Bingbot',",
            "        allow: '/',",
            '        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],',
            '        crawlDelay: 2,',
            '      },',
            '      ...FULLY_BLOCKED_USER_AGENTS.map((userAgent) => ({',
          ].join('\n'),
          'robots-bingbot-delay',
        ),
    ],
  ],
  [
    'scripts/seo-live-collect.mjs',
    [
      (c) =>
        replaceOnce(
          c,
          "config({ path: resolve(ROOT, '.env.local'), override: true });",
          "config({ path: resolve(ROOT, '.env.local'), override: false });",
          'collect-override',
        ),
      (c) =>
        replaceOnce(c, '      timeout: 120_000,', '      timeout: 180_000,', 'collect-timeout'),
    ],
  ],
  [
    'scripts/google-search-console-live.mjs',
    [
      (c) =>
        replaceOnce(
          c,
          'config({ path: resolve(ROOT, ".env.local"), override: true });',
          'config({ path: resolve(ROOT, ".env.local"), override: false });',
          'gsc-override',
        ),
    ],
  ],
  [
    'scripts/google-analytics-live.mjs',
    [
      (c) =>
        replaceOnce(
          c,
          'config({ path: resolve(ROOT, ".env.local"), override: true });',
          'config({ path: resolve(ROOT, ".env.local"), override: false });',
          'ga4-override',
        ),
    ],
  ],
  [
    'scripts/bing-webmaster-live.mjs',
    [
      (c) =>
        replaceOnce(
          c,
          'config({ path: resolve(ROOT, ".env.local"), override: true });',
          'config({ path: resolve(ROOT, ".env.local"), override: false });',
          'bing-override',
        ),
    ],
  ],
];

function main() {
  const report = [];
  let failed = false;
  for (const [rel, mutators] of jobs) {
    const result = applyFile(rel, mutators);
    report.push(result);
    if (!result.ok) failed = true;
  }

  const summary = report.map((r) => ({
    file: r.rel,
    ok: r.ok,
    written: r.written,
    dryRunWouldWrite: r.dryRun || false,
    steps: r.steps,
    error: r.error || null,
  }));

  process.stdout.write(`${JSON.stringify({ dryRun: DRY_RUN, failed, files: summary }, null, 2)}\n`);
  process.exit(failed ? 1 : 0);
}

main();
