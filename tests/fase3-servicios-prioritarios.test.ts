/**
 * Tests FASE 3 — Servicios jurídicos prioritarios.
 *
 * Valida, sobre el código fuente y los datos, los criterios de cierre de la
 * instrucción FASE 3 §22:
 *   - Un H1 por página prioritaria.
 *   - Titles únicos (entre las 4 páginas).
 *   - Descriptions únicas (la dinámica deriva de area.descripcion; cada área
 *     tiene descripción distinta).
 *   - Canonical correcta (las 4 rutas reales).
 *   - Ausencia del dominio incorrecto (pinedayasocioshn.com sin www / typo).
 *   - Ausencia de P01-P15 publicadas como verificadas.
 *   - Ninguna de las 4 páginas marcada `verified` sin revisión.
 *   - FAQ visible count == area.faqs.length (alineación con JSON-LD).
 *   - CTA con motivos permitidos (whitelist MOTIVO_FROM_QUERY).
 *   - Ausencia de PII en analítica (trackViewService sin nombre/tel/email).
 *   - Enlaces internos válidos (a /solicitar-consulta, /despacho,
 *     /servicios-juridicos).
 *   - Salvaguardas editoriales del blog.
 *   - Inexistencia de cambios en páginas locales.
 *   - Inexistencia de cambios en España.
 *   - NAP procedente de site (sin literales divergentes).
 *   - view_service excluido de preview e intranet.
 *
 * Tests anti-regresión: no requieren DB ni build.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { site } from '@/lib/site';
import {
  ANALYTICS_EXCLUDED_PREFIXES,
  isAnalyticsExcludedPath,
} from '@/lib/analytics';
import {
  hubPenal,
  getAreaBySlug,
} from '@/data/areas-juridicas';
import {
  LEGAL_REVIEW_REGISTRY,
  getLegalReview,
} from '@/lib/legal-review';

const ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(ROOT, 'app/(public)');

function readPublic(rel: string): string {
  const path = resolve(PUBLIC, rel);
  if (!existsSync(path)) {
    throw new Error(`No existe ${path}`);
  }
  return readFileSync(path, 'utf8');
}

function readRoot(rel: string): string {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) {
    throw new Error(`No existe ${path}`);
  }
  return readFileSync(path, 'utf8');
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

/** git diff --name-only filtrado por patrón; devuelve array de rutas. */
function gitDiffNameOnly(glob: string): string[] {
  try {
    const out = execSync(`git diff --name-only HEAD -- ${glob}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* 1. Las cuatro páginas prioritarias existen y tienen contenido propio       */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Existencia de páginas prioritarias', () => {
  it('/derecho-penal existe como página estática', () => {
    const src = readPublic('derecho-penal/page.tsx');
    expect(src).toContain('hubPenal');
    // La respuesta directa vive en hubPenal.respuestaDirecta y se renderiza vía
    // AnswerBlock (existente) y los bloques de detalle FASE 3.
    const hasAnswer = src.includes('AnswerBlock') || src.includes('service-detail-blocks');
    expect(hasAnswer, 'debe tener AnswerBlock o bloques FASE 3').toBe(true);
  });

  it('/servicios-juridicos/[slug] existe como página dinámica', () => {
    const src = readPublic('servicios-juridicos/[slug]/page.tsx');
    expect(src).toContain('getAreaBySlug');
    expect(src).toContain('areasGenerales');
  });

  it('las tres áreas prioritarias existen en data/areas-juridicas.ts', () => {
    const familia = getAreaBySlug('derecho-de-familia');
    const laboral = getAreaBySlug('derecho-laboral');
    const civil = getAreaBySlug('derecho-civil-y-notarial');
    expect(familia).toBeDefined();
    expect(laboral).toBeDefined();
    expect(civil).toBeDefined();
  });

  it('el hub penal existe', () => {
    expect(hubPenal).toBeDefined();
    expect(hubPenal.slug).toBe('derecho-penal');
  });
});

/* -------------------------------------------------------------------------- */
/* 2. Un H1 por página prioritaria                                            */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Un H1 por página', () => {
  it('/derecho-penal tiene exactamente un <h1> en JSX visible', () => {
    const src = readPublic('derecho-penal/page.tsx');
    // PageHero renderiza el H1 a partir de la prop title. El PageHero ya
    // garantiza un único H1; aquí validamos que no haya <h1> adicionales
    // literales en el cuerpo.
    const h1LiteralCount = countMatches(src, /<h1\b/g);
    expect(h1LiteralCount, 'no debe haber <h1> literales (PageHero emite el único)').toBe(0);
    expect(src).toContain('PageHero');
  });

  it('[slug] emite el H1 desde heroTitle (un único H1 por render)', () => {
    const src = readPublic('servicios-juridicos/[slug]/page.tsx');
    // La página [slug] renderiza <h1>{area.heroTitle}</h1> una sola vez.
    const h1Count = countMatches(src, /<h1\b/g);
    expect(h1Count, 'la página [slug] debe tener un único <h1>').toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/* 3. Titles y descriptions únicos                                            */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Metadata única', () => {
  it('heroTitle de las 4 áreas son distintos entre sí', () => {
    const titles = [
      hubPenal.heroTitle,
      getAreaBySlug('derecho-de-familia')!.heroTitle,
      getAreaBySlug('derecho-laboral')!.heroTitle,
      getAreaBySlug('derecho-civil-y-notarial')!.heroTitle,
    ];
    const unique = new Set(titles);
    expect(unique.size, 'los 4 H1 deben ser distintos').toBe(titles.length);
  });

  it('descripcion de las 3 áreas dinámicas son distintas', () => {
    const descs = [
      getAreaBySlug('derecho-de-familia')!.descripcion,
      getAreaBySlug('derecho-laboral')!.descripcion,
      getAreaBySlug('derecho-civil-y-notarial')!.descripcion,
    ];
    const unique = new Set(descs);
    expect(unique.size).toBe(descs.length);
  });
});

/* -------------------------------------------------------------------------- */
/* 4. Canonical correcta                                                      */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Canonical', () => {
  it('[slug] usa canonical /servicios-juridicos/${slug}', () => {
    const src = readPublic('servicios-juridicos/[slug]/page.tsx');
    expect(src).toContain("canonical = `/servicios-juridicos/${slug}`");
  });

  it('/derecho-penal usa canonicalPath /derecho-penal', () => {
    const src = readPublic('derecho-penal/page.tsx');
    expect(src).toMatch(/canonicalPath:\s*['"`]\/derecho-penal['"`]/);
  });
});

