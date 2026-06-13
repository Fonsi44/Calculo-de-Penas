/**
 * Auditoría del Catálogo de Delitos vs Biblioteca del Código Penal
 * 
 * Uso: node scripts/auditar-delitos.js
 * 
 * Verifica cada delito contra su artículo CP correspondiente,
 * detectando discrepancias en penas, clasificación y completitud.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', 'data/delitos.json');
const CP_FILE = path.resolve(__dirname, '..', 'data/articulos_cp.json');

const delitos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const cp = JSON.parse(fs.readFileSync(CP_FILE, 'utf-8'));

const cpIdx = {};
for (const a of cp) cpIdx[a.articulo] = a;

const CATEGORIES = [
  { key: 'SIN_CP', label: 'Sin artículo CP', severity: 'CRITICAL' },
  { key: 'SIN_NOMBRE', label: 'Sin nombre', severity: 'CRITICAL' },
  { key: 'SIN_CONDUCTA', label: 'Sin conducta', severity: 'WARNING' },
  { key: 'SIN_RAMA', label: 'Sin rama jurídica', severity: 'WARNING' },
  { key: 'SIN_CLASIFICACION', label: 'Sin clasificación', severity: 'WARNING' },
  { key: 'PENA_SIN_CLASIFICAR', label: 'Pena sin clasificar', severity: 'CRITICAL' },
  { key: 'PRISION_SIN_VALOR', label: 'Prisión sin valor numérico', severity: 'CRITICAL' },
  { key: 'OOCERO_LEGACY', label: '0-0 meses legacy', severity: 'WARNING' },
  { key: 'MULTA_SIN_VALOR', label: 'Multa sin valor', severity: 'WARNING' },
  { key: 'FALTA_INHABILITACION', label: 'Falta inhabilitación accesoria', severity: 'INFO' },
  { key: 'PERPETUIDAD', label: 'Prisión a perpetuidad', severity: 'INFO' },
  { key: 'DUPLICADO_NOMBRE', label: 'Nombre duplicado', severity: 'WARNING' },
];

function run() {
  const issues = [];
  const byType = {};
  const stats = { total: delitos.length, con_cp: 0, sin_cp: 0, correctos: 0, con_issues: 0 };
  const typeCounts = {};

  for (const d of delitos) {
    const artCp = cpIdx[d.articulo];
    const artIssues = [];
    
    if (!artCp) {
      artIssues.push({ type: 'SIN_CP', desc: 'Artículo no encontrado en Biblioteca CP' });
      stats.sin_cp++;
    } else {
      stats.con_cp++;
    }

    if (!d.nombre || d.nombre.trim().length === 0)
      artIssues.push({ type: 'SIN_NOMBRE', desc: 'Nombre vacío' });
    if (!d.conducta || d.conducta.trim().length === 0)
      artIssues.push({ type: 'SIN_CONDUCTA', desc: 'Sin descripción de conducta' });
    if (!d.rama_id)
      artIssues.push({ type: 'SIN_RAMA', desc: 'Sin rama jurídica' });
    if (!d.clasificacion)
      artIssues.push({ type: 'SIN_CLASIFICACION', desc: 'Sin clasificación' });
    if (!d.tipo_pena_principal || d.tipo_pena_principal === 'requiere_revision')
      artIssues.push({ type: 'PENA_SIN_CLASIFICAR', desc: 'Tipo de pena sin clasificar' });
    if ((d.tipo_pena_principal === 'privacion_libertad' || d.tipo_pena_principal === 'privacion_libertad_y_multa') && 
        (!d.tiene_prision || d.prision_min_valor === 0))
      artIssues.push({ type: 'PRISION_SIN_VALOR', desc: `Prisión 0-0 pero clasificado como con prisión` });
    if (d.tipo_pena_principal === 'privacion_libertad' && d.pena_minima_meses === 0 && d.pena_maxima_meses === 0)
      artIssues.push({ type: 'OOCERO_LEGACY', desc: 'Legacy 0-0 meses' });
    if (d.tipo_pena_principal === 'multa' && d.multa_min_valor === 0 && d.multa_max_valor === 0)
      artIssues.push({ type: 'MULTA_SIN_VALOR', desc: 'Multa sin valor extraído' });
    if (d.prision_max_valor === 9999)
      artIssues.push({ type: 'PERPETUIDAD', desc: 'Prisión a perpetuidad' });
    
    if (artIssues.length > 0) {
      stats.con_issues++;
      for (const iss of artIssues) {
        byType[iss.type] = (byType[iss.type] || 0) + 1;
      }
      issues.push({
        id: d.id || 'N/A',
        nombre: d.nombre,
        articulo: d.articulo,
        tipo_pena: d.tipo_pena_principal || 'N/A',
        prision: `${d.prision_min_valor || 0}-${d.prision_max_valor || 0}`,
        multa: `${d.multa_min_valor || 0}-${d.multa_max_valor || 0} ${d.multa_unidad || ''}`,
        accesorias: d.penas_accesorias || [],
        verification: d.estado_verificacion_pena || 'N/A',
        issues: artIssues
      });
    } else {
      stats.correctos++;
    }
  }

  // Duplicate check
  const seen = new Map();
  for (const d of delitos) {
    const key = d.nombre?.toLowerCase() + '|' + d.articulo;
    if (seen.has(key)) {
      issues.push({
        id: d.id || '',
        nombre: d.nombre, articulo: d.articulo,
        issues: [{ type: 'DUPLICADO_NOMBRE', desc: 'Nombre+Artículo duplicado' }]
      });
    }
    seen.set(key, true);
  }

  const report = {
    fecha: new Date().toISOString(),
    total_delitos: stats.total,
    con_cp: stats.con_cp,
    sin_cp: stats.sin_cp,
    correctos: stats.correctos,
    con_problemas: stats.con_issues,
    problemas_por_categoria: byType,
    delitos_con_problemas: issues
  };

  // Console output
  console.log('=== AUDITORÍA DEL CATÁLOGO DE DELITOS ===');
  console.log(`Fecha: ${report.fecha}`);
  console.log(`Total: ${stats.total} | Con CP: ${stats.con_cp} | Sin CP: ${stats.sin_cp}`);
  console.log(`Correctos: ${stats.correctos} | Con problemas: ${stats.con_issues}`);
  console.log('');
  console.log('Problemas por categoría:');
  Object.entries(byType).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    const cat = CATEGORIES.find(c => c.key === k);
    console.log(`  [${cat?.severity || 'INFO'}] ${k}: ${v}`);
  });

  fs.writeFileSync(path.resolve(__dirname, '..', 'data/auditoria-delitos-report.json'), JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nReporte completo: data/auditoria-delitos-report.json`);
}

run();
