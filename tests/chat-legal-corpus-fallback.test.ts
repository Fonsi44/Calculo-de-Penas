import { afterEach, describe, expect, it } from 'vitest';
import { getLegalCorpusUnavailableReply } from '../lib/chat/legal-corpus-fallback';

describe('legal corpus fallback', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('en producción no menciona npm ni LaunchAgent', () => {
    process.env.NODE_ENV = 'production';
    const reply = getLegalCorpusUnavailableReply();
    expect(reply).not.toMatch(/npm run|LaunchAgent|chat:dev/i);
    expect(reply).toMatch(/contacte con el despacho/i);
  });

  it('en desarrollo añade pista operativa', () => {
    process.env.NODE_ENV = 'development';
    const reply = getLegalCorpusUnavailableReply();
    expect(reply).toMatch(/chat:dev|LaunchAgent/i);
  });
});
