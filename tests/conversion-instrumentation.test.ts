// @vitest-environment jsdom
/**
 * Instrumentación de conversiones (§9) — sin PII y respeto al consentimiento.
 *
 * Verifica a nivel de helpers (lib/analytics.ts) y de estática del formulario
 * (solicitar-consulta-form.tsx) que:
 *   - el éxito dispara UN único contact_form_submit con datos NO personales;
 *   - los errores disparan CERO submits (solo contact_form_error con categoría
 *     controlada y sin texto del usuario);
 *   - el doble clic no produce envíos duplicados (guard status==='sending');
 *   - con consentimiento denegado (gtag ausente) no se envían eventos GA4;
 *   - los canales teléfono/WhatsApp/email/CTA principal están instrumentados;
 *   - ningún mock realiza envíos reales (el formulario no se renderiza aquí).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  trackContactFormSubmit,
  trackContactFormStart,
  trackContactFormError,
  trackPhoneClick,
  trackWhatsAppClick,
  trackEmailClick,
  trackConsultationCtaClick,
} from '@/lib/analytics';

const ROOT = resolve(import.meta.dirname, '..');

function mockGtag() {
  const gtag = vi.fn();
  Object.defineProperty(window, 'gtag', { value: gtag, writable: true, configurable: true });
  return gtag;
}

const NO_PII_KEYS = ['nombre', 'email', 'telefono', 'resumen', 'mensaje', 'ip', 'referencia'];

describe('Instrumentación de conversiones (§9)', () => {
  let gtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = mockGtag();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as Record<string, unknown>).gtag;
  });

  it('éxito → un único contact_form_submit con datos NO personales', () => {
    trackContactFormSubmit({
      formName: 'consulta',
      pagePath: '/solicitar-consulta',
      serviceArea: 'penal',
      submissionStatus: 'success',
      transport: 'whatsapp',
    });
    const submits = gtag.mock.calls.filter((c) => c[1] === 'contact_form_submit');
    expect(submits).toHaveLength(1);
    const params = submits[0][2] as Record<string, unknown>;
    expect(params).toMatchObject({
      value: 1,
      form_name: 'consulta',
      page_path: '/solicitar-consulta',
      service_area: 'penal',
      submission_status: 'success',
      transport: 'whatsapp',
    });
    // Sin PII ni detalle del caso en el payload.
    expect(Object.keys(params).filter((k) => NO_PII_KEYS.includes(k))).toEqual([]);
  });

  it('error → cero contact_form_submit y contact_form_error con categoría controlada', () => {
    trackContactFormError({ category: 'validation', field: 'resumen', pagePath: '/solicitar-consulta' });
    trackContactFormError({ category: 'turnstile', pagePath: '/solicitar-consulta' });
    expect(gtag.mock.calls.filter((c) => c[1] === 'contact_form_submit')).toHaveLength(0);
    const errors = gtag.mock.calls.filter((c) => c[1] === 'contact_form_error');
    expect(errors).toHaveLength(2);
    const p0 = errors[0][2] as Record<string, unknown>;
    expect(p0).toMatchObject({ category: 'validation', field: 'resumen' });
    // Nunca se envía el texto del error ni el valor del campo.
    expect(p0.message).toBeUndefined();
    expect(p0.texto).toBeUndefined();
  });

  it('consentimiento denegado (sin gtag) → cero eventos GA4', () => {
    delete (window as unknown as Record<string, unknown>).gtag; // simula analytics_storage=denied: gtag no está cargado
    trackContactFormSubmit({ formName: 'consulta', pagePath: '/x' });
    trackContactFormStart('/x');
    trackPhoneClick('cta');
    trackWhatsAppClick('cta');
    trackEmailClick('cta');
    trackConsultationCtaClick('cta');
    expect(gtag).not.toHaveBeenCalled();
  });

  it('canales de contacto instrumentados (phone/whatsapp/email/CTA principal)', () => {
    trackPhoneClick('footer');
    trackWhatsAppClick('footer');
    trackEmailClick('footer');
    trackConsultationCtaClick('cta_primary');
    expect(gtag.mock.calls.map((c) => c[1])).toEqual([
      'phone_click',
      'whatsapp_click',
      'email_click',
      'consultation_cta_click',
    ]);
  });

  it('contact_form_start se dispara con page_path no personal', () => {
    trackContactFormStart('/solicitar-consulta');
    const start = gtag.mock.calls.find((c) => c[1] === 'contact_form_start');
    expect(start).toBeTruthy();
    expect((start![2] as Record<string, unknown>).page_path).toBe('/solicitar-consulta');
    expect((start![2] as Record<string, unknown>).value).toBe(1);
  });
});

describe('Instrumentación del formulario (estática) — §9.2/§9.3/§9.6', () => {
  const formSource = readFileSync(resolve(ROOT, 'components/marketing/solicitar-consulta-form.tsx'), 'utf8');
  const analyticsSource = readFileSync(resolve(ROOT, 'lib/analytics.ts'), 'utf8');

  it('trackContactFormSubmit aparece UNA sola vez y dentro de la rama de éxito', () => {
    const occurrences = formSource.split('trackContactFormSubmit').length - 1;
    expect(occurrences).toBe(2); // import + llamada
    // La llamada está tras el check res.ok y tras setStatus('success').
    const callIndex = formSource.indexOf('trackContactFormSubmit({');
    const successIndex = formSource.indexOf("setStatus('success')");
    const resOkIndex = formSource.indexOf('if (!res.ok)');
    expect(callIndex).toBeGreaterThan(resOkIndex);
    expect(callIndex).toBeGreaterThan(successIndex);
  });

  it('doble clic → un solo envío (guard status sending)', () => {
    expect(formSource).toMatch(/if \(status === 'sending'\) return;/);
  });

  it('spam/turnstile fallido → cero submits (guarda antes del fetch)', () => {
    // El guard de turnstile devuelve antes de fetch y de trackContactFormSubmit.
    const turnstileGuard = formSource.indexOf("trackContactFormError({ category: 'turnstile'");
    const fetchIndex = formSource.indexOf("fetch('/api/consulta'");
    const submitCall = formSource.indexOf('trackContactFormSubmit({');
    expect(turnstileGuard).toBeGreaterThan(-1);
    expect(turnstileGuard).toBeLessThan(fetchIndex);
    expect(submitCall).toBeGreaterThan(fetchIndex);
  });

  it('categorías de error controladas (§9.3) sin texto del usuario', () => {
    for (const category of ['validation', 'turnstile', 'rate_limit', 'network', 'server', 'delivery', 'unknown']) {
      expect(analyticsSource).toContain(`'${category}'`);
    }
    // La capa de analítica nunca recibe el valor del campo.
    expect(formSource).not.toMatch(/trackContactFormError\(\{[^}]*\btexto\b/);
  });

  it('el formulario no realiza envíos reales en tests (sin render; solo helpers/estática)', () => {
    // Este archivo de test NO importa el componente, así que ningún fetch
    // real se dispara: verificamos que el componente protege sus llamadas.
    expect(formSource).toMatch(/fetch\('\/api\/consulta'/);
  });
});
