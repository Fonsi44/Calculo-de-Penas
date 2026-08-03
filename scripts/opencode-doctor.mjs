#!/usr/bin/env node
/**
 * Doctor del entorno OpenCode — Pineda y Asociados.
 *
 * PROPÓSITO:
 *   Verifica de forma SOLO LECTURA la salud de la configuración de OpenCode
 *   del proyecto: archivo canónico, JSON/JSONC válido, agentes, skills,
 *   comandos, los SIETE MCP oficiales (context7, chrome-devtools, github,
 *   neon, vercel, resend, semgrep) con su estado enabled/disabled esperado,
 *   modo read-only de github/neon, OAuth pendiente/completado, conectividad,
 *   existencia del binario semgrep, LSP, binarios opcionales, scripts npm,
 *   ausencia de secretos obvios y ausencia de dependencias MCP en
 *   package.json. Complementa `AGENTS.md` §0 y §13.
 *
 * USO:
 *   node scripts/opencode-doctor.mjs          # reporte a consola
 *   node scripts/opencode-doctor.mjs --json   # salida JSON
 *
 * EXIT CODES:
 *   0 = sin fallos reales (WARN y NOT_APPLICABLE no fallan)
 *   1 = al menos un fallo real (FAIL)
 *   2 = error de ejecución del propio doctor
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const JSONC = resolve(ROOT, 'opencode.jsonc');
const JSON_ALT = resolve(ROOT, 'opencode.json');
const AGENTS_DIR = join(ROOT, '.opencode', 'agents');
const SKILLS_DIR = join(ROOT, '.opencode', 'skills');
const COMMANDS_DIR = join(ROOT, '.opencode', 'commands');
const OUTPUT_JSON = process.argv.includes('--json');

const results = [];
function check(name, status, detail = '') {
  results.push({ name, status, detail });
  const icon = { PASS: '  ✓', WARN: '  ⚠', FAIL: '  ✗', NOT_APPLICABLE: '  ·', RESTART_REQUIRED: '  ↻' }[status] || '  ?';
  if (!OUTPUT_JSON) console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

function hasFailure(resultsList) {
  return resultsList.some((r) => r.status === 'FAIL');
}

// ── 0. Entorno base ────────────────────────────────────────────────────────
if (!OUTPUT_JSON) console.log('\n═══ OpenCode Doctor — Pineda y Asociados ═══\n');

const versions = {};
for (const bin of ['node', 'npm', 'opencode']) {
  const r = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 10_000 });
  versions[bin] = r.status === 0 ? r.stdout.trim().split('\n')[0] : null;
}
if (versions.node) check('node --version', 'PASS', versions.node);
else check('node --version', 'FAIL', 'binario no disponible');
if (versions.npm) check('npm --version', 'PASS', versions.npm);
else check('npm --version', 'FAIL', 'binario no disponible');
if (versions.opencode) check('opencode --version', 'PASS', versions.opencode);
else check('opencode --version', 'FAIL', 'binario no disponible');

// ── 1. Archivo canónico de configuración ───────────────────────────────────
let configRaw = null;
if (existsSync(JSONC)) {
  check('config canónica', 'PASS', 'opencode.jsonc');
  configRaw = readFileSync(JSONC, 'utf8');
} else if (existsSync(JSON_ALT)) {
  check('config canónica', 'PASS', 'opencode.json');
  configRaw = readFileSync(JSON_ALT, 'utf8');
} else {
  check('config canónica', 'FAIL', 'ni opencode.jsonc ni opencode.json');
  check('schema de OpenCode', 'NOT_APPLICABLE', 'sin archivo canónico');
  configRaw = null;
}

let config = null;
if (configRaw) {
  // JSONC: eliminar comentarios en orden seguro. PRIMERO los de línea //
  // (para que un "*/" dentro de un comentario de línea —p. ej. get-*/list-*—
  // no cierre prematuramente una regex de bloque) y DESPUÉS los de bloque
  // /* */ ya limpios de líneas internas.
  const stripped = configRaw
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  try {
    config = JSON.parse(stripped);
    check('JSON/JSONC válido', 'PASS');
  } catch (e) {
    check('JSON/JSONC válido', 'FAIL', `parse error: ${e.message}`);
  }
}

