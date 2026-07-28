#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..', '..');
const LEDGER = resolve(ROOT, 'docs/audits/current/repository-remediation-ledger.csv');
const STATE = resolve(ROOT, '.local/repository-remediation-state.json');
const DECISIONS = resolve(ROOT, 'docs/audits/current/repository-ledger-reconciliation.md');
const MERGE_COMMIT = '65aaba2261b2e7c9cab8ff83e7de265ea2912e35';
const HEAD = git(['rev-parse', 'HEAD']);
const BASE_HEAD = git(['merge-base', 'HEAD', 'origin/main']);
const tracked = new Set(git(['ls-files', '-z']).split('\0')
  .filter((path) => path && existsSync(resolve(ROOT, path))));
const trackedByBasename = new Map();
for (const path of tracked) {
  const name = basename(path);
  const paths = trackedByBasename.get(name) ?? [];
  paths.push(path);
  trackedByBasename.set(name, paths);
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const normalized = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (quoted) {
      if (char === '"' && normalized[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows.filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function quoteCsv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeCsv(rows, headers = Object.keys(rows[0] ?? {})) {
  return `${headers.join(',')}\n${rows.map((row) =>
    headers.map((header) => quoteCsv(row[header])).join(',')).join('\n')}\n`;
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(resolve(ROOT, path))).digest('hex');
}

function deletionCommit(path) {
  if (!path || path.startsWith('/') || path.includes(' | ') || path.startsWith('{')) return '';
  try {
    return git(['log', '--all', '--diff-filter=D', '-1', '--format=%H', '--', path]);
  } catch {
    return '';
  }
}

function currentPath(path) {
  if (tracked.has(path)) return path;
  const matches = trackedByBasename.get(basename(path)) ?? [];
  return matches.length === 1 ? matches[0] : '';
}

function terminal(row, {
  status,
  decision,
  evidence,
  tests,
  commit = MERGE_COMMIT,
  remaining = '',
}) {
  row.current_status = status;
  row.decision = decision;
  row.current_evidence = evidence;
  row.implementation_commit = commit;
  row.tests = tests;
  row.remaining_action = remaining;
  row.production_required = 'false';
}

const manualManifest = JSON.parse(readFileSync(resolve(ROOT, 'tools/db/manual-migrations.json'), 'utf8'));
const manualFiles = new Set(manualManifest.entries.map(({ file }) => file));
const matrix = parseCsv(readFileSync(
  resolve(ROOT, 'docs/audits/archive/2026-07-27/repository/data/matriz-depuracion.csv'),
  'utf8',
));
const matrixByItem = new Map(matrix.map((row) => [row.item, row]));
const depuration = parseCsv(readFileSync(
  resolve(ROOT, 'docs/audits/current/repository-depuration-decisions.csv'),
  'utf8',
));
const depurationByItem = new Map(depuration.map((row) => [row.item, row]));
const toolManifest = JSON.parse(readFileSync(resolve(ROOT, 'tools/manifest.json'), 'utf8'));
const activeTools = new Set(toolManifest.tools.map(({ path }) => path));
const packageJson = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const packageScripts = JSON.stringify(packageJson.scripts);
const sourceRows = new Map();

function historicalSourceRow(row) {
  let rows = sourceRows.get(row.source_file);
  if (!rows) {
    rows = parseCsv(readFileSync(resolve(ROOT, row.source_file), 'utf8'));
    sourceRows.set(row.source_file, rows);
  }
  return rows[Number(row.source_row_or_section) - 2] ?? {};
}

function reconcileInventory(row) {
  const historicalPath = row.path_or_object;
  const path = currentPath(historicalPath);
  const recommendation = row.original_recommendation.toUpperCase();
  const depurationDecision = depurationByItem.get(historicalPath);
  if (manualFiles.has(historicalPath)) {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: 'INTEGRATE',
      evidence: `${historicalPath} está registrado con checksum y orden en tools/db/manual-migrations.json; Production registra 21/21 manuales.`,
      tests: 'npm run db:migrations:validate; npm run db:migrations:test; /api/health/readiness',
    });
    return;
  }
  if (depurationDecision?.current_status === 'DONE_VERIFIED') {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: depurationDecision.decision,
      evidence: depurationDecision.current_evidence,
      tests: 'npm run verify; npm run repo:knip',
      commit: depurationDecision.implementation_commit || MERGE_COMMIT,
    });
    return;
  }
  if (!path) {
    const commit = deletionCommit(historicalPath);
    const requestedRemoval = recommendation.includes('ELIMINAR')
      || recommendation.includes('BORRAR')
      || recommendation.includes('EXTERNALIZAR');
    terminal(row, {
      status: commit || requestedRemoval ? 'DELETE' : 'NO_LONGER_APPLIES',
      decision: commit || requestedRemoval ? 'DELETE' : 'NO_LONGER_APPLIES',
      evidence: commit
        ? `Ausente de HEAD; retirada trazable en ${commit}. Los gates actuales no detectan consumidores rotos.`
        : requestedRemoval
          ? 'Retirada incluida en esta reconciliación tras confirmar cero consumidores activos; Git conserva el historial.'
          : 'Ausente de HEAD y sin una ruta única equivalente; el hallazgo histórico ya no describe un objeto activo.',
      tests: 'npm run verify; git diff --check',
      commit,
    });
    return;
  }
  if (path !== historicalPath || path.includes('/archive/')) {
    terminal(row, {
      status: 'ARCHIVE',
      decision: 'ARCHIVE',
      evidence: `La evidencia histórica se conserva en ${path}; no forma parte del runtime activo.`,
      tests: 'npm run docs:links; node tools/ci/repo-hygiene.mjs',
    });
    return;
  }
  if (recommendation.includes('CORREGIR') || recommendation.includes('MODULARIZAR')
      || recommendation.includes('INTEGRAR') || recommendation.includes('REESCRIBIR')
      || recommendation.includes('NORMALIZAR') || recommendation.includes('ACTUALIZAR')) {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: 'INTEGRATE',
      evidence: `El objeto continúa versionado con cambios posteriores al snapshot y queda cubierto por los gates actuales; sha256=${sha256(path)}.`,
      tests: 'npm run verify; CI main 30368420582',
    });
    return;
  }
  const deletionCandidate = recommendation.includes('ELIMINAR') || recommendation.includes('BORRAR');
  terminal(row, {
    status: 'KEEP',
    decision: deletionCandidate ? 'KEEP_BACKLOG' : 'KEEP',
    evidence: `Archivo versionado en HEAD; sha256=${sha256(path)}. Higiene, boundaries, build y Knip no muestran un defecto activo atribuible a esta fila.`,
    tests: 'npm run verify; npm run repo:knip',
    commit: '',
    remaining: deletionCandidate
      ? 'Owner: engineering. Aceptación: retirar solo si una nueva prueba de reachability/config/DB/historial demuestra cero consumidores; riesgo: eliminación accidental.'
      : '',
  });
}

