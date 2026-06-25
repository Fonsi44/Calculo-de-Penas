'use client';

type EventParams = Record<string, string | number | boolean>;

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
