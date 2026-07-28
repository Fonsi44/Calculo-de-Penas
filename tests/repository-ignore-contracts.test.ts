import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

function ignored(path: string): boolean {
  return spawnSync('git', ['check-ignore', '--no-index', '--quiet', path], { cwd: ROOT }).status === 0;
}

describe('contratos de artefactos locales', () => {
  it.each([
    '.env',
    '.env.local',
    '.local/evidence.json',
    '.backups/snapshot.sql',
    '.zcode/session.json',
    'output/report.json',
    'reports/audit.json',
    'generated/legal-text/source.txt',
    'coverage/coverage-final.json',
    'playwright-report/index.html',
    'test-results/results.json',
    'database.dump',
    'database.sql.gz',
    'debug.log',
  ])('ignora %s', (path) => {
    expect(ignored(path)).toBe(true);
  });

  it('mantiene .env.example versionado y no ignorado', () => {
    expect(ignored('.env.example')).toBe(false);
    expect(execFileSync('git', ['ls-files', '--error-unmatch', '.env.example'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim()).toBe('.env.example');
  });
});