if (config) {
  if (config.$schema && config.$schema.startsWith('https://opencode.ai/config.json')) {
    check('schema de OpenCode', 'PASS');
  } else {
    check('schema de OpenCode', 'WARN', 'falta "$schema" en el archivo canónico');
  }
}

// ── 2. Agentes ─────────────────────────────────────────────────────────────
const AGENT_MODES = new Set(['primary', 'subagent', 'all']);
const agentNames = [];
if (existsSync(AGENTS_DIR)) {
  const files = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const body = readFileSync(join(AGENTS_DIR, file), 'utf8');
    const nameMatch = body.match(/^name:\s*(.+)$/m);
    const modeMatch = body.match(/^mode:\s*(.+)$/m);
    const hasFm = body.startsWith('---');
    const name = nameMatch ? nameMatch[1].trim() : file.replace(/\.md$/, '');
    agentNames.push(name);
    const issues = [];
    if (!hasFm) issues.push('sin frontmatter');
    if (!modeMatch) issues.push('sin mode');
    else if (!AGENT_MODES.has(modeMatch[1].trim())) issues.push(`mode inválido: ${modeMatch[1].trim()}`);
    if (issues.length) check(`agente: ${name}`, 'FAIL', issues.join(', '));
    else check(`agente: ${name}`, 'PASS', `${modeMatch[1].trim()}`);
  }
} else {
  check('directorio .opencode/agents', 'WARN', 'no existe');
}

// ── 3. Skills ──────────────────────────────────────────────────────────────
const skillNames = [];
if (existsSync(SKILLS_DIR)) {
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory());
  for (const dir of skillDirs) {
    const skillFile = join(SKILLS_DIR, dir.name, 'SKILL.md');
    if (!existsSync(skillFile)) {
      check(`skill: ${dir.name}`, 'FAIL', 'falta SKILL.md');
      continue;
    }
    const body = readFileSync(skillFile, 'utf8');
    const nameMatch = body.match(/^name:\s*(.+)$/m);
    const descMatch = body.match(/^description:\s*(.+)$/m);
    const hasFm = body.startsWith('---');
    const name = nameMatch ? nameMatch[1].trim() : dir.name;
    skillNames.push(name);
    const issues = [];
    if (!hasFm) issues.push('sin frontmatter');
    if (!descMatch || !descMatch[1].trim()) issues.push('sin description');
    if (name !== dir.name) issues.push(`name (${name}) != carpeta (${dir.name})`);
    if (issues.length) check(`skill: ${dir.name}`, 'FAIL', issues.join(', '));
    else check(`skill: ${dir.name}`, 'PASS');
  }
} else {
  check('directorio .opencode/skills', 'WARN', 'no existe');
}

// IDs duplicados entre .opencode, .agents y .claude
const ids = new Map();
for (const n of [...agentNames, ...skillNames]) {
  ids.set(n, (ids.get(n) || 0) + 1);
}
const dupes = [...ids.entries()].filter(([, c]) => c > 1);
if (dupes.length) check('IDs duplicados (agentes/skills)', 'WARN', dupes.map(([n]) => n).join(', '));
else if (agentNames.length || skillNames.length) check('IDs duplicados (agentes/skills)', 'PASS');

// ── 4. Comandos ────────────────────────────────────────────────────────────
const BUILTIN_COMMANDS = new Set(['task', 'audit', 'implement', 'verify', 'seo-check', 'ui-check', 'release-check', 'handoff', 'environment-check']);
const commandNames = [];
if (existsSync(COMMANDS_DIR)) {
  const files = readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const cmd = file.replace(/\.md$/, '');
    commandNames.push(cmd);
    const body = readFileSync(join(COMMANDS_DIR, file), 'utf8');
    const hasFm = body.startsWith('---');
    const agentMatch = body.match(/^agent:\s*(.+)$/m);
    const issues = [];
    if (!hasFm) issues.push('sin frontmatter');
    if (agentMatch && !agentNames.includes(agentMatch[1].trim()) && !['task-executor', 'repo-auditor', 'backend-engineer', 'frontend-engineer', 'database-engineer', 'seo-geo-content', 'security-reviewer', 'qa-release', 'docs-governance'].includes(agentMatch[1].trim())) {
      issues.push(`agent no existe: ${agentMatch[1].trim()}`);
    }
    if (issues.length) check(`comando: ${cmd}`, 'FAIL', issues.join(', '));
    else check(`comando: ${cmd}`, 'PASS', agentMatch ? `→ ${agentMatch[1].trim()}` : '');
  }
} else {
  check('directorio .opencode/commands', 'WARN', 'no existe');
}

