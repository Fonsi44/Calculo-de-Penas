import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

/** Comprueba si un fixture bajo docs/audits/ existe (entorno de desarrollo completo). */
export function auditFixtureExists(relativePath: string): boolean {
  return existsSync(resolve(ROOT, relativePath));
}
