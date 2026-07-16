import { describe, expect, it } from 'vitest';
import { isValidGaMeasurementId, isValidGtmId } from '@/lib/analytics';

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
});
