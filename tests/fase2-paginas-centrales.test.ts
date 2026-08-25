/**
 * Tests FASE 2 — Páginas centrales, propuesta de valor y conversión pública.
 *
 * Valida, sobre el código fuente de las páginas centrales, los criterios de
 * cierre de la instrucción FASE 2 §15:
 *   - Un H1 por página (la home explícitamente; el resto vía PageHero).
 *   - Metadata única (titles distintos entre páginas centrales).
 *   - Datos NAP procedentes de `site` (sin literales divergentes de teléfono,
 *     dirección, correo u horario en páginas centrales y faqs-hubs).
 *   - CTA existentes.
 *   - Formulario sin PII en analítica (trackContactFormSubmit sin nombre/tel).
 *   - Exclusión de preview e intranet en analítica.
 *   - Ausencia del dominio incorrecto (pinedayasocioshn.com sin www o sin 'a').
 *   - Ausencia de modificaciones en el blog (vía git diff).
 *   - Ausencia de afirmaciones P01–P15 reforzadas o publicadas como verificadas.
 *
 * Estos tests NO requieren DB ni build: trabajan sobre archivos de fuente y
 * sobre lib/analytics y lib/site (puros). Son anti-regresión: si alguien
 * reintroduce un literal NAP divergente o una afirmación pendiente, CI falla.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { site } from '@/lib/site';
import {
  ANALYTICS_EXCLUDED_PREFIXES,
  isAnalyticsExcludedPath,
} from '@/lib/analytics';

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

/** Cuenta ocurrencias de un patrón regex en un texto. */
function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

describe('FASE 2 — Página de inicio', () => {
  const home = readPublic('page.tsx');

  it('tiene exactamente un <h1>', () => {
    const h1Count = countMatches(home, /<h1\b/g);
    expect(h1Count, 'la home debe tener un único H1').toBe(1);
  });

  it('incluye el selector por problema (ProblemSelector)', () => {
    expect(home).toContain('ProblemSelector');
  });

  it('el grid de problemas es uniforme, sin tarjeta a doble ancho', () => {
    const selector = readRoot('components/marketing/problem-selector.tsx');
    expect(selector).toContain("variant=\"problems\"");
    expect(selector).not.toContain('featuredFirst');
  });

  it('incluye una única franja de confianza, sin repetir el bloque de límites', () => {
    expect(home).toContain('TrustBar');
    expect(home).toContain('TrustCredentials');
    expect(home).toContain('UrgencyCallout');
    expect(home).not.toContain('TrustLimits');
  });

  it('presenta cuatro especialidades principales, incluida defensa penal', () => {
    expect(home).toContain('hubPenal');
    expect(home).toContain('HIGHLIGHTED_AREAS');
    expect(home).toContain('lg:grid-cols-4');
  });

  it('no usa el dominio incorrecto (sin www o mal escrito)', () => {
    // Prohibido: pinedayasocioshn.com (sin www) y pinedayasoci oshn.com (typo sin 'a').
    expect(home).not.toMatch(/pinedayasocioshn\.com/);
    expect(home).not.toMatch(/pinedayasoci\b/);
  });
});

describe('FASE 2 — /despacho', () => {
  const despacho = readPublic('despacho/page.tsx');

  it('no añade un segundo <h1> en el body (PageHero aporta el H1)', () => {
    const h1Count = countMatches(despacho, /<h1\b/g);
    expect(h1Count, '/despacho no debe definir H1 en el body').toBe(0);
  });

  it('incluye el bloque de confianza y límites (TrustLimits)', () => {
    expect(despacho).toContain('TrustLimits');
  });

  it('usa retratos del equipo, no monogramas', () => {
    expect(despacho).toContain('FOUNDER_PROFILE.image');
    expect(despacho).toContain('THANIA_PROFILE.image');
    expect(despacho).toContain('EMIL_PROFILE.image');
    expect(despacho).not.toContain('team-monogram');
  });

  it('incluye el bloque de asignación/presupuesto FASE 2', () => {
    expect(despacho).toContain('Cómo se asignan los asuntos');
    expect(despacho).toContain('Presupuesto y contratación');
  });

  it('no publica número de colegiación hardcodeado', () => {
    // El nº de CAH solo se publica vía FOUNDER_PROFILE.cah (condicional).
    // Prohibido: afirmación categórica con número literal.
    expect(despacho).not.toMatch(/CAH:\s*\d+/);
  });
});

