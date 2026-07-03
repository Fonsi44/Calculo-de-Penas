#!/usr/bin/env node
/**
 * Bing WMT OAuth Device Code Flow
 *
 * Genera un enlace/código para que el usuario autorice desde su navegador normal.
 * Usa el client_id público de Bing Webmaster Tools (descubierto del web app).
 *
 * Uso: node scripts/bing-oauth-device.mjs
 * 
 * Flujo:
 * 1. Solicita device_code a Microsoft
 * 2. Muestra enlace y código para el usuario
 * 3. Usuario abre https://microsoft.com/devicelogin e introduce el código
 * 4. El script espera y obtiene el token
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

// Microsoft OAuth endpoints
const TOKEN_URL = (tenant) => `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
const DEVICE_URL = (tenant) => `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/devicecode`;

// Client IDs y tenants a probar
const CLIENT_CONFIGS = [
  // Bing WMT web app (observado en tráfico del dashboard)
  { id: 'f0e2b555-7a41-4029-a16b-40bc5f719ff6', tenant: 'consumers' },
  { id: 'f0e2b555-7a41-4029-a16b-40bc5f719ff6', tenant: 'organizations' },
  // Microsoft Azure CLI (soporta device code)
  { id: '04b07795-8ddb-461a-bbee-02f9e1bf7b46', tenant: 'common' },
];

// Bing WMT API scopes a probar
const SCOPES = [
  'https://ssl.bing.com/.default',
  'https://ssl.bing.com/user_impersonation',
  'https://api.bing.microsoft.com/.default',
];

async function tryDeviceFlow(clientId, tenant, scope) {
  const label = `${clientId.substring(0,12)}... | ${tenant} | ${scope.substring(0,25)}...`;
  console.log(`\nProbando: ${label}`);
  
  const deviceRes = await fetch(DEVICE_URL(tenant), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      scope: scope,
    }),
  });

  const deviceData = await deviceRes.json();

  if (deviceData.error) {
    console.log(`  ❌ ${deviceData.error}: ${(deviceData.error_description || '').substring(0, 120)}`);
    return null;
  }

  console.log('\n' + '='.repeat(60));
  console.log('  ABRE ESTE ENLACE EN TU NAVEGADOR NORMAL:');
  console.log(`  ${deviceData.verification_uri}`);
  console.log('');
  console.log('  Introduce este código:');
  console.log(`  ${deviceData.user_code}`);
  console.log('='.repeat(60));
  console.log(`\nEl código expira en ${deviceData.expires_in} segundos. Esperando...`);

  const interval = deviceData.interval || 5;
  const deadline = Date.now() + deviceData.expires_in * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval * 1000));

    const tokenRes = await fetch(TOKEN_URL(tenant), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceData.device_code,
        scope: scope,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      console.log('\n✅ TOKEN OBTENIDO!');
      return tokenData;
    }

    if (tokenData.error === 'authorization_pending') {
      process.stdout.write('.');
      continue;
    }

    if (tokenData.error === 'slow_down') {
      process.stdout.write('_');
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (tokenData.error === 'expired_token') {
      console.log('\n❌ Código expirado.');
      return null;
    }

    console.log(`\n❌ ${tokenData.error}: ${(tokenData.error_description || '').substring(0, 120)}`);
    return null;
  }

  console.log('\n❌ Tiempo agotado.');
  return null;
}

async function main() {
  console.log('Bing WMT OAuth Device Code Flow\n');

  const customClient = process.env.BING_WMT_CLIENT_ID;
  const customTenant = process.env.BING_WMT_TENANT || 'consumers';

  if (customClient) {
    for (const scope of SCOPES) {
      const token = await tryDeviceFlow(customClient, customTenant, scope);
      if (token) { printToken(token); return; }
    }
  } else {
    for (const cfg of CLIENT_CONFIGS) {
      for (const scope of SCOPES) {
        const token = await tryDeviceFlow(cfg.id, cfg.tenant, scope);
        if (token) { printToken(token); return; }
      }
    }
  }

  console.log('\n❌ Ninguna combinación funcionó.');
  console.log('\nPara continuar, necesitas registrar una aplicación en Azure AD:');
  console.log('1. Ve a https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade');
  console.log('2. "New registration" → Name: "Bing WMT Agent"');
  console.log('3. "Supported account types": "Accounts in any organizational directory and personal Microsoft accounts"');
  console.log('4. "Redirect URI": no necesaria para device code');
  console.log('5. "Register" y copia el "Application (client) ID"');
  console.log('6. "API Permissions" → "Add a permission" → "APIs my organization uses" → busca "Bing Webmaster"');
  console.log('7. Selecciona "user_impersonation" y "Add permissions"');
  console.log('8. "Grant admin consent"');
  console.log('9. Ejecuta: BING_WMT_CLIENT_ID=TU_CLIENT_ID node scripts/bing-oauth-device.mjs');
  rl.close();
}

main();

function printToken(token) {
  console.log('\nToken guardado. Puedes usarlo con la API de Bing WMT.');
  console.log(`Access token (primeros 25 chars): ${token.access_token.substring(0, 25)}...`);
  if (token.refresh_token) {
    console.log('✅ Refresh token disponible para uso futuro.');
    console.log(`\nGuarda estas variables en .env.local:`);
    console.log(`BING_WMT_REFRESH_TOKEN=${token.refresh_token}`);
  }
  rl.close();
}
