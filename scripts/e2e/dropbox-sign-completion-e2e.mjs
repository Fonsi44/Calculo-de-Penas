#!/usr/bin/env node
/**
 * Continuación manual de certificación Dropbox Sign tras firma humana.
 * Uso: RUN_DROPBOX_SIGN_COMPLETION_E2E=true DROPBOX_SIGN_TEST_MODE=true SIGNATURE_PROVIDER=dropboxsign node scripts/e2e/dropbox-sign-completion-e2e.mjs
 */
import { config as dotenv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv({ path: resolve(__dirname, '..', '..', '.env.local') });

if (process.env.RUN_DROPBOX_SIGN_COMPLETION_E2E !== 'true') {
  console.log('[DS-COMPLETION] SKIP: RUN_DROPBOX_SIGN_COMPLETION_E2E != true');
  process.exit(0);
}

const key = process.env.DROPBOX_SIGN_API_KEY;
if (!key) { console.error('❌ DROPBOX_SIGN_API_KEY no configurada'); process.exit(1); }
const auth = `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
const BASE = 'https://api.hellosign.com/v3';

// Leer sigId desde variable de entorno o usar el último creado
const sigId = process.env.DROPBOX_SIGN_COMPLETION_SIG_ID;
if (!sigId) {
  console.log('MANUAL_SIGNATURE_PENDING');
  console.log('Configure DROPBOX_SIGN_COMPLETION_SIG_ID con el signature_request_id de la solicitud de prueba.');
  process.exit(0);
}

const results = { passed: 0, failed: 0 };
function assert(cond, name) {
  if (cond) { results.passed++; console.log(`   ✅ ${name}`); }
  else { results.failed++; console.error(`   ❌ ${name}`); }
}

async function main() {
  // 1. Consultar estado
  const r1 = await fetch(`${BASE}/signature_request/${sigId}`, { headers: { Authorization: auth } });
  const d1 = await r1.json();
  const sr = d1.signature_request;
  if (!sr) { console.error('❌ Signature request no encontrado'); process.exit(1); }

  const isComplete = sr.is_complete;
  console.log(`Estado: ${isComplete ? 'COMPLETED' : 'PENDING'}`);
  if (sr.signatures) {
    for (const s of sr.signatures) {
      console.log(`  - ${s.signer_name}: ${s.status_code}${s.signed_at ? ' ✓' : ''}`);
    }
  }

  if (!isComplete) {
    console.log('\nMANUAL_SIGNATURE_PENDING');
    process.exit(0);
  }

  // 2. Completado: descargar
  console.log('\n✅ Firmado. Descargando artefactos...');
  let attempt = 0;
  let fileResp;
  while (attempt < 5) {
    fileResp = await fetch(`${BASE}/signature_request/files/${sigId}`, { headers: { Authorization: auth } });
    if (fileResp.status !== 409) break;
    console.log(`   409 — esperando preparación (intento ${++attempt}/5)...`);
    await new Promise(r => setTimeout(r, 2000));
  }

  assert(fileResp.status === 200, `descarga OK (${fileResp.status})`);
  const buf = Buffer.from(await fileResp.arrayBuffer());
  const hash = createHash('sha256').update(buf).digest('hex');
  assert(buf.length > 0, `tamaño: ${buf.length} bytes`);
  assert(hash.length === 64, `SHA-256: ${hash.slice(0, 16)}…`);
  const mime = fileResp.headers.get('content-type') || '';
  assert(mime.includes('pdf') || mime.includes('zip'), `MIME: ${mime}`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (results.failed > 0) process.exit(1);
  console.log('\n[DROPBOX-SIGN-COMPLETION] ✅ CERTIFICADO');
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