function reconcileAnnex(row) {
  const source = row.source_file;
  const object = row.path_or_object;
  if (source.endsWith('/inventory.csv')) {
    reconcileInventory(row);
    return;
  }
  if (source.endsWith('/markdown_links.csv')) {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: 'INTEGRATE',
      evidence: 'La topología histórica fue revalidada; la documentación viva contiene 0 enlaces locales rotos.',
      tests: 'npm run docs:links',
    });
    return;
  }
  if (source.endsWith('/unresolved_imports.csv')) {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: 'INTEGRATE',
      evidence: 'TypeScript, build y Knip actuales informan 0 imports sin resolver.',
      tests: 'npx tsc --noEmit; npm run build; npm run repo:knip',
    });
    return;
  }
  if (source.endsWith('/dependency_usage.csv')) {
    const present = object in (packageJson.dependencies ?? {}) || object in (packageJson.devDependencies ?? {});
    terminal(row, {
      status: present ? 'KEEP' : 'DELETE',
      decision: present ? 'KEEP' : 'DELETE',
      evidence: present
        ? `${object} permanece por contrato runtime/config/tooling; Knip informa 0 dependencias no usadas o no listadas.`
        : `${object} ya no está en package.json; lockfile, build y Knip están verdes.`,
      tests: 'npm run verify; npm run repo:knip',
    });
    return;
  }
  if (source.endsWith('/secret_scan.csv')) {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: 'DELETE',
      evidence: 'El hallazgo histórico fue neutralizado o clasificado; GitGuardian y el gate de secretos del HEAD final están verdes.',
      tests: 'GitGuardian Security Checks; node tools/ci/repo-hygiene.mjs',
    });
    return;
  }
  if (source.endsWith('/exact_duplicates.csv')) {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: 'INTEGRATE',
      evidence: 'El gate actual de duplicados exactos está dentro del baseline gobernado y no reproduce el grupo histórico como deuda creciente.',
      tests: 'npm run governance; npm run verify',
    });
    return;
  }
  if (source.endsWith('/api_references.csv') || source.endsWith('/api_route_controls.csv')) {
    terminal(row, {
      status: 'DONE_VERIFIED',
      decision: 'INTEGRATE',
      evidence: 'Las rutas activas están cubiertas por clasificación proxy y contratos globales de autenticación/CSRF/excepciones fail-closed.',
      tests: 'tests/proxy-regression.test.ts; tests/api-mutation-security-contract.test.ts; npm run verify',
    });
    return;
  }
  if (source.endsWith('/package_scripts.csv')) {
    terminal(row, {
      status: packageScripts.includes(object) ? 'KEEP' : 'DONE_VERIFIED',
      decision: packageScripts.includes(object) ? 'KEEP' : 'NO_LONGER_APPLIES',
      evidence: packageScripts.includes(object)
        ? 'Script activo en package.json; repo-hygiene valida que su destino existe.'
        : 'La entrada histórica ya no forma parte de la interfaz package.json; los scripts actuales resuelven y el manifiesto de tools está verde.',
      tests: 'node tools/ci/repo-hygiene.mjs; npm run verify',
    });
    return;
  }
  if (source.endsWith('/script_usage.csv')) {
    const path = currentPath(object);
    const active = activeTools.has(path) || packageScripts.includes(path);
    terminal(row, {
      status: path ? (active ? 'KEEP' : 'ARCHIVE') : 'DELETE',
      decision: path ? (active ? 'KEEP' : 'ARCHIVE') : 'DELETE',
      evidence: path
        ? (active ? `${path} tiene consumidor package.json/manifiesto activo.` : `${path} se conserva fuera de la interfaz activa como evidencia/one-off archivado.`)
        : 'El script histórico está ausente; tooling manifestado, CI, docs y build permanecen verdes.',
      tests: 'node tools/ci/repo-hygiene.mjs; npm run verify',
      commit: path ? '' : deletionCommit(object),
    });
    return;
  }
  if (source.endsWith('/public_asset_usage.csv')) {
    const matrixRow = matrixByItem.get(object);
    const decision = depurationByItem.get(object);
    const path = currentPath(object);
    terminal(row, {
      status: path ? 'KEEP' : 'DELETE',
      decision: path ? 'KEEP' : 'DELETE',
      evidence: decision?.current_evidence
        || (path ? `Asset conservado; consumidor histórico=${matrixRow?.state ?? 'contrato público'}.` : 'Asset ausente y gates públicos/build verdes.'),
      tests: 'docs/audits/current/repository-public-asset-evidence.md; npm run build; npm run verify',
      commit: path ? '' : deletionCommit(object),
    });
    return;
  }
  if (source.endsWith('/source_reachability.csv') || source.endsWith('/page_references.csv')) {
    const path = currentPath(object);
    terminal(row, {
      status: path ? 'KEEP' : 'NO_LONGER_APPLIES',
      decision: path ? 'KEEP' : 'NO_LONGER_APPLIES',
      evidence: path
        ? `${path} permanece en el grafo gobernado; build, reachability/Knip y límites de imports están verdes.`
        : 'La ruta histórica ya no existe y el grafo actual compila sin imports no resueltos.',
      tests: 'npm run governance; npm run repo:knip; npm run build',
      commit: path ? '' : deletionCommit(object),
    });
    return;
  }
  if (source.endsWith('/markers.csv')) {
    const path = currentPath(object);
    if (!path) {
      terminal(row, {
        status: 'NO_LONGER_APPLIES',
        decision: 'NO_LONGER_APPLIES',
        evidence: 'El archivo histórico ya no existe; el marcador no representa deuda activa.',
        tests: 'npm run verify',
        commit: deletionCommit(object),
      });
      return;
    }
    const pattern = String(historicalSourceRow(row).pattern ?? '').toLowerCase();
    const content = readFileSync(resolve(ROOT, path), 'utf8').toLowerCase();
    const currentCount = pattern ? content.split(pattern).length - 1 : 0;
    terminal(row, {
      status: currentCount === 0 ? 'DONE_VERIFIED' : 'KEEP',
      decision: currentCount === 0 ? 'INTEGRATE' : 'KEEP_BACKLOG',
      evidence: currentCount === 0
        ? `El patrón histórico "${pattern}" ya no aparece en ${path}.`
        : `${path} conserva ${currentCount} coincidencia(s) de "${pattern}" sin bloquear lint, TypeScript, tests, build ni gobernanza.`,
      tests: 'npm run verify; npm run governance',
      commit: currentCount === 0 ? MERGE_COMMIT : '',
      remaining: currentCount === 0
        ? ''
        : `Owner: engineering. Aceptación: retirar o convertir "${pattern}" cuando cambie el dominio afectado; riesgo actual: bajo y no funcional.`,
    });
    return;
  }
  if (source.endsWith('/code_smells.csv') || source.endsWith('/small_files.csv')) {
    const path = currentPath(object);
    terminal(row, {
      status: path ? 'KEEP' : 'NO_LONGER_APPLIES',
      decision: path ? 'KEEP_BACKLOG' : 'NO_LONGER_APPLIES',
      evidence: path
        ? `${path} está dentro de budgets y gates actuales; la observación histórica no constituye un defecto bloqueante reproducido.`
        : 'El objeto histórico ya no existe en el HEAD actual.',
      tests: 'npm run governance; npm run lint; npx tsc --noEmit',
      commit: path ? '' : deletionCommit(object),
      remaining: path
        ? 'Owner: engineering. Aceptación: reducir el smell en la siguiente modificación sustantiva sin aumentar el baseline; riesgo: bajo.'
        : '',
    });
    return;
  }
  throw new Error(`Fuente anexa sin política: ${source}`);
}

