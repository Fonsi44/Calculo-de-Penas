'use client';

/**
 * Capa de analítica (GA4) — helpers de tracking y diagnóstico.
 *
 * Esta capa es la ÚNICA fuente de verdad para:
 *   - Envío de eventos a gtag (trackEvent + helpers por tipo).
 *   - Lista de rutas PRIVADAS excluidas de tracking (isAnalyticsExcludedPath).
 *   - Modo de diagnóstico local (isAnalyticsDebugEnabled + debugAnalytics).
 *
 * Reglas (AGENTS.md §3, §6):
 *   - El Measurement ID (NEXT_PUBLIC_GA_ID, formato G-XXXX) se gestiona en
 *     `lib/site.ts` y se renderiza solo en el layout público. Aquí no se
 *     hardcodea ningún ID.
 *   - El Property ID numérico (GOOGLE_ANALYTICS_PROPERTY_ID) es server-side
 *     (GA4 Data API) y NUNCA debe exponerse en cliente ni usarse como gaId.
 *   - Los logs de diagnóstico solo se emiten fuera de producción y con la
 *     variable explícita NEXT_PUBLIC_ANALYTICS_DEBUG=true activada.
 */

type EventParams = Record<string, string | number | boolean>;

/** Valida un Measurement ID de un flujo web GA4 sin registrar su valor. */
export function isValidGaMeasurementId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^G-[A-Z0-9]{6,14}$/i.test(value);
}

/** Valida un container ID de Google Tag Manager. */
export function isValidGtmId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^GTM-[A-Z0-9]{4,12}$/i.test(value);
}

/**
 * Prefijos de rutas PRIVADAS/internas que jamás deben disparar GA4.
 * Fuente única (DRY): `components/analytics-scripts.tsx` la consume vía
 * `isAnalyticsExcludedPath` para no duplicar la lista.
 *
 * Una ruta se considera excluida si `pathname === prefijo` o si empieza por
 * `prefijo + '/'`. Así `/cp` y `/cp/...` se excluyen, pero `/cpu-precios`
 * (hipotética ruta pública) no.
 */
export const ANALYTICS_EXCLUDED_PREFIXES = [
  '/intranet',
  '/preview',
  '/api',
  '/cp',
  '/calculadora',
  '/casos',
  '/delitos',
  '/atajos',
  '/admin',
  '/_next',
  '/404',
  '/500',
] as const;

/** ¿Es una ruta privada/interna que NO debe trackear? */
export function isAnalyticsExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  return ANALYTICS_EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function cleanParams(params?: EventParams): EventParams | undefined {
  if (!params) return undefined;
  const clean: EventParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) clean[k] = v;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export function trackEvent(action: string, params?: EventParams) {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & { gtag?: (type: string, action: string, params?: Record<string, unknown>) => void };
  if (!w.gtag) return;
  try {
    w.gtag('event', action, cleanParams(params) as Record<string, unknown>);
  } catch {
    /* silencioso */
  }
}

function conversionParams(ctaLocation?: string): EventParams {
  return {
    value: 1,
    cta_location: ctaLocation?.slice(0, 60) || 'unknown',
    source_path: typeof window !== 'undefined' ? window.location.pathname.slice(0, 120) : 'unknown',
  };
}

export function trackWhatsAppClick(ctaLocation?: string) {
  trackEvent('whatsapp_click', conversionParams(ctaLocation));
}

export function trackPhoneClick(ctaLocation?: string) {
  trackEvent('phone_click', conversionParams(ctaLocation));
}

export function trackFormClick(ctaLocation?: string) {
  trackEvent('form_click', conversionParams(ctaLocation));
}

/** Clic en el CTA principal de consulta ("Solicitar evaluación confidencial").
 *  §9.4 — se deduplica: un mismo enlace dispara un único evento. */
export function trackConsultationCtaClick(ctaLocation?: string) {
  trackEvent('consultation_cta_click', conversionParams(ctaLocation));
}

export function trackLeadGenerated(ctaLocation?: string) {
  trackEvent('lead_generated', conversionParams(ctaLocation));
}

/** Evento de conversión: formulario de consulta enviado con éxito.
 *  Debe marcarse como evento clave en GA4 (§10).
 *  Se dispara SOLO tras respuesta exitosa del servidor (HTTP 2xx = éxito de
 *  negocio: la solicitud quedó persistida). No se envía al pulsar el botón,
 *  ni ante errores de validación/captcha/server, ni más de una vez por envío
 *  (el formulario bloquea reenvíos mientras está en curso).
 *
 *  Parámetros permitidos (§9.2) — únicamente datos NO personales:
 *  - form_name: identificador estable del formulario (p. ej. "consulta")
 *  - page_path: ruta de la página donde se envió
 *  - service_area: área de práctica derivada del motivo (categoría, no el
 *    detalle del caso)
 *  - submission_status: "success" solo cuando el servidor confirmó
 *  - transport: medio preferido de contacto seleccionado (categoría)
 *
 *  NUNCA incluye nombre, email, teléfono, mensaje, IP, referencia de
 *  expediente ni contenido jurídico. */
