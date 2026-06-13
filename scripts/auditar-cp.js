#!/usr/bin/env node
/**
 * Auditoría de la Biblioteca del Código Penal
 * 
 * Uso: node scripts/auditar-cp.js [--fix] [--report]
 * 
 * --fix     : Corrige automáticamente problemas detectados (con -s backup)
 * --report  : Solo genera informe, no modifica archivos
 * 
 * Este script verifica integridad, consistencia y formato de los 635 artículos.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', 'data', 'articulos_cp.json');
const BACKUP_DIR = path.resolve(__dirname, '..', 'data', 'backups');
const REPORT_FILE = path.resolve(__dirname, '..', 'data', 'auditoria-cp-report.json');

// Categorías de problemas
const ISSUE_CATEGORIES = {
  TRUNCADO: 'Texto parece truncado (longitud anormal)',
  SIN_PUNTO: 'No termina en punto final',
  CORTO: 'Texto sospechosamente corto',
  DUPLICADO: 'Contenido duplicado o repetido',
  HEADER_INCORPORADO: 'Encabezado de sección incluido en el texto',
  HTML_ROTO: 'Etiquetas HTML sin cerrar',
  CODIFICACION: 'Caracteres de codificación inválidos',
  TYPO: 'Posible error ortográfico',
  VACIO: 'Artículo sin contenido'
};

// Palabras sospechosas comunes en estos artículos
const SOSPECHOSAS = [
  { pattern: /\baúna\b/, type: 'TYPO', desc: '"aúna" -> "a una"' },
  { pattern: /\btiernas\b/, type: 'TYPO', desc: 'posible "tiernas" por "tierras"' },
  { pattern: /DISPOSICIONES\s+(ADICIONALES|TRANSITORIAS|FINALES)\s*$/, type: 'HEADER_INCORPORADO', desc: 'encabezado de sección al final del artículo' },
  { pattern: /CAPITULO\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)\s*$/i, type: 'HEADER_INCORPORADO', desc: 'encabezado de capítulo al final del artículo' },
];

async function audit() {
  console.log('=== AUDITORÍA DE LA BIBLIOTECA DEL CÓDIGO PENAL ===\n');
  
  // Validar archivo
  if (!fs.existsSync(DATA_FILE)) {
    console.error('ERROR: No se encuentra ' + DATA_FILE);
    process.exit(1);
  }
  
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  let articulos;
  try {
    articulos = JSON.parse(raw);
  } catch (e) {
    console.error('ERROR: JSON inválido - ' + e.message);
    process.exit(1);
  }
  
  console.log('Archivo: ' + DATA_FILE);
  console.log('Artículos: ' + articulos.length + '\n');
  
  const issues = [];
  const stats = {
    total: articulos.length,
    correctos: 0,
    con_issues: 0,
    by_type: {},
    by_tema: {},
    by_libro: {}
  };
  
  // Verificar numeración
  const nums = articulos.map(a => parseInt(a.articulo.match(/Art\.\s*(\d+)/)?.[1] || 0));
  let lastNum = 0;
  
  for (let i = 0; i < articulos.length; i++) {
    const a = articulos[i];
    const t = (a.texto || '').trim();
    const num = nums[i];
    const artIssues = [];
    
    // Estadísticas
    if (a.tema) stats.by_tema[a.tema] = (stats.by_tema[a.tema] || 0) + 1;
    if (a.libro) stats.by_libro[a.libro] = (stats.by_libro[a.libro] || 0) + 1;
    
    // 1. Verificar continuidad de numeración
    if (num !== lastNum + 1 && num !== lastNum) {
      artIssues.push({
        type: 'NUMERACION',
        severity: 'warning',
        desc: 'Salto en numeración: ' + lastNum + ' -> ' + num
      });
    }
    lastNum = num;
    
    // 2. Verificar contenido vacío
    if (!t || t.length === 0) {
      artIssues.push({
        type: 'VACIO',
        severity: 'critical',
        desc: ISSUE_CATEGORIES.VACIO
      });
    }
    
    // 3. Verificar longitud sospechosa
    if (t.length > 0 && t.length < 50) {
      artIssues.push({
        type: 'CORTO',
        severity: 'warning',
        desc: ISSUE_CATEGORIES.CORTO + ' (' + t.length + ' chars)'
      });
    }
    
    // 4. Verificar punto final
    if (t.length > 50 && !t.endsWith('.') && !t.endsWith(')') && !t.endsWith('"')) {
      artIssues.push({
        type: 'SIN_PUNTO',
        severity: 'minor',
        desc: ISSUE_CATEGORIES.SIN_PUNTO
      });
    }
    
    // 5. Verificar patrones sospechosos
    for (const s of SOSPECHOSAS) {
      if (s.pattern.test(t)) {
        artIssues.push({
          type: s.type,
          severity: 'medium',
          desc: s.desc
        });
      }
    }
    
    // 6. Verificar HTML
    const openTags = (t.match(/<[^\/][^>]*>/g) || []).length;
    const closeTags = (t.match(/<\/[^>]+>/g) || []).length;
    if (openTags !== closeTags) {
      artIssues.push({
        type: 'HTML_ROTO',
        severity: 'critical',
        desc: ISSUE_CATEGORIES.HTML_ROTO + ' (' + openTags + ' abiertas, ' + closeTags + ' cerradas)'
      });
    }
    
    // 7. Verificar codificación
    if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t)) {
      artIssues.push({
        type: 'CODIFICACION',
        severity: 'critical',
        desc: ISSUE_CATEGORIES.CODIFICACION
      });
    }
    
    // 8. Verificar párrafos duplicados (contenido repetido)
    const paragraphs = t.split('\n').filter(p => p.trim().length > 50);
    const seen = new Set();
    for (const p of paragraphs) {
      const normalized = p.trim().substring(0, 100);
      if (seen.has(normalized)) {
        artIssues.push({
          type: 'DUPLICADO',
          severity: 'medium',
          desc: ISSUE_CATEGORIES.DUPLICADO + ': párrafo repetido'
        });
        break;
      }
      seen.add(normalized);
    }
    
    // 9. Verificar metadatos
    if (!a.epigrafe || a.epigrafe.trim().length === 0) {
      artIssues.push({
        type: 'SIN_EPIGRAFE',
        severity: 'minor',
        desc: 'Artículo sin epígrafe/título'
      });
    }
    if (!a.libro) {
      artIssues.push({
        type: 'SIN_LIBRO',
        severity: 'minor',
        desc: 'Artículo sin clasificación de libro'
      });
    }
    
    // Registrar issues
    if (artIssues.length > 0) {
      stats.con_issues++;
      for (const iss of artIssues) {
        stats.by_type[iss.type] = (stats.by_type[iss.type] || 0) + 1;
      }
      issues.push({
        articulo: a.articulo,
        num: num,
        longitud: t.length,
        epigrafe: a.epigrafe,
        issues: artIssues,
        ultimos_100: t.slice(-100)
      });
    } else {
      stats.correctos++;
    }
  }
  
  // Mostrar resumen
  console.log('=== ESTADÍSTICAS GENERALES ===');
  console.log('Total artículos: ' + stats.total);
  console.log('Correctos: ' + stats.correctos + ' (' + Math.round(stats.correctos/stats.total*100) + '%)');
  console.log('Con problemas: ' + stats.con_issues + ' (' + Math.round(stats.con_issues/stats.total*100) + '%)');
  console.log('');
  
  console.log('=== DISTRIBUCIÓN POR TEMA ===');
  Object.entries(stats.by_tema).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
  console.log('');
  
  console.log('=== DISTRIBUCIÓN POR LIBRO ===');
  Object.entries(stats.by_libro).sort((a,b) => a[0].localeCompare(b[0])).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
  console.log('');
  
  console.log('=== PROBLEMAS ENCONTRADOS POR CATEGORÍA ===');
  Object.entries(stats.by_type).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
  console.log('');
  
  if (issues.length > 0) {
    console.log('=== ARTÍCULOS CON PROBLEMAS ===');
    issues.forEach(item => {
      console.log(item.articulo + ' (' + item.longitud + ' chars) - ' + item.epigrafe);
      item.issues.forEach(iss => console.log('  [' + iss.severity + '] ' + iss.type + ': ' + iss.desc));
    });
  }
  
  // Guardar reporte
  const report = {
    fecha: new Date().toISOString(),
    archivo: DATA_FILE,
    total_articulos: stats.total,
    correctos: stats.correctos,
    con_problemas: stats.con_issues,
    distribucion_temas: stats.by_tema,
    distribucion_libros: stats.by_libro,
    problemas_por_categoria: stats.by_type,
    articulos_con_problemas: issues
  };
  
  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('\nReporte guardado: ' + REPORT_FILE);
  console.log('=== AUDITORÍA COMPLETADA ===');
}

audit().catch(console.error);
