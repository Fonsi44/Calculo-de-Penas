'use client';

export const CONSENT_STORAGE_KEY = 'pineda_cookie_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 180;
export const CONSENT_CHANGED_EVENT = 'pineda:consent-changed';
const MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export type ConsentPreferences = {
  version: number;
  analytics: boolean;
  functionality: boolean;
  decidedAt: string;
  expiresAt: string;
};

export type ConsentChoice = Pick<ConsentPreferences, 'analytics' | 'functionality'>;

function parseConsent(raw: string | null, now = Date.now()): ConsentPreferences | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (value.version !== CONSENT_VERSION || typeof value.analytics !== 'boolean' || typeof value.functionality !== 'boolean' || typeof value.decidedAt !== 'string' || typeof value.expiresAt !== 'string' || Date.parse(value.expiresAt) <= now) return null;
    return value as ConsentPreferences;
  } catch { return null; }
}

export function getConsentSnapshot(): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(CONSENT_STORAGE_KEY);
}

export function subscribeConsent(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CONSENT_CHANGED_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function parseConsentSnapshot(raw: string | null): ConsentPreferences | null {
  return parseConsent(raw);
}

export function readConsent(now = Date.now()): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const value = parseConsent(raw, now);
    if (!value) {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    return value;
  } catch {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    return null;
  }
}

export function persistConsent(choice: ConsentChoice, now = Date.now()): ConsentPreferences {
  const value: ConsentPreferences = {
    version: CONSENT_VERSION,
    analytics: choice.analytics,
    functionality: choice.functionality,
    decidedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + MAX_AGE_MS).toISOString(),
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent<ConsentPreferences>(CONSENT_CHANGED_EVENT, { detail: value }));
  return value;
}

export function updateGoogleConsent(choice: ConsentChoice): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function (...args: unknown[]) { window.dataLayer?.push(args); };
  window.gtag('consent', 'update', {
    analytics_storage: choice.analytics ? 'granted' : 'denied',
    functionality_storage: choice.functionality ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}
