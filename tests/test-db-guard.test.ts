import { describe, expect, it } from 'vitest';
import { assertSafeTestDatabaseUrl } from '@/lib/test-db-guard';

describe('test DB guard', () => {
  it('acepta una base local y una base remota con nombre test', () => {
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@localhost:5432/app')).not.toThrow();
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-example.neon.tech/app_test')).not.toThrow();
  });

  it('acepta IPv6 local y variantes de segmento test', () => {
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@[::1]:5432/app')).not.toThrow();
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@127.0.0.1:5432/any')).not.toThrow();
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-x.neon.tech/test_app')).not.toThrow();
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-x.neon.tech/app-test')).not.toThrow();
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-x.neon.tech/test')).not.toThrow();
  });

  it('rechaza una base remota no marcada como test', () => {
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-production.neon.tech/production')).toThrow(/aislada/);
  });

  it('rechaza subcadena test dentro de otra palabra', () => {
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-x.neon.tech/mytest_prod')).toThrow(/aislada/);
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-x.neon.tech/mytest')).toThrow(/aislada/);
    expect(() => assertSafeTestDatabaseUrl('postgresql://x:y@ep-x.neon.tech/testing')).toThrow(/aislada/);
  });

  it('rechaza scheme no postgresql', () => {
    expect(() => assertSafeTestDatabaseUrl('mysql://x:y@localhost:3306/app_test')).toThrow(/scheme/);
  });

  it('rechaza DATABASE_URL ausente', () => {
    expect(() => assertSafeTestDatabaseUrl(undefined)).toThrow(/no configurada/);
  });
});