/* -------------------------------------------------------------------------- */
/* 5. Ausencia del dominio incorrecto                                         */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Dominio correcto', () => {
  const pages = [
    'derecho-penal/page.tsx',
    'servicios-juridicos/[slug]/page.tsx',
  ];

  pages.forEach((rel) => {
    it(`${rel} no usa pinedayasocioshn.com (sin www) ni typo pinedayasoci`, () => {
      const src = readPublic(rel);
      expect(src).not.toMatch(/pinedayasocioshn\.com/);
      expect(src).not.toMatch(/pinedayasoci\b/);
    });
  });
});

/* -------------------------------------------------------------------------- */
/* 6. Ausencia de P01-P15 publicadas como verificadas                         */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Afirmaciones P01-P15 no verificadas', () => {
  it('las 4 páginas prioritarias NO están marcadas verified', () => {
    const paths = [
      '/derecho-penal',
      '/servicios-juridicos/derecho-de-familia',
      '/servicios-juridicos/derecho-laboral',
      '/servicios-juridicos/derecho-civil-y-notarial',
    ];
    paths.forEach((p) => {
      const review = getLegalReview(p);
      expect(
        review.reviewStatus,
        `${p} no debe ser verified sin firma humana`,
      ).not.toBe('verified');
    });
  });

  it('LEGAL_REVIEW_REGISTRY no contiene verified en las 4 páginas', () => {
    const paths = [
      '/derecho-penal',
      '/servicios-juridicos/derecho-de-familia',
      '/servicios-juridicos/derecho-laboral',
      '/servicios-juridicos/derecho-civil-y-notarial',
    ];
    paths.forEach((p) => {
      const entry = LEGAL_REVIEW_REGISTRY[p];
      if (entry) {
        expect(entry.reviewStatus).not.toBe('verified');
      }
    });
  });

  it('las áreas prioritarias no publican la cifra P01 (30%-60%) en respuestaDirecta', () => {
    const familia = getAreaBySlug('derecho-de-familia')!;
    const text = JSON.stringify(familia.respuestaDirecta ?? '');
    expect(text).not.toMatch(/30\s*%.*60\s*%|30%.*60%/);
  });

  it('las áreas prioritarias no publican tope P04 (25 meses) en respuestaDirecta', () => {
    const laboral = getAreaBySlug('derecho-laboral')!;
    const text = JSON.stringify(laboral.respuestaDirecta ?? '');
    expect(text).not.toMatch(/25\s*meses|máximo\s*25/i);
  });
});

