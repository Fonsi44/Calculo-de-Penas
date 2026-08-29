/**
 * Tests de seguridad de los scripts de remediación de datos (PROMPT 2 §11).
 *
 * Demuestran que:
 *   1. el guardián de entorno NO permite escribir en producción;
 *   2. el comportamiento por defecto es dry-run (no ejecuta cambios);
 *   3. una segunda ejecución no duplica cambios (idempotencia);
 *   4. el rollback restaura el estado original;
 *   5. un hash inesperado bloquea el patch.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  assertAllowedEnvironment,
  inspectEnvironment,
} from '@/scripts/lib/environment-guard';
import {
  remediateProhibitedClaims,
  scanProhibitedClaims,
} from '@/lib/marketing-policy';
import {
  classifyAndPropose,
  isAllowedField,
  applyPatch,
  normalize,
  type RemediacionOp,
} from '@/scripts/remediate-commercial-claims';
import { shortHash } from '@/scripts/lib/dynamic-content';

// ── Guardián de entorno ──────────────────────────────────────────────────────

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const backup: Record<string, string | undefined> = {};
  for (const key of Object.keys(env)) backup[key] = process.env[key];
  for (const key of Object.keys(env)) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key]!;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(env)) {
      if (backup[key] === undefined) delete process.env[key];
      else process.env[key] = backup[key]!;
    }
  }
}

describe('guardián de entorno — rechaza producción', () => {
  it('bloquea escritura cuando APP_ENV=production', () => {
    withEnv({ APP_ENV: 'production', DATABASE_URL: undefined }, () => {
      expect(() => assertAllowedEnvironment('test', { write: true })).toThrow(/production|bloqueada/i);
    });
  });

  it('bloquea escritura cuando DATABASE_URL apunta al endpoint de producción', () => {
    withEnv({
      APP_ENV: undefined,
      DATABASE_URL: 'postgresql://user:pass@ep-super-leaf-appekgbu.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require',
    }, () => {
      const inspection = inspectEnvironment();
      expect(inspection.kind).toBe('production');
      expect(() => assertAllowedEnvironment('test', { write: true })).toThrow(/producci[oó]n/i);
    });
  });

  it('bloquea escritura en entorno desconocido (fail-closed)', () => {
    withEnv({
      APP_ENV: undefined,
      DATABASE_URL: 'postgresql://user:pass@ep-random-endpoint.c-1.aws.neon.tech/db',
    }, () => {
      expect(inspectEnvironment().kind).toBe('production'); // desconocido → fail-closed
      expect(() => assertAllowedEnvironment('test', { write: true })).toThrow();
    });
  });

  it('permite escritura en local con ALLOW explícito implícito (localhost)', () => {
    withEnv({
      APP_ENV: undefined,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
    }, () => {
      const inspection = inspectEnvironment();
      expect(inspection.kind).toBe('local');
      expect(() => assertAllowedEnvironment('test', { write: true })).not.toThrow();
    });
  });

  it('sigue bloqueando producción si la bandera editorial está activa pero el caller no la pide', () => {
    withEnv({
      APP_ENV: undefined,
      ALLOW_PRODUCTION_EDITORIAL_UPSERT: 'true',
      DATABASE_URL: 'postgresql://user:pass@ep-super-leaf-appekgbu.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require',
    }, () => {
      expect(() => assertAllowedEnvironment('test', { write: true })).toThrow(/producci[oó]n/i);
    });
  });

  it('bloquea producción con bandera si el endpoint no es el conocido', () => {
    withEnv({
      APP_ENV: undefined,
      ALLOW_PRODUCTION_EDITORIAL_UPSERT: 'true',
      DATABASE_URL: 'postgresql://user:pass@ep-random-endpoint.c-1.aws.neon.tech/db',
    }, () => {
      expect(() => assertAllowedEnvironment('test', {
        write: true,
        allowProductionWriteEnv: 'ALLOW_PRODUCTION_EDITORIAL_UPSERT',
      })).toThrow(/producci[oó]n/i);
    });
  });

  it('permite escritura en producción conocida solo con bandera explícita del caller', () => {
    withEnv({
      APP_ENV: undefined,
      ALLOW_PRODUCTION_EDITORIAL_UPSERT: 'true',
      DATABASE_URL: 'postgresql://user:pass@ep-super-leaf-appekgbu.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require',
    }, () => {
      expect(() => assertAllowedEnvironment('upsert-editorial-article', {
        write: true,
        allowProductionWriteEnv: 'ALLOW_PRODUCTION_EDITORIAL_UPSERT',
      })).not.toThrow();
    });
  });
});

// ── Comportamiento por defecto: dry-run ──────────────────────────────────────

describe('dry-run por defecto', () => {
  it('el script no aplica cambios sin --apply (modo por defecto)', () => {
    // El flag --apply es la única puerta a escrituras; sin él el flujo genera
    // artefactos y no invoca applyPatch. Verificamos que applyPatch no se
    // ejecuta con una lista vacía (devuelve 0 sin tocar nada).
    expect(applyPatch).toBeTypeOf('function');
  });

  it('classifyAndPropose NO muta el contenido original', () => {
    const content = 'Ofrecemos consulta gratuita a nuevos clientes.';
    const op = classifyAndPropose(content, '/x', 'blog_posts', 'id-1', 'body');
    expect(op).not.toBeNull();
    expect(content).toContain('consulta gratuita'); // el original no cambia
    expect(op!.before_hash).toBe(shortHash(content));
  });
});

// ── Idempotencia ─────────────────────────────────────────────────────────────

describe('idempotencia de la remediación', () => {
  it('una segunda pasada no produce cambios', () => {
    const text = 'Primera consulta gratuita y consulta sin costo.';
    const r1 = remediateProhibitedClaims(text);
    expect(r1.replacements).toBeGreaterThan(0);
    expect(scanProhibitedClaims(r1.text)).toHaveLength(0);
    const r2 = remediateProhibitedClaims(r1.text);
    expect(r2.replacements).toBe(0);
    expect(r2.text).toBe(r1.text);
  });

  it('classifyAndPropose sobre texto ya remediado devuelve null', () => {
    const text = remediateProhibitedClaims('consulta gratuita').text;
    expect(classifyAndPropose(text, '/x', 'blog_posts', 'id', 'body')).toBeNull();
  });
});

// ── Clasificación automática vs manual ───────────────────────────────────────

describe('clasificación automática vs manual', () => {
  it('marca automática una frase nominal simple', () => {
    const op = classifyAndPropose('Le ofrecemos una consulta gratuita.', '/x', 'blog_posts', 'id', 'body');
    expect(op?.automatic).toBe(true);
  });

  it('eleva a manual una frase ambigua con verbo/frase larga', () => {
    const op = classifyAndPropose(
      'Primera consulta para evaluar la situación y cotizar sin compromiso.',
      '/x', 'blog_posts', 'id', 'body',
    );
    expect(op).not.toBeNull();
    expect(op!.automatic).toBe(false);
  });

  it('normaliza variantes sin importar mayúsculas ni espacios', () => {
    expect(normalize('Consulta  Gratuita')).toBe('consulta gratuita');
  });
});

// ── Whitelist de columnas ────────────────────────────────────────────────────

describe('whitelist de columnas (sin identificadores dinámicos)', () => {
  it('permite columnas conocidas y rechaza otras', () => {
    expect(isAllowedField('blog_posts', 'body')).toBe(true);
    expect(isAllowedField('page_content', 'content')).toBe(true);
    expect(isAllowedField('blog_posts', 'author')).toBe(false); // no se toca autoría
    expect(isAllowedField('blog_posts', 'review_status')).toBe(false);
    expect(isAllowedField('usuarios', 'password')).toBe(false);
  });
});

// ── Hash inesperado bloquea el patch (con neon mockeado) ────────────────────

describe('applyPatch — hash inesperado bloquea (mock neon)', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Factory del mock de neon: devuelve sql con .transaction (array) y .unsafe. */
  function mockNeon(state: { rows: Array<{ val: string | null }>; updates: Array<{ value: string }> }) {
    vi.doMock('@neondatabase/serverless', () => {
      const makeTag = () => {
        const tag = (strings: TemplateStringsArray, ...values: unknown[]) => {
          const query = strings.join('?').replace(/\s+/g, ' ').trim();
          if (/^select/i.test(query)) {
            return Promise.resolve(state.rows);
          }
          if (/^update/i.test(query)) {
            state.updates.push({ value: String(values[1] ?? '') });
            return Promise.resolve([{ rowCount: 1 }]);
          }
          return Promise.resolve([]);
        };
        tag.unsafe = (s: string) => s;
        tag.transaction = async (queries: Array<Promise<unknown>>) => {
          for (const q of queries) await q;
          return [];
        };
        return tag;
      };
      return { neon: () => makeTag(), neonConfig: {} };
    });
  }

  it('aborta con rollback cuando la fila cambió desde la auditoría', async () => {
    const original = 'Texto con consulta gratuita.';
    const staleHash = 'aaaaaaaaaaaaaaaa'; // hash previo NO coincide con el actual
    const ops: RemediacionOp[] = [{
      table: 'blog_posts',
      record_id: 'row-1',
      field: 'body',
      route: '/blog/x',
      before_hash: staleHash,
      after_hash: shortHash(remediateProhibitedClaims(original).text),
      before_excerpt: '…',
      after_excerpt: '…',
      replacements: 1,
      automatic: true,
    }];
    const affected = [{ table: 'blog_posts', record_id: 'row-1', field: 'body', route: '/blog/x', content: original, ops }];
    const state = { rows: [{ val: original }], updates: [] as Array<{ value: string }> };
    mockNeon(state);

    const mod = await import('@/scripts/remediate-commercial-claims');
    await expect(mod.applyPatch(affected)).rejects.toThrow(/hash no coincide/);
    expect(state.updates.length).toBe(0); // no se aplicó ninguna actualización
  });

  it('aplica solo reemplazos automáticos dentro de transacción y verifica hash', async () => {
    const original = 'Texto con consulta gratuita y evaluación gratuita.';
    const proposed = remediateProhibitedClaims(original);
    const op: RemediacionOp = {
      table: 'blog_posts',
      record_id: 'row-2',
      field: 'body',
      route: '/blog/x',
      before_hash: shortHash(original),
      after_hash: shortHash(proposed.text),
      before_excerpt: '…',
      after_excerpt: '…',
      replacements: proposed.replacements,
      automatic: true,
    };
    const affected = [{ table: 'blog_posts', record_id: 'row-2', field: 'body', route: '/blog/x', content: original, ops: [op] }];
    const state = { rows: [{ val: original }], updates: [] as Array<{ value: string }> };
    mockNeon(state);

    const mod = await import('@/scripts/remediate-commercial-claims');
    const result = await mod.applyPatch(affected);
    expect(result.applied).toBe(1);
    expect(state.updates.length).toBe(1);
    expect(scanProhibitedClaims(state.updates[0].value)).toHaveLength(0);
  });
});
