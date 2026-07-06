import * as fs from 'fs';
import * as path from 'path';

function reconstruct() {
  const targetPath = 'C:\\Proyectos\\Justicia Verdadera\\auditoriablog.md';
  let content = '';

  // Get generic file content
  const genericPath = targetPath;
  const current = fs.existsSync(genericPath) ? fs.readFileSync(genericPath, 'utf8') : '';
  
  // We want to extract only the first 3 articles from 'current' (which starts with # header)
  // An article starts with "## " or "## ✅"
  const lines = current.split('\n');
  let articleCount = 0;
  let lote1Lines = [];
  
  // Add a fake header just in case
  lote1Lines.push('# Auditoría de Blog - Abogado Senior (Honduras)\n');
  lote1Lines.push('---');
  lote1Lines.push('*Lote 1: Artículos 1 al 3*\n');

  for (const line of lines) {
     if (line.includes('📝 Artículo ID:')) {
        articleCount++;
     }
     if (articleCount > 3) {
        break; // stop at 4th article
     }
     if (articleCount > 0) {
        lote1Lines.push(line);
     }
  }

  content = lote1Lines.join('\n') + '\n\n';

  // Now append batch 2 to 31
  for (let i = 2; i <= 31; i++) {
    const scriptPath = path.join('C:\\Proyectos\\Justicia Verdadera\\scripts', `append-batch${i}-temp.ts`);
    if (fs.existsSync(scriptPath)) {
       const scriptContent = fs.readFileSync(scriptPath, 'utf8');
       
       if (scriptContent.includes('const content = `')) {
          const match = scriptContent.match(/const content = `([\s\S]*?)`;\n/);
          if (match && match[1]) {
             content += match[1] + '\n\n';
          } else {
             const firstTick = scriptContent.indexOf('`');
             const lastTick = scriptContent.lastIndexOf('`');
             if (firstTick !== -1 && lastTick !== -1) {
                content += scriptContent.substring(firstTick + 1, lastTick) + '\n\n';
             }
          }
       } else {
          content += scriptContent + '\n\n';
       }
    }
  }

  // Write to a temporary file first
  const outPath = 'C:\\Proyectos\\Justicia Verdadera\\auditoriablog_clean.md';
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`Clean reconstructed auditoriablog.md successfully. Total length: ${content.length}`);
}

reconstruct();
