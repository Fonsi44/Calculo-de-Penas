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

export function trackLeadGenerated(ctaLocation?: string) {
  trackEvent('lead_generated', conversionParams(ctaLocation));
}

/** Evento de conversión: formulario de consulta enviado con éxito.
 *  Debe marcarse como evento clave en GA4 (ver informe Fase 1).
 *  Se dispara solo tras respuesta exitosa del servidor (HTTP 200).
 *  No incluye datos personales. Solo parámetros seguros:
 *  - motivo: categoría seleccionada en el formulario
 *  - ruta: página desde la que se envió */
export function trackContactFormSubmit(params?: { motivo?: string; ruta?: string }) {
  trackEvent('contact_form_submit', {
    value: 1,
    ...(params?.motivo ? { motivo: params.motivo.slice(0, 40) } : {}),
    ...(params?.ruta ? { ruta: params.ruta.slice(0, 100) } : {}),
  });
}

export function trackEmailClick(..._args: unknown[]) {
  trackEvent('email_click', { value: 1 });
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

/** Vista del formulario de consulta (cuando el bloque es visible). */
export function trackConsultationFormView(ruta?: string) {
  trackEvent('consultation_form_view', { value: 1, ...(ruta ? { ruta: ruta.slice(0, 100) } : {}) });
}

/** Inicio de interacción con el formulario de consulta (primer campo editado). */
export function trackConsultationFormStart(ruta?: string) {
  trackEvent('consultation_form_start', { value: 1, ...(ruta ? { ruta: ruta.slice(0, 100) } : {}) });
}

/** Error de validación del formulario de consulta.
 *  NO incluye el valor del campo (puede ser PII): solo el identificador del
 *  campo y el tipo de error. */
export function trackConsultationFormError(params?: { campo?: string; tipo?: string; ruta?: string }) {
  trackEvent('consultation_form_error', {
    value: 1,
    ...(params?.campo ? { campo: params.campo.slice(0, 40) } : {}),
    ...(params?.tipo ? { tipo: params.tipo.slice(0, 40) } : {}),
    ...(params?.ruta ? { ruta: params.ruta.slice(0, 100) } : {}),
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
