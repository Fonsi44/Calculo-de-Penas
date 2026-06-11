'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'delitos.json');

function main() {
  const raw = fs.readFileSync(FILE, 'utf8');
  const data = JSON.parse(raw);

  const seen = new Map();
  const out = [];
  let removed = 0;

  for (const item of data) {
    const k = `${item.nombre}|${item.articulo}`;
    if (seen.has(k)) {
      removed += 1;
      continue;
    }
    seen.set(k, true);
    out.push(item);
  }

  if (removed === 0) {
    console.log(`OK: data/delitos.json ya esta deduplicado (${data.length} registros)`);
    process.exit(0);
  }

  fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Deduplicado: ${data.length} -> ${out.length} registros (${removed} duplicados eliminados)`);
}

main();