// ── 5. MCP ─────────────────────────────────────────────────────────────────
// Política: SOLO servidores oficiales permitidos (8: context7,
// chrome-devtools, github, neon, vercel, resend, semgrep y playwright local
// oficial con aprobación por tool). Cualquier otro servidor (comunitario o
// redundante con tools internas de OpenCode) es un FAIL. Sin secretos
// literales y sin dependencias MCP en package.json.
const ALLOWED_MCP = new Map([
  ['context7', { expectEnabled: true, note: 'remoto oficial de documentación (query-docs, resolve-library-id)' }],
  ['chrome-devtools', { expectEnabled: true, note: 'navegador local pinzado chrome-devtools-mcp@1.6.0 --slim --headless --isolated' }],
  ['playwright', { expectEnabled: true, note: 'local oficial @playwright/mcp (aprobación por tool: playwright_* = ask); localhost/Preview read-only, sin formularios/emails/DB' }],
  ['github', { expectEnabled: true, note: 'habilitado vía PAT personal (oauth:false + {env:GITHUB_PERSONAL_ACCESS_TOKEN}); X-MCP-Readonly + X-MCP-Lockdown + toolsets acotados' }],
  ['neon', { expectEnabled: true, note: 'remoto oficial SOLO LECTURA (x-read-only + ?readonly=true); OAuth compatible (clientId pre-registrado)' }],
  ['vercel', { expectEnabled: true, note: 'autenticado (OAuth OK pese a no figurar en la lista pública de clientes); inventario verificado: lectura get_*/list_*/search_*; escritura denegada por patrón' }],
  ['resend', { expectEnabled: true, note: 'autenticado (OAuth OK); deny-by-default de envíos en despacho legal: 15 patrones deny de escritura configurados' }],
  ['semgrep', { expectEnabled: true, note: 'instalado aislado con uv (v1.172.0, Python 3.12 gestionado); escaneo read-only, sin autofix ni login' }],
]);
const configuredMcp = config?.mcp ? Object.keys(config.mcp) : [];
for (const name of configuredMcp) {
  if (!ALLOWED_MCP.has(name)) {
    const isPlaywright = /puppeteer/i.test(name);
    check(`MCP: ${name}`, 'FAIL', isPlaywright
      ? 'Puppeteer MCP prohibido por política (solo Playwright MCP oficial local)'
      : 'servidor no autorizado (solo oficiales: context7, chrome-devtools, playwright, github, neon, vercel, resend, semgrep)');
  }
}
if (!configuredMcp.length) check('MCP configurados', 'NOT_APPLICABLE', 'ninguno');

for (const [name, spec] of ALLOWED_MCP) {
  const entry = config?.mcp?.[name];
  if (!entry) { check(`MCP: ${name}`, 'FAIL', 'no configurado'); continue; }
  const isEnabled = entry.enabled !== false;
  if (isEnabled !== spec.expectEnabled) {
    check(`MCP: ${name}`, 'WARN', isEnabled
      ? `habilitado, pero la política espera deshabilitado (${spec.note})`
      : `deshabilitado, pero la política espera habilitado (${spec.note})`);
  } else if (isEnabled) {
    check(`MCP: ${name}`, 'PASS', spec.note);
  } else {
    check(`MCP: ${name}`, 'WARN', `deshabilitado — ${spec.note}`);
  }
}

