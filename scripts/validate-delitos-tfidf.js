const fs = require('fs');
const path = require('path');

const delitos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'delitos.json'), 'utf8'));
const articulos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'articulos_cp.json'), 'utf8'));

const artMap = new Map();
articulos.forEach(a => {
  const m = a.articulo && a.articulo.match(/\d+/);
  if (m) artMap.set(m[0], a);
});

const STOP = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'al', 'a', 'en', 'por', 'para', 'con', 'sin', 'y', 'o', 'u', 'un', 'una', 'unos', 'unas', 'que', 'se', 'es', 'son', 'ser', 'su', 'sus', 'le', 'les', 'lo', 'que', 'como', 'mas', 'más', 'este', 'esta', 'estos', 'estas']);

const normalize = (s) => (s || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ').trim();

const tokens = (s) => normalize(s).split(' ').filter(w => w.length > 2 && !STOP.has(w));

function termFreq(s) {
  const tf = new Map();
  tokens(s).forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
  return tf;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  a.forEach((v, k) => { na += v * v; if (b.has(k)) dot += v * b.get(k); });
  b.forEach(v => { nb += v * v; });
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

const idf = new Map();
const N = articulos.length;
articulos.forEach(a => {
  const set = new Set(tokens((a.epigrafe || '') + ' ' + (a.texto || '').slice(0, 500)));
  set.forEach(t => idf.set(t, (idf.get(t) || 0) + 1));
});
function tfidf(s) {
  const tf = termFreq(s);
  const v = new Map();
  tf.forEach((freq, term) => {
    const idfVal = Math.log((N + 1) / ((idf.get(term) || 0) + 1)) + 1;
    v.set(term, freq * idfVal);
  });
  return v;
}

const artVectors = articulos.map(a => ({
  art: a,
  num: (a.articulo || '').match(/\d+/)?.[0],
  vec: tfidf((a.epigrafe || '') + ' ' + (a.texto || '').slice(0, 800)),
}));

function findTopMatches(delitoNombre, topN = 5) {
  const dv = tfidf(delitoNombre);
  const scored = artVectors.map(av => ({ art: av.art, num: av.num, sim: cosineSim(dv, av.vec) }));
  scored.sort((a, b) => b.sim - a.sim);
  return scored.slice(0, topN);
}

const reports = [];
delitos.forEach(d => {
  const m = (d.articulo || '').match(/\d+/);
  const currentNum = m ? m[0] : null;
  const top = findTopMatches(d.nombre + ' ' + (d.conducta || ''), 5);

  const currentRank = top.findIndex(t => t.num === currentNum);
  const currentSim = currentRank >= 0 ? top[currentRank].sim : 0;
  const bestSim = top[0].sim;
  const isCorrect = currentRank === 0 || (currentRank >= 0 && top[0].sim - currentSim < 0.05);

  reports.push({
    id: d.id,
    nombre: d.nombre,
    articulo_actual: d.articulo,
    current_sim: currentSim.toFixed(3),
    current_rank: currentRank >= 0 ? currentRank + 1 : 'N/A',
    best_articulo: top[0].art.articulo,
    best_epigrafe: top[0].art.epigrafe,
    best_sim: bestSim.toFixed(3),
    status: isCorrect ? 'OK' : (currentRank < 0 ? 'NO_ENCONTRADO' : 'REVISAR'),
    top3: top.slice(0, 3).map(t => `${t.art.articulo}(${t.sim.toFixed(2)})`).join(', '),
  });
});

const ok = reports.filter(r => r.status === 'OK').length;
const revisar = reports.filter(r => r.status === 'REVISAR').length;
const noEncontrado = reports.filter(r => r.status === 'NO_ENCONTRADO').length;

console.log('=== VALIDACIÓN data/delitos.json (TF-IDF) ===');
console.log('Total entradas:', delitos.length);
console.log('');
console.log('Coincidencia con artículo actual:');
console.log('  OK (match #1 o muy cercano):', ok, '(' + (ok / delitos.length * 100).toFixed(1) + '%)');
console.log('  REVISAR (otro artículo mejor):', revisar, '(' + (revisar / delitos.length * 100).toFixed(1) + '%)');
console.log('  NO_ENCONTRADO:', noEncontrado, '(' + (noEncontrado / delitos.length * 100).toFixed(1) + '%)');
console.log('');

const revisarList = reports.filter(r => r.status !== 'OK');
console.log('--- Top 30 entradas a revisar ---');
revisarList.slice(0, 30).forEach(r => {
  console.log(`[${r.status}] ${r.articulo_actual} → ${r.best_articulo} (${r.best_epigrafe || ''})`);
  console.log(`   nombre: ${r.nombre}`);
  console.log(`   top3: ${r.top3}`);
  console.log('');
});

const csvPath = path.join(__dirname, '..', 'data', 'delitos-validacion.csv');
const header = 'nombre,articulo_actual,status,best_articulo,best_epigrafe,current_sim,best_sim,top3\n';
const rows = reports.map(r =>
  `"${(r.nombre || '').replace(/"/g, '""')}",${r.articulo_actual},${r.status},${r.best_articulo},"${(r.best_epigrafe || '').replace(/"/g, '""')}",${r.current_sim},${r.best_sim},"${r.top3}"`
).join('\n');
fs.writeFileSync(csvPath, header + rows);
console.log('CSV exportado a:', csvPath);
