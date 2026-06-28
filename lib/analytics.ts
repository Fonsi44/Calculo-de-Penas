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

export function trackWhatsAppClick(..._args: unknown[]) {
  trackEvent('whatsapp_click', { value: 1 });
}

export function trackPhoneClick(..._args: unknown[]) {
  trackEvent('phone_click', { value: 1 });
}

export function trackFormClick(..._args: unknown[]) {
  trackEvent('form_click', { value: 1 });
}

export function trackLeadGenerated(..._args: unknown[]) {
  trackEvent('lead_generated', { value: 1 });
}

export function trackEmailClick(..._args: unknown[]) {
  trackEvent('email_click', { value: 1 });
}

export function trackDirectionsClick(..._args: unknown[]) {
  trackEvent('directions_click', { value: 1 });
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
