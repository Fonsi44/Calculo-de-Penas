import * as fs from 'fs';
import * as path from 'path';

const reportPath = path.join(process.cwd(), 'auditoria-blog', fs.readdirSync(path.join(process.cwd(), 'auditoria-blog')).filter(f => f.startsWith('verify-fix-reporte-') && f.endsWith('.json')).sort((a,b) => fs.statSync(path.join(process.cwd(), 'auditoria-blog', b)).mtime.getTime() - fs.statSync(path.join(process.cwd(), 'auditoria-blog', a)).mtime.getTime())[0]);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const item = report.resultados[0];

console.log('Keys of item:', Object.keys(item));
for (const key of Object.keys(item)) {
  if (typeof item[key] === 'object' && item[key] !== null) {
    console.log(`Key "${key}" is object. Array length:`, Array.isArray(item[key]) ? item[key].length : 'N/A');
    if (Array.isArray(item[key]) && item[key].length > 0) {
      console.log(`First item of "${key}":`, JSON.stringify(item[key][0], null, 2));
    }
  } else {
    console.log(`Key "${key}":`, item[key]);
  }
}
