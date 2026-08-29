/**
 * Pruebas del tooling E2E (guards de entorno).
 *
 * Tras la eliminación de intranet/SGIE, el seed es un no-op con los mismos
 * guards de producción. Estos tests NO levantan servidor ni DB.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SEED = resolve(ROOT, 'tools/ci/seed-e2e.mjs');
const CLEANUP = resolve(ROOT, 'tools/ci/cleanup-e2e.mjs');
const RUNNER = resolve(ROOT, 'tools/ci/run-e2e-staging.mjs');
const FIXTURE = resolve(ROOT, 'tests/e2e/fixtures/identities.json');

function runScript(script: string, env: Record<string, string | undefined>): { exitCode: number; stdout: string; stderr: string } {
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  const cleanEnv: Record<string, string | undefined> = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    USER: process.env.USER ?? '',
    SHELL: process.env.SHELL ?? '',
    LANG: process.env.LANG ?? '',
    TERM: process.env.TERM ?? '',
    NODE_ENV: 'test',
    E2E_TEST_MODE: '1',
  };
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined && v !== '') cleanEnv[k] = v;
  }
  try {
    stdout = execFileSync(process.execPath, [script], {
      cwd: ROOT,
      env: cleanEnv as NodeJS.ProcessEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    exitCode = e.status ?? 1;
    stdout = e.stdout ?? '';
    stderr = e.stderr ?? '';
  }
  return { exitCode, stdout, stderr };
}

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));

describe('E2E Tooling — Guards de entorno', () => {
  describe('seed-e2e.mjs', () => {
    it('bloquea sin DATABASE_URL', () => {
      const r = runScript(SEED, { ALLOW_E2E_SEED: 'true', E2E_ENVIRONMENT: 'staging' });
      expect(r.exitCode).not.toBe(0);
      const combined = r.stdout + r.stderr;
      expect(combined).toMatch(/DATABASE_URL/i);
    });

    it('bloquea sin ALLOW_E2E_SEED', () => {
      const r = runScript(SEED, {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        E2E_ENVIRONMENT: 'staging',
      });
      expect(r.exitCode).not.toBe(0);
      const combined = r.stdout + r.stderr;
      expect(combined).toMatch(/ALLOW_E2E_SEED/);
    });

    it('bloquea sin E2E_ENVIRONMENT=staging', () => {
      const r = runScript(SEED, {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        ALLOW_E2E_SEED: 'true',
      });
      expect(r.exitCode).not.toBe(0);
      const combined = r.stdout + r.stderr;
      expect(combined).toMatch(/E2E_ENVIRONMENT/);
    });

    it('bloquea NODE_ENV=production', () => {
      const r = runScript(SEED, {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        ALLOW_E2E_SEED: 'true',
        E2E_ENVIRONMENT: 'staging',
        NODE_ENV: 'production',
      });
      expect(r.exitCode).not.toBe(0);
      const combined = r.stdout + r.stderr;
      expect(combined).toMatch(/production/i);
    });

    it('bloquea DATABASE_URL con "prod" en el host', () => {
      const r = runScript(SEED, {
        DATABASE_URL: 'postgresql://user:pass@prod-host.aws.neon.tech/db',
        ALLOW_E2E_SEED: 'true',
        E2E_ENVIRONMENT: 'staging',
      });
      expect(r.exitCode).not.toBe(0);
      const combined = r.stdout + r.stderr;
      expect(combined).toMatch(/producción/i);
    });
  });

  describe('cleanup-e2e.mjs', () => {
    it('bloquea sin ALLOW_E2E_SEED', () => {
      const r = runScript(CLEANUP, {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        E2E_ENVIRONMENT: 'staging',
      });
      expect(r.exitCode).not.toBe(0);
      const combined = r.stdout + r.stderr;
      expect(combined).toMatch(/ALLOW_E2E_SEED/);
    });

    it('bloquea sin E2E_ENVIRONMENT=staging', () => {
      const r = runScript(CLEANUP, {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        ALLOW_E2E_SEED: 'true',
      });
      expect(r.exitCode).not.toBe(0);
      const combined = r.stdout + r.stderr;
      expect(combined).toMatch(/E2E_ENVIRONMENT/);
    });

    it('bloquea NODE_ENV=production', () => {
      const r = runScript(CLEANUP, {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        ALLOW_E2E_SEED: 'true',
        E2E_ENVIRONMENT: 'staging',
        NODE_ENV: 'production',
      });
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('run-e2e-staging.mjs', () => {
    it('bloquea sin DATABASE_URL en modo test', () => {
      const r = runScript(RUNNER, {});
      expect(r.exitCode).not.toBe(0);
    });

    it('bloquea E2E_ENVIRONMENT distinto de staging', () => {
      const r = runScript(RUNNER, {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        ALLOW_E2E_SEED: 'true',
        E2E_ENVIRONMENT: 'production',
      });
      expect(r.exitCode).not.toBe(0);
    });
  });
});

describe('E2E Tooling — Fixture legacy (archivo histórico)', () => {
  it('el fixture JSON sigue parseando (legado; no se usa en runtime público)', () => {
    expect(fixture).toBeTruthy();
    expect(typeof fixture).toBe('object');
  });
});
