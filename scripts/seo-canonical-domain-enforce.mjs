#!/usr/bin/env node
/**
 * Enforce del dominio canónico de producción.
 *
 * Deriva el dominio correcto de `.env.example` (NEXT_PUBLIC_SITE_URL) y falla
 * si aparece la variante incorrecta (sin la "da" de "asociados") en archivos
 * ejecutables o documentación operativa.
 *
 * Exclusiones deliberadas:
 *  - tests/**: los tests de protección escriben la variante inválida a
 *    propósito para comprobar su rechazo.
 *  - docs/audits/archive/**: evidencia histórica fechada (no se reescribe).
 *  - data/google, data/bing, .secrets: datos raw/credenciales (no versionados).
 *
 * Uso: node scripts/seo-canonical-domain-enforce.mjs
 *   - exit 0 si no hay variante incorrecta.
 *   - exit 1 listando los archivos afectados.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

/** Deriva el dominio correcto y la variante inválida desde .env.example. */
export function canonicalDomains(envContent = readFileSync(resolve(ROOT, '.env.example'), 'utf8')) {
  const m = envContent.match(/^NEXT_PUBLIC_SITE_URL=https?:\/\/([^\s"']+)/m);
  if (!m) throw new Error('NEXT_PUBLIC_SITE_URL ausente en .env.example');
  const host = m[1];
  if (!host.includes('asociados')) {
    throw new Error(`Host inesperado en .env.example: ${host}`);
  }
  return {
    correctHost: host,                        // www.pinedayasocioshn.com
    typoHost: host.replace('asociados', 'asocios'), // variante sin "da"
    correctBare: host.replace('www.', ''),
    typoBare: host.replace('www.', '').replace('asociados', 'asocios'),
  };
}

/** Devuelve las rutas (relativas a ROOT) de archivos rastreados que contienen
 *  la variante inválida y que NO están en las exclusiones deliberadas. */
export function findTypoHits(envContent) {
  const { typoHost, typoBare } = canonicalDomains(envContent);
  const files = execSync('git ls-files', { cwd: ROOT, maxBuffer: 50e6 })
    .toString().split('\n').filter(Boolean);
  const skip = /^tests\/|^docs\/audits\/archive\/|^data\/google\/|^data\/bing\/|^\.secrets\//;
  const hits = [];
  for (const f of files) {
    if (skip.test(f)) continue;
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    const c = readFileSync(p, 'utf8');
    if (c.includes(typoHost) || c.includes(typoBare)) hits.push(f);
  }
  return hits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const hits = findTypoHits();
    if (hits.length) {
      console.error(`Dominio canónico vulnerado: variante incorrecta en ${hits.length} archivo(s):`);
      for (const h of hits) console.error(`  ✗ ${h}`);
      process.exit(1);
    }
    console.log('✅ Dominio canónico: sin variantes incorrectas en archivos operativos.');
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}
