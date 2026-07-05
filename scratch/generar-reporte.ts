import * as fs from 'fs';
import * as path from 'path';

// Buscar el reporte JSON más reciente en auditoria-blog/
const auditoriaDir = path.join(process.cwd(), 'auditoria-blog');
const files = fs.readdirSync(auditoriaDir)
  .filter(f => f.startsWith('verify-fix-reporte-') && f.endsWith('.json'))
  .map(f => ({
    name: f,
    time: fs.statSync(path.join(auditoriaDir, f)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time);

if (files.length === 0) {
  console.error('No se encontró ningún reporte JSON en auditoria-blog/');
  process.exit(1);
}

const latestReportPath = path.join(auditoriaDir, files[0].name);
console.log(`Leyendo reporte: ${latestReportPath}`);
const report = JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));

// Mapear los posts con discrepancias fácticas o hallazgos
// El reporte JSON tiene una propiedad "issues" o "findings". Veamos la estructura primero imprimiendo las claves principales.
console.log('Claves en el reporte JSON:', Object.keys(report));
console.log('Número de resultados:', report.resultados.length);
if (report.resultados.length > 0) {
  console.log('Propiedades del primer resultado:', Object.keys(report.resultados[0]));
  console.log('Primer resultado completo:', JSON.stringify(report.resultados[0], null, 2));
}