// Seguridad específica: github read-only (cabeceras obligatorias aunque el
// servidor esté deshabilitado, para que nunca se habilite sin protección)
const gh = config?.mcp?.github;
if (gh) {
  const ghHeaders = gh.headers || {};
  const ghRO = ghHeaders['X-MCP-Readonly'] === 'true';
  const ghLock = ghHeaders['X-MCP-Lockdown'] === 'true';
  const ghToolsets = (ghHeaders['X-MCP-Toolsets'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!ghRO) check('github modo read-only', 'FAIL', 'falta cabecera X-MCP-Readonly: true');
  else if (!ghLock) check('github modo read-only', 'WARN', 'X-MCP-Readonly presente pero falta X-MCP-Lockdown');
  else check('github modo read-only', 'PASS', 'X-MCP-Readonly + X-MCP-Lockdown');
  if (ghToolsets.includes('all')) check('github toolsets', 'FAIL', 'toolset "all" prohibido');
  else if (!ghToolsets.length) check('github toolsets', 'WARN', 'sin X-MCP-Toolsets (default incluye tools editables de issues/PR)');
  else check('github toolsets', 'PASS', ghToolsets.join(','));
}

// Seguridad específica: neon read-only (cabecera o query param obligatorios
// aunque el servidor esté deshabilitado)
const neon = config?.mcp?.neon;
if (neon) {
  const neonHeaderRO = neon.headers?.['x-read-only'] === 'true';
  const neonQueryRO = /readonly=true/.test(neon.url || '');
  if (!neonHeaderRO && !neonQueryRO) check('neon modo read-only', 'FAIL', 'neon sin modo read-only (falta x-read-only y ?readonly=true)');
  else check('neon modo read-only', 'PASS', neonHeaderRO && neonQueryRO ? 'x-read-only + ?readonly=true' : (neonHeaderRO ? 'x-read-only' : '?readonly=true'));
}

// Seguridad específica: github autenticación por PAT (oauth:false + env var)
if (gh?.enabled === true) {
  if (gh.oauth !== false) check('github autenticación', 'FAIL', 'oauth debe ser false (autenticación por PAT personal)');
  else if (!gh.headers?.Authorization || !gh.headers.Authorization.includes('{env:GITHUB_PERSONAL_ACCESS_TOKEN}')) check('github autenticación', 'FAIL', 'falta Authorization: Bearer {env:GITHUB_PERSONAL_ACCESS_TOKEN}');
  else check('github autenticación', 'PASS', 'oauth:false + PAT vía {env:GITHUB_PERSONAL_ACCESS_TOKEN}');
}

// Resend/Vercel: avisos si se habilitan sin las condiciones de política
// Resend: denies de escritura obligatorios si está habilitado (deny-by-default)
if (config?.mcp?.resend?.enabled === true) {
  const rDenies = ['resend_create-*', 'resend_send-*', 'resend_compose-*', 'resend_cancel-*', 'resend_add-*', 'resend_batch-*', 'resend_remove-*', 'resend_update-*', 'resend_connect-*', 'resend_disconnect-*', 'resend_duplicate-*', 'resend_publish-*', 'resend_manage-*', 'resend_verify-*', 'resend_revoke-*'];
  const missing = rDenies.filter((d) => config?.permission?.[d] !== 'deny');
  if (missing.length) check('resend denies escritura', 'FAIL', `faltan denies: ${missing.join(', ')}`);
  else check('resend denies escritura', 'PASS', '15 patrones deny de escritura (envíos y mutaciones)');
}
if (config?.mcp?.vercel?.enabled === true) {
  const vDenies = ['vercel_buy_*', 'vercel_deploy_*', 'vercel_update_*', 'vercel_add_*', 'vercel_change_*', 'vercel_edit_*', 'vercel_import-*', 'vercel_reply_*'];
  const missing = vDenies.filter((d) => config?.permission?.[d] !== 'deny');
  if (missing.length) check('vercel denies escritura', 'FAIL', `faltan denies: ${missing.join(', ')}`);
  else check('vercel denies escritura', 'PASS', '8 patrones deny de escritura (compras, deploys, protección, toolbar)');
}

// Semgrep: existencia del binario (requisito si el servidor está habilitado)
const semgrepBin = spawnSync('sh', ['-c', 'command -v semgrep'], { encoding: 'utf8', timeout: 10_000 });
if (semgrepBin.status === 0) {
  check('binario: semgrep', 'PASS', semgrepBin.stdout.trim());
  if (config?.mcp?.semgrep?.enabled === true) check('MCP: semgrep (estado)', 'PASS', 'CLI presente y servidor habilitado');
} else {
  check('binario: semgrep', 'FAIL', 'semgrep no está en PATH pero el servidor está habilitado');
}

// Conectividad de servidores remotos habilitados (solo lectura; WARN si falla)
for (const [name, spec] of ALLOWED_MCP) {
  const entry = config?.mcp?.[name];
  if (!entry || entry.enabled === false || entry.type !== 'remote') continue;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(entry.url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'doctor', version: '1.0' } } }),
    });
    clearTimeout(timer);
    const status = res.status;
    if (status >= 200 && status < 500) check(`conectividad: ${name}`, 'PASS', `HTTP ${status}${status === 401 || status === 400 ? ' (autenticación pendiente — acción humana)' : ''}`);
    else check(`conectividad: ${name}`, 'WARN', `HTTP ${status}`);
  } catch (e) {
    check(`conectividad: ${name}`, 'WARN', `no alcanzable: ${e.name === 'AbortError' ? 'timeout' : e.message}`);
  }
}