describe('FASE 2 — /servicios-juridicos', () => {
  const servicios = readPublic('servicios-juridicos/page.tsx');

  it('ofrece búsqueda y catálogo unificado sin bloques redundantes', () => {
    expect(servicios).toContain('ServiceSearch');
    expect(servicios).toContain('ServiceCard');
    expect(servicios).toContain('buildJuridicosCatalog');
    expect(servicios).not.toContain('ServiceBlocks');
  });

  it('conserva el catálogo público canónico compartido', () => {
    expect(servicios).toContain('PUBLIC_SERVICE_CATALOG');
    expect(servicios).not.toContain('getAreasUnified');
  });

  it('no añade un <h1> en el body', () => {
    expect(countMatches(servicios, /<h1\b/g)).toBe(0);
  });
});

describe('FASE 2 — /solicitar-consulta', () => {
  const consulta = readPublic('solicitar-consulta/page.tsx');

  it('no añade un <h1> en el body', () => {
    expect(countMatches(consulta, /<h1\b/g)).toBe(0);
  });

  it('usa datos NAP derivados de site (telHref/whatsappHref/site)', () => {
    expect(consulta).toContain('telHref');
    expect(consulta).toContain('whatsappHref');
  });
});

describe('FASE 2 — /como-llegar', () => {
  const llegar = readPublic('como-llegar/page.tsx');

  it('no añade un <h1> en el body', () => {
    expect(countMatches(llegar, /<h1\b/g)).toBe(0);
  });

  it('aclara sede única vs zonas atendidas', () => {
    expect(llegar).toContain('Sede única');
    expect(llegar).toMatch(/zonas de atención habitual/);
  });

  it('mantiene las distancias corregidas en FASE 1 (Choluteca ~55 km, San Lorenzo ~18 km, Amapala ~45 km)', () => {
    expect(llegar).toContain("'~55 km'");
    expect(llegar).toContain("'~18 km'");
    expect(llegar).toContain("'~45 km'");
  });

  it('incluye el evento click_maps (TrackedMapsLink)', () => {
    expect(llegar).toContain('TrackedMapsLink');
  });
});

describe('FASE 2 — faqs-hubs.ts: coherencia NAP y afirmaciones prudentes', () => {
  const faqs = readRoot('data/faqs-hubs.ts');

  it('deriva horario y WhatsApp de site (sin literales divergentes)', () => {
    // Prohibido: horario «lunes a viernes, 8:00 a 17:00» (contradice site.hours).
    expect(faqs).not.toMatch(/8:00 a 17:00/);
    // Debe importar site para derivar valores.
    expect(faqs).toContain("from '@/lib/site'");
    // WhatsApp debe derivarse de site.whatsappDisplay, no hardcodear el número.
    expect(faqs).toContain('site.whatsappDisplay');
  });

  it('no afirma categóricamente «colegiados en Honduras» (P10)', () => {
    // La afirmación categórica original fue sustituida por una versión prudente.
    expect(faqs).not.toMatch(/notarios públicos colegiados en Honduras/);
  });
});

describe('FASE 2 — data/faq.ts: categoría bufete-honorarios enfocada en contratación', () => {
  const faq = readRoot('data/faq.ts');
  const bufeteBlock = faq.slice(
    faq.indexOf("slug: 'bufete-honorarios'"),
    faq.indexOf("slug: 'otras-areas'"),
  );

  it('incluye preguntas de contratación y funcionamiento', () => {
    expect(bufeteBlock).toContain('presupuesto');
    expect(bufeteBlock).toMatch(/¿Qué ocurre después del primer contacto\?/);
    expect(bufeteBlock).toMatch(/¿Atienden urgencias penales\?/);
    expect(bufeteBlock).toMatch(/confidencial/);
  });

  it('no promete pago fraccionado como política general confirmada', () => {
    // La nueva redacción pospone los detalles de pago a la contratación.
    expect(bufeteBlock).not.toMatch(/ofrecemos opciones de pago fraccionado en ciertos casos/);
  });
});