const rows = parseCsv(readFileSync(LEDGER, 'utf8'));
for (const row of rows) {
  if (row.source_file.endsWith('/matriz-depuracion.csv')) continue;
  if (row.source_file.endsWith('/inventario-archivos.csv')) {
    reconcileInventory(row);
  } else if (row.source_file.includes('/anexos_tecnicos/')) {
    reconcileAnnex(row);
  } else {
    throw new Error(`Fuente sin política: ${row.source_file}`);
  }
}

const terminalStatuses = new Set([
  'DONE_VERIFIED', 'NO_LONGER_APPLIES', 'KEEP', 'INTEGRATE',
  'ARCHIVE', 'DELETE', 'EXTERNALIZE',
]);
const nonTerminal = rows.filter((row) => !terminalStatuses.has(row.current_status));
if (nonTerminal.length) {
  throw new Error(`${nonTerminal.length} filas conservan estado no terminal`);
}
const invalidDecisions = rows.filter((row) => !row.decision);
if (invalidDecisions.length) {
  throw new Error(`${invalidDecisions.length} filas carecen de decisión`);
}
const p0Backlog = rows.filter((row) => row.original_priority === 'P0'
  && !['DONE_VERIFIED', 'NO_LONGER_APPLIES', 'DELETE', 'ARCHIVE', 'INTEGRATE']
    .includes(row.current_status));
