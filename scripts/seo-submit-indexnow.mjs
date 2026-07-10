import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const RECRAWL_DIR = path.join(ROOT_DIR, 'auditoria_seo', 'recrawl_bing');

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const BING_API = 'https://www.bing.com/indexnow';
const HOST = 'www.pinedayasociadoshn.com';

async function run() {
  const isExecute = process.argv.includes('--execute');
  
  if (!isExecute) {
    console.log('--- MODO DRY-RUN --- (Usa --execute para enviar realmente)');
  }

  // Read URLs to send
  const csvPath = path.join(RECRAWL_DIR, 'urls-enviadas-indexnow-dryrun.csv');
  let data;
  try {
    data = await fs.readFile(csvPath, 'utf8');
  } catch (e) {
    console.error('No se encontro urls-enviadas-indexnow-dryrun.csv. Ejecuta primero seo-validate-recrawl.mjs');
    return;
  }

  const lines = data.split('\n').map(l => l.trim()).filter(l => l);
  const urls = lines.slice(1).map(l => l.replace(/"/g, '')); // Skip header

  if (urls.length === 0) {
    console.log('No hay URLs para enviar.');
    return;
  }

  // Get indexnow key
  let key = process.env.INDEXNOW_KEY;
  if (!key) {
    // Generate or use a fallback
    key = 'pinedayasociados-indexnow-key-2026';
    console.log(`Usando clave IndexNow predeterminada: ${key}`);
  }

  // Write the key file to public
  const publicDir = path.join(ROOT_DIR, 'public');
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, `${key}.txt`), key);

  // Group in batches of 50
  const batches = [];
  const BATCH_SIZE = 50;
  // Maximum 200 URLs
  const maxUrls = urls.slice(0, 200);

  for (let i = 0; i < maxUrls.length; i += BATCH_SIZE) {
    batches.push(maxUrls.slice(i, i + BATCH_SIZE));
  }

  const submissionLog = [];
  const actuallySent = [];
  
  let batchNum = 1;
  for (const batch of batches) {
    console.log(`\nProcesando Lote ${batchNum}/${batches.length} (${batch.length} URLs)...`);
    
    const payload = {
      host: HOST,
      key: key,
      keyLocation: `https://${HOST}/${key}.txt`,
      urlList: batch
    };

    if (isExecute) {
      try {
        const response = await fetch(INDEXNOW_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const status = response.status;
        const msg = status === 200 ? 'OK' : `Error ${status}`;
        console.log(`Resultado: ${msg}`);
        
        submissionLog.push(`- Lote ${batchNum}: ${batch.length} URLs - Status: ${status} - ${new Date().toISOString()}`);
        
        if (status === 200 || status === 202) {
          actuallySent.push(...batch);
        }
      } catch (e) {
        console.error(`Error enviando lote: ${e.message}`);
        submissionLog.push(`- Lote ${batchNum}: ${batch.length} URLs - ERROR: ${e.message}`);
      }
    } else {
      console.log(`[DRY-RUN] Simulación de envío IndexNow correcta para ${batch.length} URLs`);
      submissionLog.push(`- Lote ${batchNum}: ${batch.length} URLs - DRY-RUN - ${new Date().toISOString()}`);
      actuallySent.push(...batch);
    }
    batchNum++;
  }

  // Generate artifacts
  if (isExecute) {
    const logPath = path.join(RECRAWL_DIR, 'indexnow-submission-log.md');
    let logContent = `# IndexNow Submission Log\n\n**Fecha:** ${new Date().toISOString()}\n**Método:** API IndexNow\n\n`;
    logContent += submissionLog.join('\n');
    await fs.writeFile(logPath, logContent);

    const sentCsvPath = path.join(RECRAWL_DIR, 'urls-enviadas-indexnow.csv');
    await fs.writeFile(sentCsvPath, 'url_final\n' + actuallySent.map(u => `"${u}"`).join('\n'));
    console.log('\nEnvío completado. Archivos log generados.');
  } else {
    console.log('\nDry-run completado. Revisa los lotes generados. Usa --execute para enviar.');
  }
}

run().catch(console.error);
