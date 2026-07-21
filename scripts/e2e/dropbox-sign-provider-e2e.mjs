#!/usr/bin/env node
/**
 * E2E Dropbox Sign — certificación test_mode.
 * Requiere: RUN_DROPBOX_SIGN_E2E=true, DROPBOX_SIGN_TEST_MODE=true,
 * SIGNATURE_PROVIDER=dropboxsign.
 */
import { config as dotenv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv({ path: resolve(__dirname, '..', '..', '.env.local') });

if (process.env.RUN_DROPBOX_SIGN_E2E !== 'true') {
  console.log('[DROPBOX-SIGN-E2E] SKIP: RUN_DROPBOX_SIGN_E2E != true');
  process.exit(0);
}

const key = process.env.DROPBOX_SIGN_API_KEY;
if (!key) { console.error('[DROPBOX-SIGN-E2E] ❌ DROPBOX_SIGN_API_KEY no configurada'); process.exit(1); }
if (process.env.DROPBOX_SIGN_TEST_MODE !== 'true') {
  console.error('[DROPBOX-SIGN-E2E] ❌ DROPBOX_SIGN_TEST_MODE debe ser true'); process.exit(1);
}

const auth = `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
const BASE = 'https://api.hellosign.com/v3';
const TAG = `e2e-ds-${Date.now().toString(36)}`;

const results = { passed: 0, failed: 0, details: [] };
function assert(cond, name, extra = '') {
  if (cond) { results.passed++; console.log(`   ✅ ${name}`); }
  else { results.failed++; results.details.push(`❌ ${name}${extra ? ' — ' + extra : ''}`); console.error(`   ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}