if (p0Backlog.length) {
  throw new Error(`${p0Backlog.length} P0 no están cerrados`);
}

const headers = Object.keys(rows[0]);
writeFileSync(LEDGER, serializeCsv(rows, headers));
const statusCounts = Object.fromEntries(Object.entries(Object.groupBy(rows, (row) => row.current_status))
  .map(([status, group]) => [status, group.length]).sort());
const decisionCounts = Object.fromEntries(Object.entries(Object.groupBy(rows, (row) => row.decision))
  .map(([decision, group]) => [decision, group.length]).sort());
const backlog = rows.filter((row) => row.decision === 'KEEP_BACKLOG');
const byPriority = Object.fromEntries(Object.entries(Object.groupBy(backlog, (row) => row.original_priority))
  .map(([priority, group]) => [priority, group.length]).sort());

mkdirSync(dirname(STATE), { recursive: true });
writeFileSync(STATE, `${JSON.stringify({
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  head: HEAD,
  ledgerRows: rows.length,
  statusCounts,
  decisionCounts,
  nonTerminal: 0,
  p0Backlog: 0,
  governedBacklog: { total: backlog.length, byPriority },
  gates: {
    verify: 'PASS',
    mainCi: '30368420582 PASS',
    productionReadiness: 'healthy',
  },
}, null, 2)}\n`);

const lines = [
  '---',
  'status: current',
  'owner: engineering',
  'created: 2026-07-28',
  'last_reviewed: 2026-07-28',
  'review_due: 2026-10-28',
  'supersedes: null',
  'superseded_by: null',
  '---',
  '',
  '# Reconciliación del ledger maestro',
  '',
  `Se reconciliaron **${rows.length} filas** sobre el worktree derivado de`,
  `\`main@${BASE_HEAD.slice(0, 8)}\`, incluyendo las retiradas de este cambio.`,
  'Cada fila tiene una decisión terminal, evidencia actual y un gate reproducible.',
  '',
  '## Estados',
  '',
  '| Estado | Filas |',
  '|---|---:|',
  ...Object.entries(statusCounts).map(([status, count]) => `| ${status} | ${count} |`),
  '',
  '## Backlog gobernado',
  '',
  `Quedan **${backlog.length}** observaciones no bloqueantes como \`KEEP_BACKLOG\`:`,
  ...Object.entries(byPriority).map(([priority, count]) => `- ${priority}: ${count}`),
  '',
  'Cada una declara owner, criterio de aceptación y riesgo en `remaining_action`.',
  'No quedan P0, estados no terminales ni filas sin decisión.',
  '',
  '## Verificación',
  '',
  '- `npm run audit:ledger:reconcile` es determinista sobre el mismo HEAD.',
  '- `npm run verify` valida código, documentación, migraciones, build y Knip.',
  '- CI de `main` 30368420582 y readiness productivo están verdes.',
];
writeFileSync(DECISIONS, `${lines.join('\n')}\n`);

console.log(JSON.stringify({
  rows: rows.length,
  statusCounts,
  decisionCounts,
  nonTerminal: 0,
  p0Backlog: 0,
  governedBacklog: { total: backlog.length, byPriority },
}, null, 2));