export function trackContactFormSubmit(params?: {
  formName?: string;
  pagePath?: string;
  serviceArea?: string;
  submissionStatus?: 'success' | 'error';
  transport?: string;
}) {
  trackEvent('contact_form_submit', {
    value: 1,
    form_name: params?.formName?.slice(0, 40) || 'consulta',
    page_path: params?.pagePath?.slice(0, 120) || 'unknown',
    ...(params?.serviceArea ? { service_area: params.serviceArea.slice(0, 40) } : {}),
    submission_status: params?.submissionStatus ?? 'success',
    ...(params?.transport ? { transport: params.transport.slice(0, 20) } : {}),
  });
}

export function trackEmailClick(ctaLocation?: string) {
  trackEvent('email_click', conversionParams(ctaLocation));
}

export function trackDirectionsClick(..._args: unknown[]) {
  trackEvent('directions_click', { value: 1 });
}

/**
 * Apertura de FAQ (cuando el usuario expande una pregunta).
 * @param question Texto de la pregunta abierta.
 * @param page Path o identificador de la página donde está la FAQ.
 */
export function trackFaqOpen(question: string, page?: string) {
  trackEvent('faq_open', { question: question.slice(0, 100), ...(page ? { page } : {}) });
}

/**
 * Búsqueda interna en el blog.
 * @param query Texto buscado (truncado a 100 chars por privacidad).
 */
export function trackBlogSearch(query: string) {
  trackEvent('blog_search', { query: query.slice(0, 100) });
}

/**
 * Clic en enlace interno (breadcrumb, related, etc.).
 * @param target Path o etiqueta del enlace pulsado.
 */
export function trackInternalClick(target: string) {
  trackEvent('internal_click', { target: target.slice(0, 100) });
}

/**
 * Profundidad de scroll alcanzada (engagement).
 * @param percent Porcentaje de página scrolleado (25, 50, 75, 90).
 */
export function trackScrollDepth(percent: number) {
  trackEvent('scroll_depth', { percent, value: percent });
}

// ---------------------------------------------------------------------------
// Eventos de conversión FASE 2 (páginas centrales).
// Reglas (AGENTS.md §3, §6): sin PII, sin descripciones del caso, sin nombre,
// correo o teléfono en parámetros. Los parámetros son solo identificadores
// estables (ruta, categoría, sección). Se excluyen de preview e intranet vía
// isAnalyticsExcludedPath, que ya filtra /preview y /intranet.
// ---------------------------------------------------------------------------

/** Parámetro de ruta (no personal) para eventos de formulario. */
function formPagePath(pagePath?: string): EventParams {
  return { page_path: pagePath?.slice(0, 120) || 'unknown' };
}

/** Vista del formulario de consulta (cuando el bloque es visible). */
export function trackContactFormView(pagePath?: string) {
  trackEvent('contact_form_view', { value: 1, ...formPagePath(pagePath) });
}

/** Inicio de interacción con el formulario (primer campo editado, una sola vez). */
export function trackContactFormStart(pagePath?: string) {
  trackEvent('contact_form_start', { value: 1, ...formPagePath(pagePath) });
}

/** Categorías controladas de error (§9.3). No se envía el texto del usuario. */
export type ContactFormErrorCategory =
  | 'validation'
  | 'turnstile'
  | 'rate_limit'
  | 'network'
  | 'server'
  | 'delivery'
  | 'unknown';

/** Error del formulario de consulta.
 *  NO incluye el valor del campo ni el mensaje de excepción: solo la
 *  categoría controlada y, opcionalmente, el identificador del campo. */
export function trackContactFormError(params?: {
  category: ContactFormErrorCategory;
  field?: string;
  pagePath?: string;
}) {
  trackEvent('contact_form_error', {
    value: 1,
    category: params?.category ?? 'unknown',
    ...(params?.field ? { field: params.field.slice(0, 40) } : {}),
    ...formPagePath(params?.pagePath),
  });
}

/** Clic en un enlace de mapa o indicaciones (Google Maps, Waze, etc.). */
export function trackClickMaps(origen?: string) {
  trackEvent('click_maps', { value: 1, ...(origen ? { origen: origen.slice(0, 40) } : {}) });
}

/** Vista de una página o tarjeta de servicio. */
export function trackViewService(servicio?: string) {
  trackEvent('view_service', { value: 1, ...(servicio ? { servicio: servicio.slice(0, 60) } : {}) });
}

