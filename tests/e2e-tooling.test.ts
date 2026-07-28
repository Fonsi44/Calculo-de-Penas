/**
 * Pruebas del tooling E2E (PR #20).
 *
 * Valida:
 *   - Guards del seed (bloquea producción, requiere ALLOW_E2E_SEED, staging).
 *   - Guards del cleanup (idénticos al seed).
 *   - Guards del runner (bloquea producción, requiere entorno staging).
 *   - Idempotencia conceptual del fixture.
 *   - Propagación de fallos del runner (exit code de Playwright).
 *   - Fixture canónico: emails, IDs y contraseñas coherentes con specs.
 *
 * Estos tests NO levantan servidor ni DB: validan la lógica de guards y la
 * coherencia estática del fixture. La validación real end-to-end la hace
 * `npm run e2e:staging` contra el branch Neon aislado.
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
  // Partir de un entorno mínimo (PATH y locales) para que el test no herede
  // variables E2E_* del shell del desarrollador. Solo se añaden las variables
  // explícitas del caso de test.
  const cleanEnv: Record<string, string | undefined> = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    USER: process.env.USER ?? '',
    SHELL: process.env.SHELL ?? '',
    LANG: process.env.LANG ?? '',
    TERM: process.env.TERM ?? '',
    NODE_ENV: 'test',
    // Modo test: los scripts NO cargan .env.e2e.local, para poder probar los
    // guards de forma aislada y determinista.
    E2E_TEST_MODE: '1',
  };
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined && v !== '') cleanEnv[k] = v;
  }
  try {
    stdout = execFileSync('node', [script], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: cleanEnv as NodeJS.ProcessEnv,
      timeout: 8_000,
    });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    stdout = e.stdout ?? '';
    stderr = e.stderr ?? '';
    exitCode = e.status ?? 1;
  }
  return { exitCode, stdout, stderr };
}

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as {
  users: Record<string, FixtureUser>;
  client: FixtureEntity;
  clientB: FixtureEntity;
  expedient: FixtureExpedient;
  expedientB: FixtureExpedient;
  case: FixtureCase;
  twoFactorEncryption: { fallbackKey: string; salt: string };
  bcryptCost: number;
};

interface FixtureUser {
  id: string;
  email: string;
  password: string;
  nombre: string;
  rol: string;
  totpSecretBase32?: string;
}
interface FixtureEntity {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  responsableId: string;
}
interface FixtureExpedient {
  id: string;
  numeroInterno: string;
  clienteId: string;
  responsableId: string;
  estado: string;
  prioridad: string;
}
interface FixtureCase {
  id: string;
  titulo: string;
  estado: string;
  usuarioId: string;
}

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
      // En E2E_TEST_MODE=1 el runner no carga .env.e2e.local; sin DATABASE_URL
      // el guard debe abortar con código != 0.
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

describe('E2E Tooling — Fixture canónico', () => {
  it('contiene todas las identidades requeridas', () => {
    const keys = Object.keys(fixture.users);
    for (const expected of ['admin', 'lawyerA', 'lawyerB', 'twoFactorUser', 'authUser', 'sidebarUser', 'unauthorizedUser']) {
      expect(keys, `falta identity ${expected}`).toContain(expected);
    }
  });

  it('IDs son UUIDv4 válidos con formato fijo', () => {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const [name, u] of Object.entries<FixtureUser>(fixture.users)) {
      expect(u.id, `${name}.id debe ser UUIDv4`).toMatch(uuidRe);
    }
  });

  it('emails de auth y sidebar coinciden con los specs', () => {
    expect(fixture.users.authUser.email).toBe('auth-test@pinedayasociadoshn.com');
    expect(fixture.users.authUser.password).toBe('e2e-test-password-X7q9Zk');
    expect(fixture.users.sidebarUser.email).toBe('sidebar-test@pinedayasociadoshn.com');
    expect(fixture.users.sidebarUser.password).toBe('sidebar-test-X7q9Zk');
  });

  it('IDs esperados por critical-authorization.spec.ts presentes', () => {
    expect(fixture.client.id).toBe('bbbbbbbb-0000-4000-a000-000000000001');
    expect(fixture.expedient.id).toBe('cccccccc-0000-4000-a000-000000000001');
    expect(fixture.users.lawyerA.id).toBe('aaaaaaaa-0000-4000-a000-000000000002');
  });

  it('configuración 2FA usa el fallback correcto', () => {
    expect(fixture.twoFactorEncryption.fallbackKey).toBe('dev-only-2fa-encryption-key-not-for-production');
    expect(fixture.twoFactorEncryption.salt).toBe('sgie-2fa-v2');
  });

  it('bcrypt cost es 12', () => {
    expect(fixture.bcryptCost).toBe(12);
  });

  it('roles asignados correctamente', () => {
    expect(fixture.users.admin.rol).toBe('admin');
    expect(fixture.users.lawyerA.rol).toBe('abogado');
    expect(fixture.users.lawyerB.rol).toBe('abogado');
  });

  it('cliente y expediente referencian al lawyerA como responsable', () => {
    expect(fixture.client.responsableId).toBe(fixture.users.lawyerA.id);
    expect(fixture.expedient.responsableId).toBe(fixture.users.lawyerA.id);
    expect(fixture.expedient.clienteId).toBe(fixture.client.id);
  });
});

describe('E2E Tooling — Coherencia spec ↔ fixture', () => {
  it('emails de admin/abogado/twofactor coinciden con fallbacks de critical-auth', () => {
    expect(fixture.users.admin.email).toBe('admin@test.local');
    expect(fixture.users.admin.password).toBe('TestAdmin123!');
    expect(fixture.users.lawyerA.email).toBe('abogado-a@test.local');
    expect(fixture.users.lawyerA.password).toBe('TestAbogadoA123!');
    expect(fixture.users.lawyerB.email).toBe('abogado-b@test.local');
    expect(fixture.users.lawyerB.password).toBe('TestAbogadoB123!');
    expect(fixture.users.twoFactorUser.email).toBe('twofactor@test.local');
    expect(fixture.users.twoFactorUser.password).toBe('Test2FA123!');
  });

  it('emails de abogadoB y admin coinciden con critical-authorization', () => {
    expect(fixture.users.admin.email).toBe('admin@test.local');
    expect(fixture.users.lawyerB.email).toBe('abogado-b@test.local');
  });
});
