import * as fs from 'fs';
import * as path from 'path';

function reconstruct() {
  const targetPath = 'C:\\Proyectos\\Justicia Verdadera\\auditoriablog.md';
  let content = '';

  // Just read current file's first part for Batch 1
  const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
  const idx = current.indexOf('Lote 2:');
  if (idx > 0) {
    content = current.substring(0, idx);
  } else {
    // If not found, try to look at transcript
    content = current;
  }

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
             // maybe it was string concatenated? 
             // Try to find the string inside the backticks manually
             const firstTick = scriptContent.indexOf('`');
             const lastTick = scriptContent.lastIndexOf('`');
             if (firstTick !== -1 && lastTick !== -1) {
                content += scriptContent.substring(firstTick + 1, lastTick) + '\n\n';
             }
          }
       } else {
          // Pure markdown
          content += scriptContent + '\n\n';
       }
    } else {
       console.log(`Script ${scriptPath} not found`);
    }
  }

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Reconstructed auditoriablog.md successfully. Total length: ${content.length}`);
}

reconstruct();