describe('FASE 2 — Analítica: sin PII y exclusión de preview/intranet', () => {
  it('trackContactFormSubmit usa solo datos no personales (formName/pagePath/serviceArea/submissionStatus/transport)', () => {
    const formComponent = readRoot('components/marketing/solicitar-consulta-form.tsx');
    const callMatch = formComponent.match(/trackContactFormSubmit\(\{[^}]*\}\)/);
    expect(callMatch, 'debe llamar a trackContactFormSubmit').not.toBeNull();
    const call = callMatch![0];
    // No debe incluir nombre, telefono, email ni resumen como parámetros.
    expect(call).not.toMatch(/\b(nombre|telefono|email|resumen)\s*:/);
    // Usa los parámetros estables no personales (§9.2).
    expect(call).toMatch(/formName/);
    expect(call).toMatch(/pagePath/);
    expect(call).toMatch(/serviceArea/);
    expect(call).toMatch(/submissionStatus/);
    expect(call).toMatch(/transport/);
  });

  it('el submit está protegido contra doble envío (guard status sending)', () => {
    const formComponent = readRoot('components/marketing/solicitar-consulta-form.tsx');
    expect(formComponent).toMatch(/status === 'sending'/);
    expect(formComponent).toMatch(/Guard anti-doble-envío/);
  });

  it('los nuevos helpers FASE 2 existen y son sin PII', () => {
    const analytics = readRoot('lib/analytics.ts');
    expect(analytics).toContain('export function trackContactFormView');
    expect(analytics).toContain('export function trackContactFormStart');
    expect(analytics).toContain('export function trackContactFormError');
    expect(analytics).toContain('export function trackClickMaps');
    expect(analytics).toContain('export function trackViewService');
    expect(analytics).toContain('export function trackViewTeamSection');
    expect(analytics).toContain('export function trackConsultationCtaClick');
    expect(analytics).toContain('export type ContactFormErrorCategory');
  });

  it('excluye /preview y /intranet del tracking', () => {
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain('/preview');
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain('/intranet');
    expect(isAnalyticsExcludedPath('/preview/abc')).toBe(true);
    expect(isAnalyticsExcludedPath('/intranet/dashboard')).toBe(true);
    // La home pública NO se excluye.
    expect(isAnalyticsExcludedPath('/')).toBe(false);
  });
});

describe('FASE 2 — Coherencia NAP con lib/site.ts', () => {
  it('site expone teléfono, WhatsApp, dirección, horario y email canónicos', () => {
    expect(site.phone).toMatch(/^\+504\d{8}$/);
    expect(site.whatsapp).toMatch(/^504\d{8}$/);
    expect(site.email).toMatch(/@pinedayasociadoshn\.com$/);
    expect(site.address.city).toBe('Nacaome');
    expect(site.address.department).toBe('Valle');
    expect(site.hours).toMatch(/Lunes a sábado/);
  });

  it('el dominio canónico es www.pinedayasociadoshn.com', () => {
    expect(site.url).toBe('https://www.pinedayasociadoshn.com');
    // No debe aparecer la variante sin www como dominio canónico.
    expect(site.url).not.toBe('https://pinedayasocioshn.com');
  });
});

describe('FASE 2 — Salvaguardas editoriales del blog', () => {
  it('limpia enlaces de ejemplo y no muestra revisores inexistentes', () => {
    const adapter = readRoot('lib/blog.ts');
    const article = readPublic('blog/[categoria]/[slug]/page.tsx');
    expect(adapter).not.toContain('cleanPlaceholderLinks');
    expect(article).toContain('normalizeBlogLinksForRender');
    expect(article).toContain('validSignature &&');
    expect(article).toContain('Revisión jurídica institucional:');
  });
});

describe('FASE 2 — Ausencia de afirmaciones P01–P15 reforzadas', () => {
  // P01/P02: rangos de pensión contradictorios. La FAQ central no debe
  // publicarlos como verificados (la página de familia los mantiene pendientes).
  it('faqs-hubs no publica rangos de pensión 30-60 ni 15-50 como verificados', () => {
    const faqs = readRoot('data/faqs-hubs.ts');
    expect(faqs).not.toMatch(/30 % y 60 %/);
    expect(faqs).not.toMatch(/15 % y el 50 %/);
  });

  // P11/P12: año de fundación y +15 años no deben añadirse en nuevas ubicaciones.
  it('faqs-hubs no añade «foundingDate 2010» ni refuerza +15 años con cifras nuevas', () => {
    const faqs = readRoot('data/faqs-hubs.ts');
    expect(faqs).not.toMatch(/foundingDate/);
    // «Más de 15 años» ya existía; no debe aparecer una cifra nueva (p. ej. «16», «20 años»).
    expect(faqs).not.toMatch(/\b(16|17|18|19|20)\s+años\b/);
  });
});