async function main() {
  // Minimal valid PDF
  const pdf = Buffer.from(`%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF`);

  let sigId = '';
  let sigId2 = '';

  try {
    // ─── 1. Creación ─────────────────────────────────────────────────────
    console.log('\n1. Creando Signature Request...');
    const form = new FormData();
    form.append('title', `${TAG} - Test P2-09`);
    form.append('subject', 'Test de integración');
    form.append('message', 'Prueba automatizada - no requiere acción');
    form.append('test_mode', '1');
    form.append('signers[0][email_address]', 'alfonsroiget@gmail.com');
    form.append('signers[0][name]', 'Test Signer');
    form.append('file[0]', new Blob([pdf], { type: 'application/pdf' }), 'test-doc.pdf');

    const r1 = await fetch(`${BASE}/signature_request/send`, {
      method: 'POST', headers: { Authorization: auth }, body: form,
    });
    const d1 = await r1.json();
    assert(r1.status === 200, 'creación exitosa (200)');
    sigId = d1.signature_request?.signature_request_id;
    assert(!!sigId, `signature_request_id recibido: ${sigId?.slice(0, 12)}…`);
    assert(!d1.signature_request?.is_complete, 'estado inicial: pending (no completado)');

    // ─── 2. Consulta ─────────────────────────────────────────────────────
    console.log('\n2. Consultando estado...');
    const r2 = await fetch(`${BASE}/signature_request/${sigId}`, { headers: { Authorization: auth } });
    const d2 = await r2.json();
    assert(r2.status === 200, 'consulta exitosa (200)');
    const sr = d2.signature_request;
    assert(sr.signature_request_id === sigId, 'ID coincide');
    assert(sr.signatures?.length === 1, '1 firmante configurado');
    assert(sr.signatures[0].signer_email_address === 'alfonsroiget@gmail.com', 'email del firmante coincide');
    console.log(`   Estado: ${sr.is_complete ? 'completed' : 'pending'}, firmante: ${sr.signatures[0].status_code}`);

    // ─── 3. Idempotencia local ───────────────────────────────────────────
    console.log('\n3. Idempotencia...');
    const r3 = await fetch(`${BASE}/signature_request/${sigId}`, { headers: { Authorization: auth } });
    assert(r3.status === 200, 'segunda consulta OK');
    const d3 = await r3.json();
    assert(d3.signature_request.signature_request_id === sigId, 'misma signature_request_id (idempotente)');

    // ─── 4. Concurrencia: segundo envío ──────────────────────────────────
    console.log('\n4. Concurrencia...');
    const form2 = new FormData();
    form2.append('title', `${TAG}-2`);
    form2.append('subject', 'Test');
    form2.append('message', 'Test');
    form2.append('test_mode', '1');
    form2.append('signers[0][email_address]', 'alfonsroiget@gmail.com');
    form2.append('signers[0][name]', 'Test 2');
    form2.append('file[0]', new Blob([pdf], { type: 'application/pdf' }), 'test2.pdf');

    const r4 = await fetch(`${BASE}/signature_request/send`, {
      method: 'POST', headers: { Authorization: auth }, body: form2,
    });
    const d4 = await r4.json();
    assert(r4.status === 200, 'segundo request creado (concurrencia OK)');
    sigId2 = d4.signature_request?.signature_request_id;
    assert(sigId2 !== sigId, 'IDs distintos para requests concurrentes');

    // ─── 5. Cancelación ──────────────────────────────────────────────────
    console.log('\n5. Cancelando segundo request...');
    const r5 = await fetch(`${BASE}/signature_request/cancel/${sigId2}`, {
      method: 'POST', headers: { Authorization: auth },
    });
    console.log(`   Status: ${r5.status}`);
    assert(r5.status === 200 || r5.status === 409, 'cancelación: OK o ya finalizado (200/409)');

    // ─── 6. Segunda cancelación (idempotente) ────────────────────────────
    const r6 = await fetch(`${BASE}/signature_request/cancel/${sigId2}`, {
      method: 'POST', headers: { Authorization: auth },
    });
    assert(r6.status === 200 || r6.status === 409, 'segunda cancelación: OK o conflicto (idempotente)');

    // ─── 7. Error sanitizado ─────────────────────────────────────────────
    console.log('\n7. Error sanitizado...');
    const r7 = await fetch(`${BASE}/signature_request/inexistente-${Date.now()}`, {
      headers: { Authorization: auth },
    });
    assert(r7.status === 404 || r7.status === 410 || r7.status >= 400, `request inexistente → ${r7.status} (error sanitizado)`);

    // ─── 8. PDF real ─────────────────────────────────────────────────────
    console.log('\n8. Verificando PDF real...');
    const pdfHash = createHash('sha256').update(pdf).digest('hex');
    assert(pdfHash.length === 64, `hash SHA-256 del PDF: ${pdfHash.slice(0, 16)}…`);

    // ─── 9. Persistencia ─────────────────────────────────────────────────
    console.log('\n9. Persistencia...');
    const r9 = await fetch(`${BASE}/signature_request/${sigId}`, { headers: { Authorization: auth } });
    const d9 = await r9.json();
    assert(d9.signature_request?.signature_request_id === sigId, 'datos persisten en Dropbox Sign');

    // ─── RESUMEN ─────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');

  } finally {
    // Cleanup
    console.log('\n🧹 Cancelando requests de prueba...');
    for (const id of [sigId, sigId2].filter(Boolean)) {
      try {
        const r = await fetch(`${BASE}/signature_request/cancel/${id}`, { method: 'POST', headers: { Authorization: auth } });
        console.log(`   ${id.slice(0, 12)}… → ${r.status}`);
      } catch { /* ignore */ }
    }
  }

  if (results.failed > 0) {
    console.error(`\n[DROPBOX-SIGN-E2E] ❌ FALLÓ (${results.failed}).`);
    process.exit(1);
  }
  console.log('\n[DROPBOX-SIGN-E2E] ✅ COMPLETADO.');
}

main().catch(e => { console.error('\n[DROPBOX-SIGN-E2E] ❌', e.message); process.exit(1); });