/** Vista de la sección de equipo. */
export function trackViewTeamSection(ruta?: string) {
  trackEvent('view_team_section', { value: 1, ...(ruta ? { ruta: ruta.slice(0, 100) } : {}) });
}

// ---------------------------------------------------------------------------
// Eventos FASE 4 (páginas locales y Honduras–España).
// Reglas (AGENTS.md §3, §6): sin PII. Los parámetros son solo identificadores
// estables (slug de localidad o servicio, categoría de CTA). Nunca se envían
// nombre, correo, teléfono, ciudad exacta del cliente, descripción del caso,
// documentos ni datos de menores. Se excluyen de preview e intranet vía
// isAnalyticsExcludedPath (ya filtra /preview, /intranet, /api, /admin).
// ---------------------------------------------------------------------------

/** Vista de una página local (/abogados-en-{slug}).
 *  @param locationSlug Slug de la localidad (p. ej. "choluteca"). Es una
 *  categoría, no la dirección o ciudad exacta del usuario. */
export function trackViewLocalPage(locationSlug?: string) {
  trackEvent('view_local_page', {
    value: 1,
    ...(locationSlug ? { location_slug: locationSlug.slice(0, 60) } : {}),
  });
}

/** Vista de una subpágina/servicio del hub Honduras–España.
 *  @param serviceSlug Slug del servicio (p. ej. "poderes"). */
export function trackViewSpainService(serviceSlug?: string) {
  trackEvent('view_spain_service', {
    value: 1,
    ...(serviceSlug ? { service_slug: serviceSlug.slice(0, 60) } : {}),
  });
}

/** Clic en un CTA de una página local.
 *  @param location Slug de la localidad de origen del CTA (categoría). */
export function trackCtaLocal(location?: string) {
  trackEvent('cta_local', {
    value: 1,
    ...(location ? { cta_location: location.slice(0, 60) } : {}),
  });
}

/** Clic en un CTA del hub Honduras–España. Sin parámetros identificadores. */
export function trackCtaSpain() {
  trackEvent('cta_spain', { value: 1 });
}

// ---------------------------------------------------------------------------
// Diagnóstico local (development únicamente)
// ---------------------------------------------------------------------------

/**
 * ¿Está activo el modo diagnóstico de analítica?
 *
 * Condiciones (ambas obligatorias):
 *   1. No estar en producción (`NODE_ENV !== 'production'`).
 *   2. Tener `NEXT_PUBLIC_ANALYTICS_DEBUG=true` de forma explícita.
 *
 * En producción SIEMPRE devuelve false, independientemente de la variable:
 * ningún log de analítica se emite en prod.
 */
export function isAnalyticsDebugEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';
}

/**
 * Enmascara parcialmente un Measurement ID (G-XXXXXXXXXX) para logs.
 * Mantiene el prefijo `G-` + los primeros 4 caracteres del stream y
 * reemplaza el resto por asteriscos. Ej: `G-L2PG*****`.
 *
 * Si el valor no cumple el formato esperado, devuelve un placeholder neutro
 * `'G-?(invalid)'` sin exponer el valor crudo (podría ser un property ID
 * numérico filtrado por error — no queremos imprimirlo en consola).
 */
export function maskMeasurementId(gaId: string | null | undefined): string {
  if (!gaId) return '(none)';
  const match = /^G-([A-Z0-9]{4})[A-Z0-9]*$/i.exec(gaId);
  if (!match) return 'G-?(invalid-format)';
  const rest = gaId.length - (2 /* G- */ + 4);
  return `G-${match[1]}${'*'.repeat(Math.max(rest, 3))}`;
}

type DebugContext = Record<string, string | number | boolean | null | undefined>;

/**
 * Emite un log de diagnóstico de analítica al `console.debug` del navegador.
 *
 * Solo actúa cuando `isAnalyticsDebugEnabled()` es true. No emite nada en
 * producción. El contexto se serializa sin incluir cookies, IPs, query
 * strings completos ni PII: el llamador es responsable de pasar solo datos
 * seguros (pathname sin query, ID enmascarado, flags booleanos).
 */
export function debugAnalytics(message: string, context?: DebugContext): void {
  if (!isAnalyticsDebugEnabled()) return;
  if (typeof window === 'undefined') return;
  const safeCtx = context
    ? Object.fromEntries(
        Object.entries(context).filter(
          ([, v]) => v !== undefined && v !== null,
        ),
      )
    : undefined;
  // console.debug no está restringido por no-console en la config de ESLint
  // del proyecto; dejo la llamada limpia sin directiva de exclusión.
  console.debug('[analytics:debug]', message, safeCtx ?? '');
}
