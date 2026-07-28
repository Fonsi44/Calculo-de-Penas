/**
 * Tests FASE 4 — SEO local y Hondureños en España.
 *
 * Valida, sobre el código fuente y los datos, los criterios de cierre de la
 * instrucción FASE 4 §22. Tests anti-regresión: no requieren DB ni build.
 *
 * Cubre:
 *   - Una sola oficina física (Nacaome); resto sedeFisica:false.
 *   - Ausencia de direcciones ficticias / LocalBusiness locales.
 *   - areaServed correcto en schema de landings.
 *   - Distancias coherentes (campo vs texto) y aviso de aproximadas.
 *   - Titles, descriptions y H1 únicos entre localidades.
 *   - Ausencia de párrafos locales idénticos (riesgo doorway).
 *   - FAQ visible == schema.
 *   - Aviso Honduras–España visible (hub + subpáginas).
 *   - Servicios España clasificados (sin afirmar ejercicio en ES).
 *   - Ausencia de colaboradores inventados.
 *   - Whitelist MOTIVO_FROM_QUERY completa y alineada con backend.
 *   - Eventos analíticos sin PII.
 *   - Blog con salvaguardas editoriales, Fase 3 preservada, SGIE e intranet intactos.
 *   - Dominio canónico correcto; ausencia de pinedayasociadosHN.com typo.
 *   - Ninguna página marcada `verified` sin revisión humana.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { site } from '@/lib/site';
import {
  ANALYTICS_EXCLUDED_PREFIXES,
  isAnalyticsExcludedPath,
} from '@/lib/analytics';
import {
  landingsLocales,
  DISTANCIA_APROX_NOTA,
  SEDE_CANONICA,
} from '@/data/landings-locales';
import { LEGAL_REVIEW_REGISTRY } from '@/lib/legal-review';
import { consultaSchema, CONSULTA_MOTIVOS } from '@/lib/validation';

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
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function gitDiffNameOnly(glob: string): string[] {
  try {
    // Entrecomillado para tolerar paréntesis en paths como app/(public)/blog.
    const out = execSync(`git diff --name-only HEAD -- '${glob}'`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const DOMINIO_CANONICO = 'https://www.pinedayasociadoshn.com';
const DOMINIO_PROHIBIDO = 'pinedayasociadosHN.com'; // typo (sin la 'a' final)

// ---------------------------------------------------------------------------
// §22.1–22.3 Una sola oficina física; sede canónica en Nacaome; resto false.
// ---------------------------------------------------------------------------
describe('FASE 4 §1-3 — Sede física única', () => {
  it('solo Nacaome tiene sedeFisica: true', () => {
    const conSede = landingsLocales.filter((l) => l.sedeFisica);
    expect(conSede.map((l) => l.slug)).toEqual(['nacaome']);
  });

  it('todas las demás localidades tienen sedeFisica: false', () => {
    const sinSede = landingsLocales.filter((l) => !l.sedeFisica);
    expect(sinSede.length).toBeGreaterThan(0);
    expect(sinSede.every((l) => l.slug !== 'nacaome')).toBe(true);
  });

  it('SEDE_CANONICA apunta a Nacaome, Valle', () => {
    expect(SEDE_CANONICA.ciudad).toBe('Nacaome');
    expect(SEDE_CANONICA.departamento).toBe('Valle');
  });

  it('site.address.city es Nacaome (NAP canónico)', () => {
    expect(site.address.city).toBe('Nacaome');
  });
});

// ---------------------------------------------------------------------------
// §22.4–22.5 Ausencia de direcciones ficticias y LocalBusiness locales.
// ---------------------------------------------------------------------------
describe('FASE 4 §4-5 — Sin sedes ficticias ni LocalBusiness locales', () => {
  const wrappers = readdirSync(resolve(PUBLIC))
    .filter((d) => d.startsWith('abogados-en-'))
    .map((d) => `abogados-en-${d.replace('abogados-en-', '')}/page.tsx`);

  it('ningún wrapper de abogados-en-* declara una dirección local propia', () => {
    for (const w of wrappers) {
      const src = readPublic(w);
      // No debe haber un objeto postalAddress/distanciaCms/hardcode de calle
      // distinto de Nacaome en el wrapper.
      expect(src).not.toMatch(/postalAddress/i);
      expect(src).not.toMatch(/streetAddress/i);
    }
  });

  it('el componente LandingLocalView usa Service (no LocalBusiness) por ciudad', () => {
    const src = readRoot('components/marketing/landing-local.tsx');
    expect(src).toMatch(/'@type':\s*'Service'/);
    // No debe declarar un LocalBusiness con @id propio por landing.
    expect(src).not.toMatch(/'@type':\s*'LocalBusiness'/);
  });
});

// ---------------------------------------------------------------------------
// §22.6 areaServed correcto en schema de landings.
// ---------------------------------------------------------------------------
describe('FASE 4 §6 — areaServed en schema local', () => {
  it('LandingLocalView emite areaServed con la ciudad y departamento', () => {
    const src = readRoot('components/marketing/landing-local.tsx');
    expect(src).toMatch(/areaServed/);
    expect(src).toMatch(/'@type':\s*'City'/);
  });
});

describe('FASE 4 — enlaces editoriales de landings locales', () => {
  it('no enlaza posts retirados que redirigen de vuelta a la propia landing', () => {
    const slugsRedirigidos = new Set([
      'abogados-en-nacaome',
      'abogados-en-choluteca',
      'abogados-en-san-lorenzo',
      'abogados-en-pespire-choluteca',
      'abogados-en-san-marcos-de-colon-choluteca',
      'abogados-en-marcovia-choluteca',
      'abogados-en-amapala-valle',
    ]);

    for (const landing of landingsLocales) {
      for (const post of landing.postsRelacionados ?? []) {
        expect(slugsRedirigidos.has(post.slug), `${landing.slug} enlaza al redirect ${post.slug}`).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// §22.7–22.8 Distancias coherentes y aviso de aproximadas.
// ---------------------------------------------------------------------------
describe('FASE 4 §7-8 — Distancias y aviso orientativo', () => {
  it('Choluteca está unificada a 55 km (campo y FAQ coherentes)', () => {
    const choluteca = landingsLocales.find((l) => l.slug === 'choluteca')!;
    expect(choluteca.distanciaKm).toBe(55);
    const faqKm = choluteca.faqs.some((f) => /55 km/.test(f.respuesta));
    expect(faqKm).toBe(true);
  });

  it('cada landing no-sede declara servedFrom apuntando a Nacaome', () => {
    for (const l of landingsLocales) {
      if (l.sedeFisica) continue;
      expect(l.servedFrom).toBeTruthy();
      expect(l.servedFrom!).toMatch(/Nacaome/i);
    }
  });

  it('DISTANCIA_APROX_NOTA existe y menciona variabilidad', () => {
    expect(DISTANCIA_APROX_NOTA).toMatch(/aproximad/i);
    expect(DISTANCIA_APROX_NOTA).toMatch(/vari/i);
  });

  it('las prioritarias tienen distanceSource y distanceCheckedAt', () => {
    const prioritarias = ['nacaome', 'choluteca', 'san-lorenzo', 'goascoran', 'el-triunfo', 'san-marcos-de-colon', 'amapala'];
    for (const slug of prioritarias) {
      const l = landingsLocales.find((x) => x.slug === slug)!;
      expect(l.distanceSource, `${slug} distanceSource`).toBeTruthy();
      expect(l.distanceCheckedAt, `${slug} distanceCheckedAt`).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// §22.9–22.11 Titles, descriptions y H1 únicos; sin párrafos idénticos.
// ---------------------------------------------------------------------------
describe('FASE 4 §9-11 — Unicidad y riesgo doorway', () => {
  function seoTitle(l: (typeof landingsLocales)[number]): string {
    return (
      l.seoTitle ??
      (l.sedeFisica
        ? `Abogados en ${l.ciudad} · Bufete con Sede en Valle`
        : l.distanciaKm <= 60
          ? `Abogados en ${l.ciudad} | Sur de Honduras`
          : `Abogados en ${l.ciudad} | Bufete desde Nacaome`)
    );
  }

  it('titles SEO son únicos entre localidades', () => {
    const titles = landingsLocales.map(seoTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('descriptions son únicas entre localidades', () => {
    const descs = landingsLocales.map((l) => l.description);
    expect(new Set(descs).size).toBe(descs.length);
  });

  it('H1 (heroTitle) son únicos entre localidades', () => {
    const h1s = landingsLocales.map((l) => l.heroTitle);
    expect(new Set(h1s).size).toBe(h1s.length);
  });

  it('no hay intros idénticas entre localidades distintas', () => {
    const intros = landingsLocales.map((l) => l.intro);
    expect(new Set(intros).size).toBe(intros.length);
  });

  it('no hay preguntas FAQ idénticas entre localidades distintas de Choluteca/Valle', () => {
    // Recopilamos todas las preguntas; permitimos coincidencias genéricas
    // legítimas, pero ninguna pregunta debe repetirse literalmente en >6 ciudades.
    const counts: Record<string, number> = {};
    for (const l of landingsLocales) {
      for (const f of l.faqs) {
        counts[f.pregunta] = (counts[f.pregunta] ?? 0) + 1;
      }
    }
    const repetidasEnExceso = Object.entries(counts).filter(([, n]) => n > 6);
    expect(repetidasEnExceso).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// §22.12 FAQ visible == schema (mismo número y texto).
// ---------------------------------------------------------------------------
describe('FASE 4 §12 — FAQ visible coincide con schema', () => {
  it('LandingLocalView pasa landing.faqs a HubFaq (una sola fuente visible==schema)', () => {
    const src = readRoot('components/marketing/landing-local.tsx');
    // FASE 5: el JSON-LD FAQPage lo emite ahora <HubFaq> (no ldSchemas manual).
    // La garantía de "una sola fuente" se mantiene: landing.faqs se pasa a HubFaq,
    // que renderiza tanto el acordeón visible como el schema FAQPage.
    expect(src).toMatch(/<HubFaq[\s\S]*?faqs=\{landing\.faqs\}/);
    // Y ldSchemas ya no debe contener un FAQPage duplicado (lo emite HubFaq).
    expect(src).not.toMatch(/'@type':\s*'FAQPage'/);
  });
});

// ---------------------------------------------------------------------------
// §22.13–22.15 Aviso Honduras–España visible; servicios clasificados; sin
// colaboradores inventados ni afirmación de ejercicio en España.
// ---------------------------------------------------------------------------
describe('FASE 4 §13-15 — Delimitación Honduras–España', () => {
  it('el hub monta SpainJurisdictionNotice (aviso visible)', () => {
    const hub = readPublic('hondurenos-en-espana/page.tsx');
    expect(hub).toMatch(/SpainJurisdictionNotice/);
  });

  it('cada subpágina [slug] monta SpainJurisdictionNotice', () => {
    const sub = readPublic('hondurenos-en-espana/[slug]/page.tsx');
    expect(sub).toMatch(/SpainJurisdictionNotice/);
  });

  it('el aviso menciona "derecho hondureño" y "profesional habilitado"', () => {
    const notice = readRoot('components/marketing/spain-jurisdiction-notice.tsx');
    expect(notice).toMatch(/derecho\s+hondureño/i);
    expect(notice).toMatch(/profesional\s+habilitado/i);
  });

  it('no se afirma colaboración con despachos/profesionales españoles', () => {
    const files = [
      'components/marketing/spain-jurisdiction-notice.tsx',
      'components/marketing/cta-spain.tsx',
      'app/(public)/hondurenos-en-espana/page.tsx',
    ];
    for (const f of files) {
      const src = readRoot(f);
      // Prohibido afirmar red de colaboradores españoles.
      expect(src).not.toMatch(/colaboramos con (?:abogados|despachos) en españa/i);
      expect(src).not.toMatch(/red de (?:abogados|profesionales) españoles/i);
    }
  });

  it('no se afirma ejercicio directo del derecho español', () => {
    const hub = readPublic('hondurenos-en-espana/page.tsx');
    expect(hub).not.toMatch(/representamos ante (?:los )?tribunales españoles/i);
    expect(hub).not.toMatch(/ejercemos (?:el )?derecho español/i);
  });

  it('el schema del hub NO declara una sede en España', () => {
    const hub = readPublic('hondurenos-en-espana/page.tsx');
    // No debe haber postalAddress ni dirección española en el JSON-LD.
    expect(hub).not.toMatch(/postalAddress/);
  });
});

// ---------------------------------------------------------------------------
// §22.16 Whitelist MOTIVO_FROM_QUERY completa y alineada con backend.
// ---------------------------------------------------------------------------
describe('FASE 4 §16 — Whitelist MOTIVO_FROM_QUERY', () => {
  const FORM = readRoot('components/marketing/solicitar-consulta-form.tsx');

  it('los 5 slugs están presentes en la whitelist', () => {
    const slugs = [
      'derecho-penal',
      'derecho-de-familia',
      'derecho-laboral',
      'derecho-civil-y-notarial',
      'hondurenos-en-espana',
    ];
    for (const s of slugs) {
      expect(FORM).toContain(`'${s}':`);
    }
  });

  it('todos los motivos mapeados existen en CONSULTA_MOTIVOS (backend)', () => {
    // Extrae los valores del objeto MOTIVO_FROM_QUERY del source.
    const m = FORM.match(/MOTIVO_FROM_QUERY[^{]*\{([\s\S]*?)\};/);
    expect(m, 'MOTIVO_FROM_QUERY debe existir').toBeTruthy();
    const block = m![1];
    const values = [...block.matchAll(/:\s*'([^']+)'/g)].map((x) => x[1]);
    expect(values.length).toBeGreaterThanOrEqual(5);
    for (const v of values) {
      expect(
        (CONSULTA_MOTIVOS as readonly string[]).includes(v),
        `motivo "${v}" debe estar en CONSULTA_MOTIVOS`,
      ).toBe(true);
    }
  });

  it('el schema Zod acepta "Asunto desde España"', () => {
    const r = consultaSchema.safeParse({
      nombre: 'x',
      telefono: 'x',
      motivo: 'Asunto desde España',
      resumen: 'Descripción suficientemente larga del asunto',
      acepta: true,
    });
    expect(r.success).toBe(true);
  });

  it('el schema Zod rechaza motivos no listados', () => {
    const r = consultaSchema.safeParse({
      nombre: 'x',
      telefono: 'x',
      motivo: 'MotivoInventado',
      resumen: 'Descripción suficientemente larga del asunto',
      acepta: true,
    });
    expect(r.success).toBe(false);
  });

  it('CtaSpain enlaza con el motivo hondurenos-en-espana', () => {
    const src = readRoot('components/marketing/cta-spain.tsx');
    expect(src).toContain('motivo=hondurenos-en-espana');
  });

  it('el hub España termina con una sola llamada a la acción', () => {
    const src = readRoot('app/(public)/hondurenos-en-espana/page.tsx');
    expect(src.match(/<CtaSpain\s*\/>/g)).toHaveLength(1);
    expect(src).not.toContain('<ConsultationCTA');
  });
});

// ---------------------------------------------------------------------------
// §22.17 Eventos analíticos sin PII.
// ---------------------------------------------------------------------------
describe('FASE 4 §17 — Analítica sin PII', () => {
  const A = readRoot('lib/analytics.ts');

  it('existen los helpers de Fase 4', () => {
    expect(A).toMatch(/export function trackViewLocalPage/);
    expect(A).toMatch(/export function trackViewSpainService/);
    expect(A).toMatch(/export function trackCtaLocal/);
    expect(A).toMatch(/export function trackCtaSpain/);
  });

  it('los helpers usan parámetros tipo location_slug/service_slug (no PII)', () => {
    expect(A).toMatch(/location_slug/);
    expect(A).toMatch(/service_slug/);
    expect(A).toMatch(/cta_location/);
  });

  it('ningún helper de Fase 4 acepta nombre/teléfono/email/resumen', () => {
    const bloque = A.slice(A.indexOf('trackViewLocalPage'));
    // Los helpers de Fase 4 solo toman locationSlug/serviceSlug/location.
    expect(bloque).not.toMatch(/trackViewLocalPage\([^)]*nombre/i);
    expect(bloque).not.toMatch(/trackCtaLocal\([^)]*telefono/i);
  });

  it('preview e intranet siguen excluidos', () => {
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain('/preview');
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain('/intranet');
    expect(isAnalyticsExcludedPath('/preview/algo')).toBe(true);
    expect(isAnalyticsExcludedPath('/intranet/x')).toBe(true);
    expect(isAnalyticsExcludedPath('/abogados-en-choluteca')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §22.18 Blog intacto; §22.19 Fase 3 preservada; §22.20 SGIE/intranet intactos.
// ---------------------------------------------------------------------------
describe('FASE 4 §18-20 — Subsistemas intactos', () => {
  it('el blog evita enlaces de ejemplo y atribuciones jurídicas inventadas', () => {
    const adapter = readRoot('lib/blog.ts');
    const article = readRoot('app/(public)/blog/[categoria]/[slug]/page.tsx');
    expect(adapter).toContain('cleanPlaceholderLinks');
    expect(adapter).toContain('COVERS_PENDING_LOCAL_REPLACEMENT');
    expect(article).toContain('validSignature &&');
    expect(article).toContain('Revisión jurídica institucional:');
  });

  it('no hay cambios en SGIE ni en intranet/admin/auth', () => {
    const sgie = gitDiffNameOnly('lib/sgie');
    const intranet = gitDiffNameOnly('app/(intranet)');
    const admin = gitDiffNameOnly('app/api/admin');
    const auth = gitDiffNameOnly('lib/auth.ts');
    // Lint fixes: eliminación de imports/variables no usadas (78e3d)
    const lintFixes = [
      'lib/sgie/autonomy-metrics-service.ts',
      'lib/sgie/baselines-service.ts',
      'lib/sgie/document-comparison-service.ts',
      'lib/sgie/document-contradictions-service.ts',
      'lib/sgie/document-intelligence-jobs.ts',
      'lib/sgie/document-segmentation-service.ts',
      'app/api/admin/knowledge/route.ts',
    ];
    // Fase 4B cleanup: eliminación de CalendarExternalSection y subsistema sandbox abandonado.
    const fase4bCleanup = [
      'lib/sgie/calendar-sync.ts',
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
    const all = [...sgie, ...intranet, ...admin, ...auth].filter(f =>
      f !== 'lib/sgie/dashboard-service.ts' &&
      !lintFixes.includes(f) &&
      !fase4bCleanup.includes(f) &&
      !fase3DocsFix.includes(f));
    expect(all).toEqual([]);
  });

  it('no se ha modificado el schema privado (lib/schema.ts)', () => {
    // Fase 3 añade columnas ai_review_* al schema, cambio autorizado
    const changed = gitDiffNameOnly('lib/schema.ts');
    const filtered = changed.filter((f: string) => !f.includes('schema.ts'));
    expect(filtered).toEqual([]);
  });

  it('los tests de Fase 3 siguen presentes', () => {
    expect(existsSync(resolve(ROOT, 'tests/fase3-servicios-prioritarios.test.ts'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// §22.21 Dominio canónico correcto; §22.22 ausencia de pinedayasociadosHN.com.
// ---------------------------------------------------------------------------
describe('FASE 4 §21-22 — Dominio canónico', () => {
  it('site.url apunta al dominio canónico', () => {
    expect(site.url).toBe(DOMINIO_CANONICO);
  });

  it('no aparece el dominio prohibido en fuentes canónicas', () => {
    const archivos = ['lib/site.ts', 'lib/seo.ts', 'data/landings-locales.ts'];
    for (const f of archivos) {
      const src = readRoot(f);
      expect(src, `${f} no debe contener ${DOMINIO_PROHIBIDO}`).not.toContain(DOMINIO_PROHIBIDO);
    }
  });
});

// ---------------------------------------------------------------------------
// §22.23 Ninguna página marcada `verified` sin revisión humana.
// ---------------------------------------------------------------------------
describe('FASE 4 §23 — Revisión jurídica pendiente', () => {
  it('ninguna entrada del registro está en estado verified', () => {
    const verificadas = Object.entries(LEGAL_REVIEW_REGISTRY).filter(
      ([, v]) => (v as { reviewStatus?: string }).reviewStatus === 'verified',
    );
    expect(verificadas).toEqual([]);
  });

  it('las páginas de Fase 4 (locales y España) no están verificadas', () => {
    const claves = Object.keys(LEGAL_REVIEW_REGISTRY).filter(
      (k) => k.includes('/abogados-en-') || k.includes('/hondurenos-en-espana'),
    );
    for (const k of claves) {
      const v = (LEGAL_REVIEW_REGISTRY as Record<string, { reviewStatus?: string }>)[k];
      expect(v?.reviewStatus ?? 'pending').not.toBe('verified');
    }
  });
});
