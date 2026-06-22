#!/usr/bin/env node
// MCP server for PostgreSQL — lanza el servidor oficial con DATABASE_URL del entorno.
const { spawn } = require('child_process');
const path = require('path');

// Cargar .env si existe (como load-env.cjs pero inline para no depender de require)
(function loadDotenv() {
  try {
    const fs = require('fs');
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let value = m[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  } catch { /* ignore */ }
})();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  process.stderr.write('[mcp-postgres] FATAL: DATABASE_URL no está definida\n');
  process.exit(1);
}

const localBin = require.resolve('@modelcontextprotocol/server-postgres/dist/index.js');
const child = spawn(process.execPath, [localBin, dbUrl], {
  stdio: 'inherit',
  env: process.env,
  windowsHide: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  process.stderr.write(`[mcp-postgres] error: ${err.message}\n`);
  process.exit(127);
});
