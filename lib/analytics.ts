'use client';

type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(action: string, params?: EventParams) {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & { gtag?: (type: string, action: string, params?: EventParams) => void };
  if (!w.gtag) return;
  try {
    w.gtag('event', action, params);
  } catch {
    /* silencioso */
  }
}

export function trackWhatsAppClick(label?: string) {
  trackEvent('whatsapp_click', { 
    event_category: 'engagement', 
    event_label: label || 'floating_button',
    value: 1 
  });
}

export function trackPhoneClick(label?: string) {
  trackEvent('phone_click', { 
    event_category: 'engagement', 
    event_label: label || 'floating_button',
    value: 1 
  });
}

export function trackFormClick(label?: string) {
  trackEvent('form_click', { 
    event_category: 'conversion', 
    event_label: label || 'blog_cta',
    value: 1 
  });
}

export function trackLeadGenerated(source: string) {
  trackEvent('lead_generated', {
    event_category: 'conversion',
    event_label: source,
    value: 1,
    non_interaction: true,
  });
}