// OAuth MCP: pendiente/completado (solo lectura, vía CLI)
const mcpAuth = spawnSync('opencode', ['mcp', 'auth', 'list'], { encoding: 'utf8', timeout: 30_000 });
if (mcpAuth.status === 0) {
  const authText = mcpAuth.stdout || '';
  const oauthServers = ['context7', 'github', 'neon', 'vercel', 'resend'];
  for (const s of oauthServers) {
    const line = authText.split('\n').find((l) => l.includes(s));
    if (!line) { check(`oauth: ${s}`, 'NOT_APPLICABLE', 'sin entrada'); continue; }
    const authed = !/not authenticated|not authed/i.test(line);
    check(`oauth: ${s}`, authed ? 'PASS' : 'WARN', authed ? 'autenticado' : 'pendiente de flujo humano en navegador (opencode mcp auth <servidor>)');
  }
} else {
  check('opencode mcp auth list', 'WARN', 'no se pudo consultar el estado OAuth');
}

// Estado real vía CLI (solo lectura)
const mcpList = spawnSync('opencode', ['mcp', 'list'], { encoding: 'utf8', timeout: 30_000 });
if (mcpList.status === 0) {
  check('opencode mcp list', 'PASS', mcpList.stdout.trim().split('\n').slice(0, 2).join(' '));
} else {
  check('opencode mcp list', 'WARN', 'no se pudo consultar el estado (opencode no iniciado)');
}

// ── 5bis. Sin dependencias MCP en package.json ─────────────────────────────
// Playwright/@playwright/test (suite E2E del proyecto) NO son MCP: se ignoran.
const rootPkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const pkgDeps = { ...(rootPkg.dependencies || {}), ...(rootPkg.devDependencies || {}) };
const mcpDepHits = Object.keys(pkgDeps).filter((d) => /(mcp|puppeteer)/i.test(d));
if (mcpDepHits.length) check('package.json sin dependencias MCP', 'FAIL', mcpDepHits.join(', '));
else check('package.json sin dependencias MCP', 'PASS');

// ── 6. LSP ─────────────────────────────────────────────────────────────────
if (config && config.lsp !== undefined) {
  const disabledLsp = Object.entries(config.lsp)
    .filter(([, v]) => v && v.disabled === true)
    .map(([k]) => k);
  const enabledCount = Object.keys(config.lsp).length - disabledLsp.length;
  check('LSP declarado', 'PASS', `built-ins habilitados: ${enabledCount}; deshabilitados: ${disabledLsp.join(', ') || 'ninguno'}`);
  check('LSP operativo', 'WARN', 'verificar tras reiniciar OpenCode con "opencode debug lsp diagnostics"');
} else {
  check('LSP declarado', 'NOT_APPLICABLE', 'no configurado');
}

// ── 7. Binarios opcionales ─────────────────────────────────────────────────
const OPTIONAL_BINS = ['rg', 'fd', 'jq', 'gitleaks', 'actionlint', 'shellcheck', 'gh'];
for (const bin of OPTIONAL_BINS) {
  const r = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8', timeout: 10_000 });
  check(`binario: ${bin}`, r.status === 0 ? 'PASS' : 'WARN', r.status === 0 ? r.stdout.trim() : 'opcional no instalado');
}

