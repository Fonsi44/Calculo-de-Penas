#!/usr/bin/env node
/**
 * Bing WMT — Autorización segura vía OAuth Device Code Flow
 *
 * Genera un enlace oficial de Microsoft para que el propietario autorice
 * el acceso a Bing Webmaster Tools sin compartir contraseñas.
 *
 * Requisito previo (una sola vez):
 *   1. Registrar app en Azure AD: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
 *   2. Name: "Bing WMT Agent"
 *   3. Supported accounts: "Accounts in any organizational directory and personal Microsoft accounts"
 *   4. Authentication → "Allow public client flows" → Yes
 *   5. API Permissions → Bing Webmaster Tools → user_impersonation → Grant admin consent
 *   6. Copiar "Application (client) ID"
 *   7. Guardar en .env.local: BING_CLIENT_ID=<el client id>
 *
 * Uso:
 *   npm run bing:auth               # iniciar autorización
 *   npm run bing:auth:status        # verificar estado del token
 *
 * El token se guarda en .secrets/bing-oauth.json (gitignored, nunca commiteado).
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const SECRETS_DIR = resolve(ROOT, '.secrets');
const TOKEN_FILE = resolve(SECRETS_DIR, 'bing-oauth.json');

const TENANT = process.env.BING_TENANT || 'common';
const CLIENT_ID = process.env.BING_CLIENT_ID;

const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
const DEVICE_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/devicecode`;

// Scope: Bing WMT API + offline_access para refresh token
const SCOPE = 'https://ssl.bing.com/.default offline_access';

function ensureSecretsDir() {
  if (!fs.existsSync(SECRETS_DIR)) {
    fs.mkdirSync(SECRETS_DIR, { recursive: true });
  }
}

function saveToken(data) {
  ensureSecretsDir();
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({
    ...data,
    savedAt: new Date().toISOString(),
    _note: 'NUNCA commitees este archivo. Está en .gitignore.',
  }, null, 2), 'utf-8');
  console.log(`  Token guardado en ${TOKEN_FILE} (gitignored)`);
}

function loadToken() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  } catch { return null; }
}

function mask(s) { return s ? s.substring(0, 6) + '...' : '(vacío)'; }

async function deviceFlow() {
  console.log('Solicitando código de dispositivo a Microsoft...');
  
  const deviceRes = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPE }),
  });
  const deviceData = await deviceRes.json();

  if (deviceData.error) {
    console.error(`\nError: ${deviceData.error}`);
    console.error(deviceData.error_description || '');
    if (deviceData.error === 'invalid_client') {
      console.error('\nPosible causa: BING_CLIENT_ID incorrecto o la app no tiene "public client flows" activado.');
      console.error('Verifica en Azure AD → Authentication → Allow public client flows → Yes');
    }
    if (deviceData.error === 'invalid_scope') {
      console.error('\nEl scope no es válido. Posible causa: la app no tiene permiso "Bing Webmaster Tools → user_impersonation".');
    }
    return null;
  }

  console.log('\n' + '═'.repeat(65));
  console.log('  ABRE ESTE ENLACE EN TU NAVEGADOR:');
  console.log(`  ${deviceData.verification_uri}`);
  console.log('');
  console.log('  Introduce este código:');
  console.log(`  ${deviceData.user_code}`);
  console.log('');
  console.log('  Inicia sesión con la cuenta que administra Bing WMT.');
  console.log('  Si usas Gmail, elige "Sign in with Google" cuando aparezca.');
  console.log('═'.repeat(65));
  console.log(`\nEsperando autorización (expira en ${deviceData.expires_in}s)...`);

  const interval = (deviceData.interval || 5);
  const deadline = Date.now() + deviceData.expires_in * 1000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, interval * 1000));

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceData.device_code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      console.log('\n✅ AUTORIZACIÓN COMPLETADA');
      saveToken({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
        scope: tokenData.scope || SCOPE,
      });
      console.log(`  Expira en: ${tokenData.expires_in || '?'} segundos`);
      console.log(`  Scope: ${tokenData.scope || SCOPE}`);
      return true;
    }

    if (tokenData.error === 'authorization_pending') {
      process.stdout.write('.');
      continue;
    }
    if (tokenData.error === 'slow_down') {
      process.stdout.write('_');
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    if (tokenData.error === 'authorization_declined') {
      console.log('\n❌ Autorización rechazada por el usuario.');
      return null;
    }
    if (tokenData.error === 'expired_token') {
      console.log('\n❌ Código expirado. Vuelve a ejecutar npm run bing:auth.');
      return null;
    }
    
    console.error(`\nError: ${tokenData.error} — ${tokenData.error_description || ''}`);
    return null;
  }

  console.log('\n❌ Tiempo agotado.');
  return null;
}

async function checkToken() {
  const token = loadToken();
  if (!token) {
    console.log('No hay token guardado. Ejecuta npm run bing:auth para autorizar.');
    return false;
  }

  if (Date.now() < token.expires_at - 60000) {
    console.log('✅ Token válido');
    console.log(`  Expira: ${new Date(token.expires_at).toLocaleString()}`);
    console.log(`  Scope: ${token.scope || 'desconocido'}`);
    return true;
  }

  // Intentar refresh
  if (token.refresh_token) {
    console.log('Token expirado. Renovando con refresh_token...');
    const refreshRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        scope: SCOPE,
      }),
    });
    const refreshData = await refreshRes.json();

    if (refreshData.access_token) {
      token.access_token = refreshData.access_token;
      token.refresh_token = refreshData.refresh_token || token.refresh_token;
      token.expires_at = Date.now() + (refreshData.expires_in || 3600) * 1000;
      saveToken(token);
      console.log('✅ Token renovado');
      console.log(`  Expira: ${new Date(token.expires_at).toLocaleString()}`);
      return true;
    }
    
    console.log('❌ No se pudo renovar. Vuelve a ejecutar npm run bing:auth.');
    return false;
  }

  console.log('❌ Token expirado sin refresh_token. Vuelve a ejecutar npm run bing:auth.');
  return false;
}

async function listSites() {
  const token = loadToken();
  if (!token) { console.log('No autorizado.'); return; }

  const res = await fetch(
    `https://ssl.bing.com/webmaster/api.svc/json/GetUserSites?apikey=${process.env.INDEXNOW_KEY || ''}`,
    { headers: token ? { Authorization: `Bearer ${token.access_token}` } : {} }
  );
  const data = await res.json();
  if (data.d) {
    console.log('Sitios accesibles:');
    data.d.forEach(site => console.log(`  ${site.Url} — verificado: ${site.IsVerified}`));
  } else {
    console.log('No se pudieron listar sitios (posiblemente la API Key es suficiente).');
  }
}

async function main() {
  const mode = process.argv[2] || 'auth';

  if (mode === 'status' || mode === 'check') {
    await checkToken();
    return;
  }

  if (mode === 'sites') {
    await listSites();
    return;
  }

  // Modo auth
  if (!CLIENT_ID) {
    console.log('═'.repeat(65));
    console.log('  CONFIGURACIÓN INICIAL REQUERIDA (una sola vez)');
    console.log('═'.repeat(65));
    console.log('');
    console.log('Para usar OAuth necesitas registrar una app en Azure AD.');
    console.log('');
    console.log('1. Ve a: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade');
    console.log('2. "New registration" → Name: "Bing WMT Agent"');
    console.log('3. Supported accounts: "Accounts in any organizational directory and personal Microsoft accounts"');
    console.log('4. "Register"');
    console.log('5. Authentication → "Allow public client flows" → Yes → Save');
    console.log('6. API Permissions → Add → "APIs my organization uses" → buscar "Bing Webmaster"');
    console.log('7. Seleccionar "user_impersonation" → Add → Grant admin consent');
    console.log('8. Copiar "Application (client) ID"');
    console.log('9. Guardar en .env.local: BING_CLIENT_ID=<el id copiado>');
    console.log('10. Volver a ejecutar: npm run bing:auth');
    console.log('');
    console.log('Mientras tanto, la API Key actual (INDEXNOW_KEY) sigue funcionando');
    console.log('para operaciones básicas (crawl stats, URL info, queries).');
    console.log('═'.repeat(65));
    return;
  }

  console.log('Bing WMT — Autorización OAuth Device Code\n');
  console.log(`Client ID: ${mask(CLIENT_ID)} | Tenant: ${TENANT}\n`);

  const success = await deviceFlow();
  if (success) {
    await listSites();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
