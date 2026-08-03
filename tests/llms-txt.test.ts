import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const script = resolve(root, 'scripts/generate-llms-txt.mjs');
const publicFile = resolve(root, 'public/llms.txt');
const canonicalOrigin = 'https://www.pinedayasociadoshn.com';

describe('llms.txt', () => {
  it('se puede regenerar en seco con URLs canónicas', () => {
    const output = execFileSync(process.execPath, [script, '--dry-run'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        SITE_BASE_URL: canonicalOrigin,
      },
    });

    expect(output).toContain(`${canonicalOrigin}/sitemap.xml`);
    expect(output).toContain('Thania Marlene Paz');
    expect(output).toContain('Emil Barahona');
  });

  it('rechaza un dominio contaminado antes de generar el archivo', () => {
    const result = spawnSync(process.execPath, [script, '--dry-run'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        SITE_BASE_URL: `y\n${canonicalOrigin}\n`,
      },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/caracteres de control|debe ser exactamente/);
  });

  it('publica identidades confirmadas sin credenciales ni fechas no verificadas', () => {
    const output = readFileSync(publicFile, 'utf8');

    expect(output).toContain('Thania Marlene Paz');
    expect(output).toContain('Emil Barahona');
    expect(output).not.toContain('Thania Pineda');
    expect(output).not.toContain('Emil Hernández');
    expect(output).not.toMatch(/fundado en 2010/i);
    expect(output).toContain('/equipo/danilo-pineda-maradiaga');
    expect(output).toContain('/equipo/thania-marlene-paz');
    expect(output).toContain('/equipo/emil-barahona');
    expect(output).toMatch(/abogado penalista/i);
    expect(output).toMatch(/socia fundadora/i);
    expect(output).not.toMatch(/notario colegiado/i);
    expect(output).toContain('Proxy en runtime Node.js');
  });
});
