#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const WEAK_PATTERNS = [
  /change[-_]?in[-_]?production/i,
  /dev[-_]?only/i,
  /replace[-_]?with/i,
  /example/i,
  /placeholder/i,
  /lex[-_]?honduras[-_]?secret/i,
  /tu[-_]?secreto/i,
  /your[-_]?secret/i,
  /test1234/i,
];

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const text = readFileSync(path, 'utf8');
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function checkSecret(name, value) {
  const issues = [];
  if (!value) {
    issues.push('NO DEFINIDA');
  } else {
    if (value.length < 32) issues.push(`muy corta (${value.length} chars; mínimo 32)`);
    for (const re of WEAK_PATTERNS) {
      if (re.test(value)) {
        issues.push(`parece placeholder/débil (patrón: ${re})`);
        break;
      }
    }
  }
  return issues;
}

function checkDatabaseUrl(name, value) {
  const issues = [];
  if (!value) {
    issues.push('NO DEFINIDA');
  } else if (!/^postgres(?:ql)?:\/\//.test(value)) {
    issues.push('formato inválido (debe empezar por postgresql://)');
  } else if (!/sslmode=require/.test(value) && !/ssl=true/.test(value)) {
    issues.push('falta sslmode=require (recomendado para Neon)');
  }
  return issues;
}

const env = {
  ...loadEnv(resolve(ROOT, '.env')),
  ...process.env,
};

const checks = [
  { name: 'DATABASE_URL', value: env.DATABASE_URL, fn: checkDatabaseUrl },
  { name: 'JWT_SECRET', value: env.JWT_SECRET, fn: checkSecret },
  { name: 'JWT_SECRET_PREVIOUS', value: env.JWT_SECRET_PREVIOUS, fn: checkSecret, optional: true },
];

const isProd = env.NODE_ENV === 'production';
let failed = false;

console.log('Verificando variables de entorno...\n');
for (const c of checks) {
  const issues = c.fn(c.name, c.value);
  if (issues.length === 0) {
    const masked = c.value ? `${c.value.slice(0, 4)}...${c.value.slice(-4)} (${c.value.length} chars)` : 'NO DEFINIDA';
    console.log(`OK  ${c.name.padEnd(24)} ${masked}`);
  } else {
    const isFatal = !c.optional && (isProd || c.value !== undefined);
    const prefix = isFatal ? 'FAIL' : 'WARN';
    if (isFatal) failed = true;
    console.log(`${prefix} ${c.name.padEnd(24)} ${issues.join('; ')}`);
  }
}

console.log();
if (failed) {
  console.error('Hay variables críticas con problemas. La app NO debería arrancar en este estado.');
  process.exit(1);
}
if (!isProd) {
  console.log('Entorno: development. Las advertencias no bloquean el arranque.');
} else {
  console.log('Entorno: production. Todas las variables críticas OK.');
}
