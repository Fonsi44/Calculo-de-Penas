// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  persistConsent,
  readConsent,
  updateGoogleConsent,
} from '@/lib/cookie-consent';

describe('Consent Mode v2 preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
    window.gtag = undefined;
    vi.restoreAllMocks();
  });

  it('starts denied and sends no pageview before a decision', () => {
    expect(readConsent()).toBeNull();
    expect(window.dataLayer).toEqual([]);
  });

  it('persists acceptance with policy version and expiry', () => {
    const saved = persistConsent({ analytics: true, functionality: true }, 1_000);
    expect(saved.version).toBe(CONSENT_VERSION);
    expect(readConsent(1_001)?.analytics).toBe(true);
  });

  it('persists rejection and supports a later change', () => {
    persistConsent({ analytics: false, functionality: false });
    expect(readConsent()?.analytics).toBe(false);
    persistConsent({ analytics: true, functionality: false });
    expect(readConsent()?.analytics).toBe(true);
  });

  it('requires renewal after a policy version change', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: 0, analytics: true, functionality: true, decidedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 999999).toISOString() }));
    expect(readConsent()).toBeNull();
  });

  it('keeps advertising denied when analytics is accepted', () => {
    updateGoogleConsent({ analytics: true, functionality: false });
    const update = window.dataLayer?.at(-1) as IArguments;
    expect(update[0]).toBe('consent');
    expect(update[1]).toBe('update');
    expect(update[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  });
});