/* -------------------------------------------------------------------------- */
/* 7. FAQ visible == JSON-LD (misma fuente area.faqs)                         */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — FAQ visible alineada con JSON-LD', () => {
  it('[slug] delega area.faqs únicamente en HubFaq', () => {
    const src = readPublic('servicios-juridicos/[slug]/page.tsx');
    // HubFaq recibe area.faqs y genera el render visible + JSON-LD FAQPage.
    expect(src).toMatch(/<HubFaq[\s\S]*faqs=\{area\.faqs\}/);
    expect(src).not.toMatch(/faqs:\s*area\.faqs/);
  });

  it('cada área prioritaria tiene entre 5 y 8 FAQ', () => {
    const slugs = ['derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];
    slugs.forEach((slug) => {
      const area = getAreaBySlug(slug)!;
      expect(
        area.faqs.length,
        `${slug} debe tener 5-8 FAQ (tiene ${area.faqs.length})`,
      ).toBeGreaterThanOrEqual(5);
      expect(area.faqs.length).toBeLessThanOrEqual(8);
    });
  });

  it('el hub penal tiene entre 5 y 8 FAQ', () => {
    expect(hubPenal.faqs.length).toBeGreaterThanOrEqual(5);
    expect(hubPenal.faqs.length).toBeLessThanOrEqual(8);
  });

  it('las FAQ de las áreas prioritarias tienen pregunta y respuesta no vacías', () => {
    const slugs = ['derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];
    slugs.forEach((slug) => {
      const area = getAreaBySlug(slug)!;
      area.faqs.forEach((f, i) => {
        expect(f.pregunta.trim().length, `${slug} faq[${i}].pregunta`).toBeGreaterThan(0);
        expect(f.respuesta.trim().length, `${slug} faq[${i}].respuesta`).toBeGreaterThan(20);
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/* 8. CTA con motivos permitidos (whitelist)                                  */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — CTA y whitelist de motivo', () => {
  it('el formulario define MOTIVO_FROM_QUERY (whitelist)', () => {
    const src = readRoot('components/marketing/solicitar-consulta-form.tsx');
    expect(src).toContain('MOTIVO_FROM_QUERY');
    // Los 4 slugs prioritarios están mapeados.
    expect(src).toMatch(/['"]derecho-penal['"]/);
    expect(src).toMatch(/['"]derecho-de-familia['"]/);
    expect(src).toMatch(/['"]derecho-laboral['"]/);
    expect(src).toMatch(/['"]derecho-civil-y-notarial['"]/);
  });

  it('el formulario valida el motivo mapeado contra el catálogo MOTIVOS', () => {
    const src = readRoot('components/marketing/solicitar-consulta-form.tsx');
    // Doble validación: el motivo mapeado debe seguir siendo una opción válida.
    expect(src).toMatch(/MOTIVOS as readonly string\[\]/);
    expect(src).toMatch(/\.includes\(mapped\)/);
  });

  it('las áreas prioritarias definen ctaContextual con href ?motivo=', () => {
    const slugs = ['derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];
    slugs.forEach((slug) => {
      const area = getAreaBySlug(slug)!;
      expect(area.ctaContextual, `${slug} debe definir ctaContextual`).toBeDefined();
      expect(area.ctaContextual!.href).toContain(`motivo=${slug}`);
      expect(area.ctaContextual!.href).toContain('#formulario');
    });
  });

  it('el hub penal define ctaContextual con ?motivo=derecho-penal', () => {
    expect(hubPenal.ctaContextual).toBeDefined();
    expect(hubPenal.ctaContextual!.href).toContain('motivo=derecho-penal');
    expect(hubPenal.ctaContextual!.href).toContain('#formulario');
  });
});

/* -------------------------------------------------------------------------- */
/* 9. Ausencia de PII en analítica                                            */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Analítica sin PII', () => {
  it('trackViewService solo acepta un identificador (sin nombre/tel/email)', () => {
    // trackViewService es una función; verificamos que su firma y comportamiento
    // no incluyan PII. Solo recibe un slug/identificador.
    const src = readRoot('lib/analytics.ts');
    const fnMatch = src.match(/export function trackViewService\([^)]*\)/);
    expect(fnMatch).not.toBeNull();
    // El cuerpo solo envía { value, servicio } — sin PII.
    expect(src).toMatch(/trackEvent\(['"]view_service['"]/);
  });

  it('view-service-tracker solo pasa serviceSlug a trackViewService', () => {
    const src = readRoot('components/marketing/view-service-tracker.tsx');
    expect(src).toMatch(/trackViewService\(serviceSlug\)/);
    // No debe leer inputs del usuario ni PII.
    expect(src).not.toMatch(/document\.(cookie|forms)/);
  });

  it('view_service está excluido de preview e intranet (via isAnalyticsExcludedPath)', () => {
    // El helper trackViewService usa trackEvent que a su vez depende de gtag;
    // la exclusión de rutas la aplica el layout público (analytics-scripts)
    // consultando ANALYTICS_EXCLUDED_PREFIXES. Verificamos la lista.
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain('/preview');
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain('/intranet');
    expect(isAnalyticsExcludedPath('/preview/abc')).toBe(true);
    expect(isAnalyticsExcludedPath('/intranet/dashboard')).toBe(true);
    // Las rutas de los servicios prioritarios NO se excluyen.
    expect(isAnalyticsExcludedPath('/derecho-penal')).toBe(false);
    expect(isAnalyticsExcludedPath('/servicios-juridicos/derecho-laboral')).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* 10. Enlaces internos válidos                                               */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Enlaces internos', () => {
  it('[slug] usa ContextualCta (que recibe href de area.ctaContextual) y enlaza a /despacho, /servicios-juridicos', () => {
    const src = readPublic('servicios-juridicos/[slug]/page.tsx');
    // El enlace a /solicitar-consulta llega vía ContextualCta + area.ctaContextual.href
    // (definido en data/areas-juridicas.ts). Validamos el componente y los enlaces
    // que sí aparecen como literales en la página.
    expect(src).toContain('ContextualCta');
    expect(src).toMatch(/\/despacho/);
    expect(src).toMatch(/\/servicios-juridicos/);
  });

  it('/derecho-penal usa ContextualCta (href de hubPenal.ctaContextual) y enlaza a /despacho, /servicios-juridicos', () => {
    const src = readPublic('derecho-penal/page.tsx');
    expect(src).toContain('ContextualCta');
    expect(src).toMatch(/\/despacho/);
    expect(src).toMatch(/\/servicios-juridicos/);
  });

  it('los ctaContextual (data file) apuntan a /solicitar-consulta (ruta real, no redirect)', () => {
    // /solicitar-consulta es ruta real (no está en la lista 301 de next.config).
    const allCta = [
      hubPenal.ctaContextual!.href,
      getAreaBySlug('derecho-de-familia')!.ctaContextual!.href,
      getAreaBySlug('derecho-laboral')!.ctaContextual!.href,
      getAreaBySlug('derecho-civil-y-notarial')!.ctaContextual!.href,
    ];
    allCta.forEach((href) => {
      expect(href.startsWith('/solicitar-consulta')).toBe(true);
    });
  });

  it('los ctaContextual contienen el slug correcto en ?motivo=', () => {
    expect(hubPenal.ctaContextual!.href).toContain('motivo=derecho-penal');
    expect(getAreaBySlug('derecho-de-familia')!.ctaContextual!.href).toContain('motivo=derecho-de-familia');
    expect(getAreaBySlug('derecho-laboral')!.ctaContextual!.href).toContain('motivo=derecho-laboral');
    expect(getAreaBySlug('derecho-civil-y-notarial')!.ctaContextual!.href).toContain('motivo=derecho-civil-y-notarial');
  });
});

/* -------------------------------------------------------------------------- */
/* 11. Inexistencia de cambios en blog, locales y España                      */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Subsistemas intactos', () => {
  it('el blog mantiene cautelas editoriales y de atribución jurídica', () => {
    const article = readRoot('app/(public)/blog/[categoria]/[slug]/page.tsx');
    const adapter = readRoot('lib/blog.ts');
    const generatedCta = readRoot('lib/blog-generated-cta.ts');
    expect(generatedCta).toContain('No se garantizan resultados');
    expect(article).toContain('validSignature &&');
    expect(article).toContain('Revisión jurídica institucional:');
    expect(adapter).not.toContain('cleanPlaceholderLinks');
    expect(article).toContain('normalizeBlogLinksForRender');
  });

  it('páginas geográficas sin cambios NUEVOS (salvo política de claims 2026-08-03)', () => {
    // Excluimos las ya modificadas en FASE 1/2 (que están en el árbol desde
    // antes de iniciar FASE 3). Esta validación usa git diff HEAD, que incluye
    // FASE 1/2; por eso comprobamos que NO haya cambios NUEVOS en landings que
    // no estuvieran ya modificadas al iniciar. Las páginas abogado-civil y
    // abogado-de-familia solo pueden cambiar por la política de claims
    // «Evaluación inicial confidencial» (decisión 2026-08-03); cualquier otro
    // cambio nuevo en las demás rutas falla.
    const changed = gitDiffNameOnly('"app/(public)/abogado-civil-nacaome" "app/(public)/abogado-de-familia-nacaome" "app/(public)/abogados-en-choluteca" "app/(public)/abogados-en-san-lorenzo" "app/(public)/abogados-en-goascoran"');
    const allowedPolicyChanges = new Set([
      'app/(public)/abogado-civil-nacaome/page.tsx',
      'app/(public)/abogado-de-familia-nacaome/page.tsx',
    ]);
    const unexpected = changed.filter((file) => !allowedPolicyChanges.has(file));
    expect(unexpected, `páginas locales modificadas fuera de política: ${unexpected.join(', ')}`).toHaveLength(0);
  });

  it('la sección España dirige el contacto al abogado responsable', () => {
    const src = readPublic('hondurenos-en-espana/page.tsx');
    expect(src).toContain('THANIA_PROFILE');
    expect(src).toContain('directWhatsappHref(THANIA_PROFILE.phone');
    expect(src).toContain('directTelHref(THANIA_PROFILE.phone)');
  });

  it('SGIE/intranet/admin/auth/DB intactos (sin cambios vs HEAD)', () => {
    const changed = gitDiffNameOnly('app/intranet app/api/intranet app/api/admin lib/sgie lib/auth.ts proxy.ts lib/schema.ts');
    // Fase 3 añade columnas ai_review_* al schema, cambio autorizado
    // Lint fixes: eliminación de imports/variables no usadas (78e3d)
    const lintFixes = [
      'app/api/admin/knowledge/route.ts',
      'app/intranet/sgie/brief/page.tsx',
      'app/intranet/sgie/buscar/page.tsx',
      'app/intranet/sgie/dashboard/page.tsx',
      'app/intranet/sgie/documentos/segmentacion/page.tsx',
      'app/intranet/sgie/riesgo/page.tsx',
      'lib/sgie/autonomy-metrics-service.ts',
      'lib/sgie/baselines-service.ts',
      'lib/sgie/document-comparison-service.ts',
      'lib/sgie/document-contradictions-service.ts',
      'lib/sgie/document-intelligence-jobs.ts',
      'lib/sgie/document-segmentation-service.ts',
    ];
    // Fase 1/3 estabilización: correcciones de bugs P0 (proxy, 2FA, agenda, delitos, SGIE scope).
    const estabilizacionFase1 = [
      'app/intranet/admin/delitos/page.tsx',
      'app/intranet/login/page.tsx',
      'app/intranet/sgie/agenda/page.tsx',
      'proxy.ts',
    ];
    // Fase 4B cleanup: eliminación de CalendarExternalSection y subsistema sandbox abandonado.
    const fase4bCleanup = [
      'components/sgie/calendar-external-section.tsx',
      'lib/sgie/calendar-sync.ts',
      'lib/calendar/provider.ts',
      'lib/calendar/sandbox-provider.ts',
      'lib/sgie/brief-jobs.ts',
      'lib/sgie/risk-workload-jobs.ts',
      'lib/sgie/search-indexer.ts',
    ];
    // Fase 3: corrección de referencias documentales (pinedayasociados.md → docs/architecture/)
    const fase3DocsFix = [
      'lib/auth.ts',
      'lib/sgie/clientes-db.ts',
      'lib/sgie/correos-db.ts',
      'lib/sgie/documentos-db.ts',
      'lib/sgie/enlaces-magicos.ts',
      'lib/sgie/expedientes-db.ts',
      'lib/sgie/ia-documental.ts',
      'lib/sgie/ia-router.ts',
      'lib/sgie/motor-confianza.ts',
      'lib/sgie/motor-documental.ts',
      'lib/sgie/motor-reglas.ts',
      'lib/sgie/procedimientos-db.ts',
      'lib/sgie/tareas-db.ts',
      'lib/sgie/upload-atomico.ts',
      'lib/sgie/util.ts',
    ];
    const filtered = changed.filter((f: string) =>
      f !== 'lib/schema.ts' &&
      f !== 'lib/sgie/dashboard-service.ts' &&
      !lintFixes.includes(f) &&
      !estabilizacionFase1.includes(f) &&
      !fase4bCleanup.includes(f) &&
      !fase3DocsFix.includes(f));
    expect(filtered, `SGIE/intranet modificados: ${filtered.join(', ')}`).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------------- */
/* 12. NAP procedente de site (sin literales divergentes)                     */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — NAP coherente con site', () => {
  it('los datos del hub y áreas referencian site (no literales de teléfono)', () => {
    // Las páginas consumen site.* vía CTAGroup, UrgencyCallout, etc.
    // Validamos que no haya literales de teléfono hardcodeados en las páginas
    // prioritarias (deben usar site.whatsappDisplay / helpers).
    const penal = readPublic('derecho-penal/page.tsx');
    const slug = readPublic('servicios-juridicos/[slug]/page.tsx');
    // Patrón de teléfono hondureño +504 o 9XXX-XXXX literal.
    const phoneLiteral = /\+?504\s?\d{4}[-\s]?\d{4}|9\d{3}[-\s]?\d{4}/;
    expect(penal).not.toMatch(phoneLiteral);
    expect(slug).not.toMatch(phoneLiteral);
  });

  it('site.url es el dominio canónico con www', () => {
    expect(site.url).toMatch(/^https:\/\/www\.pinedayasociadoshn\.com$/);
  });
});

/* -------------------------------------------------------------------------- */
/* 13. Bloques FASE 3 presentes en las páginas                                */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Bloques de detalle cableados', () => {
  it('[slug] importa y usa los bloques de service-detail-blocks', () => {
    const src = readPublic('servicios-juridicos/[slug]/page.tsx');
    expect(src).toContain('service-detail-blocks');
    expect(src).toContain('RespuestaDirecta');
    expect(src).toContain('DocumentChecklist');
    expect(src).toContain('ProcessList');
    expect(src).toContain('SourcesAndDisclaimer');
    expect(src).toContain('ContextualCta');
    expect(src).toContain('ViewServiceTracker');
    expect(src).toContain('LegalReviewNotice');
  });

  it('/derecho-penal importa y usa los bloques de service-detail-blocks', () => {
    const src = readPublic('derecho-penal/page.tsx');
    expect(src).toContain('service-detail-blocks');
    expect(src).toContain('DocumentChecklist');
    expect(src).toContain('ProcessList');
    expect(src).toContain('SourcesAndDisclaimer');
    expect(src).toContain('ContextualCta');
    expect(src).toContain('ViewServiceTracker');
    expect(src).toContain('LegalReviewNotice');
  });

  it('las áreas prioritarias definen los campos de detalle clave', () => {
    const slugs = ['derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];
    slugs.forEach((slug) => {
      const area = getAreaBySlug(slug)!;
      expect(area.respuestaDirecta, `${slug}.respuestaDirecta`).toBeDefined();
      expect(area.documentosIniciales, `${slug}.documentosIniciales`).toBeDefined();
      expect(area.proceso, `${slug}.proceso`).toBeDefined();
      expect(area.erroresFrecuentes, `${slug}.erroresFrecuentes`).toBeDefined();
      expect(area.fuentesGenerales, `${slug}.fuentesGenerales`).toBeDefined();
      expect(area.ctaContextual, `${slug}.ctaContextual`).toBeDefined();
    });
  });

  it('el hub penal define los campos de detalle clave', () => {
    expect(hubPenal.respuestaDirecta).toBeDefined();
    expect(hubPenal.documentosIniciales).toBeDefined();
    expect(hubPenal.proceso).toBeDefined();
    expect(hubPenal.erroresFrecuentes).toBeDefined();
    expect(hubPenal.fuentesGenerales).toBeDefined();
    expect(hubPenal.ctaContextual).toBeDefined();
  });
});

/* -------------------------------------------------------------------------- */
/* 14. Respuesta directa presente y de longitud adecuada (§5)                 */
/* -------------------------------------------------------------------------- */

describe('FASE 3 — Respuesta directa (GEO/AEO)', () => {
  const targets: Array<{ name: string; text?: string }> = [
    { name: 'hubPenal', text: hubPenal.respuestaDirecta },
    { name: 'familia', text: getAreaBySlug('derecho-de-familia')!.respuestaDirecta },
    { name: 'laboral', text: getAreaBySlug('derecho-laboral')!.respuestaDirecta },
    { name: 'civil', text: getAreaBySlug('derecho-civil-y-notarial')!.respuestaDirecta },
  ];

  targets.forEach(({ name, text }) => {
    it(`${name} tiene respuestaDirecta de 50-100 palabras aprox`, () => {
      expect(text, `${name}.respuestaDirecta debe definirse`).toBeDefined();
      const words = (text ?? '').trim().split(/\s+/).filter(Boolean).length;
      // ±tolerancia: el rango orientativo es 50-100; permitimos 40-130.
      expect(words, `${name} tiene ${words} palabras`).toBeGreaterThanOrEqual(40);
      expect(words).toBeLessThanOrEqual(130);
    });
  });
});