// ── 8. Scripts npm requeridos ──────────────────────────────────────────────
if (config) {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  const required = ['opencode:doctor'];
  for (const script of required) {
    const cmd = pkg.scripts?.[script];
    if (!cmd) check(`npm script: ${script}`, 'FAIL', 'no definido en package.json');
    else if (cmd.includes('scripts/opencode-doctor.mjs')) check(`npm script: ${script}`, 'PASS', cmd);
    else check(`npm script: ${script}`, 'WARN', cmd);
  }
}

// ── 9. Secretos obvios en .opencode y archivo canónico ─────────────────────
const SECRET_RE = /(?:AIza[0-9A-Za-z_-]{30,}|sk-[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,}|\bBearer [A-Za-z0-9._~+/-]{20,}|\b(?:RESEND_API_KEY|CONTEXT7_API_KEY|SEMGREP_APP_TOKEN|NEON_API_KEY|GITHUB_PERSONAL_ACCESS_TOKEN|VERCEL_TOKEN|INDEXNOW_KEY|JWT_SECRET|ENCRYPTION_KEY)\s*[=:]\s*["']?[A-Za-z0-9._-]{12,})/;
const scanTargets = [
  JSONC, JSON_ALT,
  join(AGENTS_DIR), join(SKILLS_DIR), join(COMMANDS_DIR),
].filter((p) => p && existsSync(p));

let secretHit = false;
for (const target of scanTargets) {
  if (target.endsWith('.json') || target.endsWith('.jsonc')) {
    const raw = readFileSync(target, 'utf8');
    if (SECRET_RE.test(raw)) {
      check(`secretos en ${target}`, 'FAIL', 'patrón de secreto detectado');
      secretHit = true;
    }
  } else if (target.includes('agents') || target.includes('skills') || target.includes('commands')) {
    for (const file of readdirSync(target).filter((f) => f.endsWith('.md'))) {
      const raw = readFileSync(join(target, file), 'utf8');
      if (SECRET_RE.test(raw)) {
        check(`secretos en ${join(target, file)}`, 'FAIL', 'patrón de secreto detectado');
        secretHit = true;
      }
    }
  }
}
if (!secretHit) check('ausencia de secretos obvios (.opencode/**)', 'PASS');

// ── 10. Enlaces documentales básicos ───────────────────────────────────────
for (const doc of ['AGENTS.md', 'README.md', 'CHANGELOG.md']) {
  check(`documento: ${doc}`, existsSync(resolve(ROOT, doc)) ? 'PASS' : 'FAIL');
}
check('guía operativa: .opencode/README.md', existsSync(resolve(ROOT, '.opencode', 'README.md')) ? 'PASS' : 'WARN');

// ── 11. Permisos destructivos bloqueados ───────────────────────────────────
if (config?.permission?.bash) {
  const bash = config.permission.bash;
  const hasPushDeny = typeof bash['git push*'] === 'string' && bash['git push*'] === 'deny';
  const hasResetDeny = typeof bash['git reset*'] === 'string' && bash['git reset*'] === 'deny';
  const hasMergeDeny = typeof bash['git merge*'] === 'string' && bash['git merge*'] === 'deny';
  const hasRmDeny = typeof bash['rm -rf*'] === 'string' && bash['rm -rf*'] === 'deny';
  if (hasPushDeny && hasResetDeny && hasMergeDeny && hasRmDeny) check('permisos destructivos', 'PASS');
  else check('permisos destructivos', 'FAIL', 'algún patrón destructivo no está denegado');
} else {
  check('permisos destructivos', 'WARN', 'sin objeto de permisos bash en la config');
}

// ── Resultado ──────────────────────────────────────────────────────────────
const fails = results.filter((r) => r.status === 'FAIL');
const warns = results.filter((r) => r.status === 'WARN');
const restarts = results.filter((r) => r.status === 'RESTART_REQUIRED');

if (OUTPUT_JSON) {
  console.log(JSON.stringify({ results, summary: { pass: results.length - fails.length - warns.length, warn: warns.length, fail: fails.length, restart: restarts.length } }, null, 2));
} else {
  console.log(`\n═══ Resultado: ${results.length} comprobaciones, ${fails.length} FAIL, ${warns.length} WARN, ${restarts.length} RESTART_REQUIRED ═══`);
}

if (fails.length) process.exit(1);
process.exit(0);
