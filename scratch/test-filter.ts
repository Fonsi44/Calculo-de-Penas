import * as fs from 'fs';
import * as path from 'path';

const auditoriaDir = path.join(process.cwd(), 'auditoria-blog');
const files = fs.readdirSync(auditoriaDir)
  .filter(f => f.startsWith('verify-fix-reporte-') && f.endsWith('.json'))
  .map(f => ({
    name: f,
    time: fs.statSync(path.join(auditoriaDir, f)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time);

const latestReportPath = path.join(auditoriaDir, files[0].name);
const report = JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));

console.log('Total resultados:', report.resultados.length);
const discrepantes = report.resultados.filter((r: any) => r.discrepancias && r.discrepancias.length > 0);
console.log('Filtrados:', discrepantes.length);

if (report.resultados.length > 0) {
  const item = report.resultados[0];
  console.log('Item 0:', item.slug, 'discrepancias:', item.discrepancias);
}
