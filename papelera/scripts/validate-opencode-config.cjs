const fs = require('fs');
const raw = fs.readFileSync('opencode.jsonc', 'utf8');
const stripped = raw
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const obj = JSON.parse(stripped);
console.log('JSONC parse OK');
console.log('neon.command =', JSON.stringify(obj.mcp.neon.command));
console.log('neon.enabled =', obj.mcp.neon.enabled);
console.log('neon.environment =', obj.mcp.neon.environment ?? '(removed)');
