#!/usr/bin/env node
// MCP server for PostgreSQL — lanza el servidor oficial con DATABASE_URL del entorno.
const { spawn } = require('child_process');

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
