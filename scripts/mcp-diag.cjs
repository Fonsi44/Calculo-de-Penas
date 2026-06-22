#!/usr/bin/env node
// MCP diagnostic server — expone herramientas de diagnóstico del sistema.
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { execSync } = require('child_process');

const pkg = require('../package.json');

const server = new Server(
  {
    name: 'justicia-verdadera-diag',
    version: pkg.version ?? '1.0.0',
  },
  {
    capabilities: { tools: {} },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'diag_env',
      description: 'Muestra variables de entorno relevantes (sin secretos)',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'diag_node',
      description: 'Muestra versión de Node.js y memoria',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'diag_ping',
      description: 'Verifica conectividad a un host',
      inputSchema: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Host o IP a verificar' },
        },
        required: ['target'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'diag_env': {
      const safe = [
        'NODE_ENV', 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SITE_NAME',
        'NEXT_PUBLIC_NOINDEX', 'npm_node_execpath',
        'PATH', 'OS', 'USERNAME', 'COMPUTERNAME',
      ];
      const result = {};
      for (const key of safe) {
        result[key] = process.env[key] ?? '(no definida)';
      }
      const dbUrl = process.env.DATABASE_URL;
      result['DATABASE_URL'] = dbUrl
        ? dbUrl.replace(/:[^:@]+@/, ':****@')
        : '(no definida)';
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'diag_node': {
      const info = {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        memory: process.memoryUsage(),
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
      };
    }
    case 'diag_ping': {
      const target = args?.target;
      if (!target) throw new Error('target es requerido');
      try {
        const isWin = process.platform === 'win32';
        const cmd = isWin
          ? `ping -n 2 ${target}`
          : `ping -c 2 ${target}`;
        const out = execSync(cmd, { timeout: 10000, encoding: 'utf8' });
        return {
          content: [{ type: 'text', text: out }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((err) => {
  process.stderr.write(`[mcp-diag] fatal: ${err.message}\n`);
  process.exit(1);
});
