const fs = require('fs');
const path = require('path');

const delitos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'delitos.json'), 'utf8'));
const articulos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'articulos_cp.json'), 'utf8'));

const artMap = new Map();
articulos.forEach(a => {
  const m = a.articulo && a.articulo.match(/\d+/);
  if (m) artMap.set(m[0], a);
});

const normalize = (s) => (s || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, '')
  .replace(/\s+/g, ' ').trim();

const tokens = (s) => normalize(s).split(' ').filter(w => w.length > 3);

function similarity(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  const inter = [...ta].filter(t => tb.has(t)).length;
  return inter / Math.max(ta.size, tb.size);
}

let exact = 0;
let close = 0;
let weak = 0;
let none = 0;
const weakExamples = [];
const noneExamples = [];

delitos.forEach(d => {
  const m = (d.articulo || '').match(/\d+/);
  if (!m) { none++; if (noneExamples.length < 10) noneExamples.push({ nombre: d.nombre, articulo: d.articulo, reason: 'sin número' }); return; }
  const art = artMap.get(m[0]);
  if (!art) { none++; if (noneExamples.length < 10) noneExamples.push({ nombre: d.nombre, articulo: d.articulo, reason: 'artículo no existe en CP' }); return; }
  const sim = similarity(d.nombre, art.epigrafe || '');
  if (sim >= 0.7) exact++;
  else if (sim >= 0.4) close++;
  else if (sim >= 0.2) { weak++; if (weakExamples.length < 15) weakExamples.push({ nombre: d.nombre, articulo: d.articulo, epigrafe: art.epigrafe, sim: sim.toFixed(2) }); }
  else { none++; if (noneExamples.length < 15) noneExamples.push({ nombre: d.nombre, articulo: d.articulo, epigrafe: art.epigrafe, sim: sim.toFixed(2) }); }
});

const counts = {};
delitos.forEach(d => { counts[d.articulo] = (counts[d.articulo] || 0) + 1; });
const dups = Object.entries(counts).filter(([, c]) => c > 1);
const dupTotal = dups.reduce((s, [, c]) => s + (c - 1), 0);

console.log('=== VALIDACIÓN data/delitos.json ===');
console.log('Total entradas:', delitos.length);
console.log('Entradas con artículo:', delitos.length - none);
console.log('');
console.log('Coincidencia nombre ↔ epígrafe:');
console.log('  Alta (≥70%):  ', exact, '(' + (exact / delitos.length * 100).toFixed(1) + '%)');
console.log('  Media (40-70%):', close, '(' + (close / delitos.length * 100).toFixed(1) + '%)');
console.log('  Baja (20-40%):', weak, '(' + (weak / delitos.length * 100).toFixed(1) + '%)');
console.log('  Nula (<20%): ', none, '(' + (none / delitos.length * 100).toFixed(1) + '%)');
console.log('');
console.log('Duplicados por artículo:');
console.log('  Artículos con duplicados:', dups.length);
console.log('  Entradas sobrantes:', dupTotal);
console.log('');
if (weakExamples.length) {
  console.log('--- Ejemplos de coincidencia BAJA ---');
  weakExamples.forEach(e => console.log('  ' + e.articulo + ' sim=' + e.sim + ' | nombre: ' + e.nombre + ' | epígrafe: ' + (e.epigrafe || '(sin)')));
}
if (noneExamples.length) {
  console.log('--- Ejemplos de coincidencia NULA / no encontrado ---');
  noneExamples.forEach(e => console.log('  ' + e.articulo + ' sim=' + (e.sim || '?') + ' | nombre: ' + e.nombre + ' | epígrafe: ' + (e.epigrafe || e.reason || '(sin)')));
}
