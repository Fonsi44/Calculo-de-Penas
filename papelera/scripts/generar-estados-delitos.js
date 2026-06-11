const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'delitos-validacion.csv');
const outPath = path.join(__dirname, '..', 'data', 'delitos-estados.json');

if (!fs.existsSync(csvPath)) {
  console.error('No se encontró data/delitos-validacion.csv. Ejecuta primero:');
  console.error('  node scripts/validate-delitos-tfidf.js');
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);
const header = lines.shift();
if (!header || !header.startsWith('nombre,')) {
  console.error('CSV con formato inesperado. Cabecera:', header);
  process.exit(1);
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const estados = {};
let ok = 0, revisar = 0, noEncontrado = 0;

lines.forEach((line) => {
  const cols = parseCsvLine(line);
  const status = cols[2];
  if (!status) return;
  const key = `${cols[0]}__${cols[1]}`;
  let estado = 'verificado';
  let nota = null;
  if (status === 'OK') {
    estado = 'verificado';
    ok++;
  } else if (status === 'REVISAR') {
    estado = 'pendiente_revision';
    nota = `Sugerencia: ${cols[3] || ''} (${cols[4] || ''})`;
    revisar++;
  } else if (status === 'NO_ENCONTRADO') {
    estado = 'rechazado';
    nota = `No encontrado en CP. Sugerencia: ${cols[3] || ''}`;
    noEncontrado++;
  } else {
    estado = 'pendiente_revision';
    nota = `Estado desconocido: ${status}`;
    revisar++;
  }
  estados[key] = {
    nombre: cols[0],
    articulo: cols[1],
    estado,
    nota,
    articulo_sugerido: cols[3] || null,
  };
});

const total = ok + revisar + noEncontrado;
const out = {
  generado_en: new Date().toISOString(),
  fuente: 'data/delitos-validacion.csv',
  total_registros: total,
  verificados: ok,
  pendientes_revision: revisar,
  rechazados: noEncontrado,
  entradas: estados,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Estados generados: ${total} entradas (${ok} OK, ${revisar} revisar, ${noEncontrado} rechazados)`);
console.log(`Archivo: ${outPath}`);
