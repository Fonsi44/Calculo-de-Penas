import { describe, expect, it } from 'vitest';
import { isValidGaMeasurementId, isValidGtmId } from '@/lib/analytics';
import { resolveAnalyticsProviderConfig } from '@/lib/site';

describe('analytics configuration guards', () => {
  it('accepts GA4 web stream IDs and rejects property/legacy IDs', () => {
    expect(isValidGaMeasurementId('G-ABC1234567')).toBe(true);
    expect(isValidGaMeasurementId('123456789')).toBe(false);
    expect(isValidGaMeasurementId('UA-123-1')).toBe(false);
  });

  it('accepts GTM container IDs and rejects GA IDs', () => {
    expect(isValidGtmId('GTM-ABC123')).toBe(true);
    expect(isValidGtmId('G-ABC1234567')).toBe(false);
  });

  it('normaliza una única vía de carga analítica', () => {
    expect(resolveAnalyticsProviderConfig(' G-ABC1234567 ', null)).toEqual({
      gaId: 'G-ABC1234567',
      gtmId: null,
    });
    expect(resolveAnalyticsProviderConfig('', ' GTM-ABC123 ')).toEqual({
      gaId: null,
      gtmId: 'GTM-ABC123',
    });
  });

  it('rechaza una configuración simultánea de GA4 directo y GTM', () => {
    expect(() =>
      resolveAnalyticsProviderConfig('G-ABC1234567', 'GTM-ABC123'),
    ).toThrow(/mutuamente excluyentes/);
  });
});
