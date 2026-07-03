#!/usr/bin/env node
/**
 * Generador de enlaces OAuth — Google (GSC/GA4) y Bing WMT
 *
 * Lee credenciales de .env.local y genera URLs de autorización.
 * El usuario pincha el enlace, inicia sesión y acepta permisos.
 *
 * Uso: node scripts/auth-generate-links.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const GOOGLE_CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const BING_CLIENT_ID = process.env.BING_CLIENT_ID;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

function mask(s) { return s ? '***configurado***' : '❌ no configurado'; }

console.log('═'.repeat(65));
console.log('  GENERADOR DE ENLACES OAuth');
console.log('═'.repeat(65));

// ── GOOGLE ──
console.log('\n── GOOGLE (GSC / GA4 / GBP) ──');
console.log(`  OAUTH_CLIENT_ID: ${mask(GOOGLE_CLIENT_ID)}`);

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  // Google OAuth 2.0 authorization URL
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/business.manage',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: 'http://localhost:3000/api/oauth/callback',
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state: crypto.randomBytes(16).toString('hex'),
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  console.log('\n  PINCHA ESTE ENLACE PARA DAR PERMISOS A GOOGLE:');
  console.log(`  ${authUrl}`);
  console.log('\n  1. Abre el enlace en tu navegador');
  console.log('  2. Inicia sesión con tu cuenta de Google/Gmail');
  console.log('  3. Acepta los permisos (GSC + GA4 + GBP)');
  console.log('  4. Serás redirigido a localhost:3000');
  console.log('  5. El código de autorización se captura automáticamente');
  console.log('\n  O alternativamente, si tienes gcloud instalado:');
  console.log('  npm run auth:google');
} else {
  console.log('\n  ⚠️  OAUTH_CLIENT_ID u OAUTH_CLIENT_SECRET no configurados en .env.local');
  console.log('  Necesitas credenciales OAuth de Google Cloud Console.');
  console.log('');
  console.log('  Alternativa: instala gcloud CLI y ejecuta npm run auth:google');
  console.log('  winget install Google.CloudSDK');
}

// ── BING ──
console.log('\n── BING (Webmaster Tools) ──');
console.log(`  INDEXNOW_KEY: ${mask(INDEXNOW_KEY)}`);
console.log(`  BING_CLIENT_ID (OAuth): ${mask(BING_CLIENT_ID)}`);

if (INDEXNOW_KEY) {
  console.log('\n  ✅ Bing API Key YA está funcionando.');
  console.log('  Puedes ver datos básicos: npm run seo:bing');
}

if (BING_CLIENT_ID) {
  const tenant = process.env.BING_TENANT || 'consumers';
  const scope = encodeURIComponent('https://ssl.bing.com/.default offline_access');
  const deviceUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/devicecode`;

  console.log('\n  ✅ BING_CLIENT_ID configurado. Ejecuta para generar enlace:');
  console.log('  npm run auth:bing');
} else {
  console.log('\n  ⚠️  BING_CLIENT_ID no configurado (falta registrar app en Azure AD).');
  console.log('');
  console.log('  Para obtener acceso OAuth completo a Bing WMT:');
  console.log('');
  console.log('  1. Ve a: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade');
  console.log('  2. "New registration" → Name: "Bing WMT Agent"');
  console.log('  3. Supported accounts: TODOS (incluye personales/Gmail)');
  console.log('  4. Authentication → "Allow public client flows" → Yes → Save');
  console.log('  5. API Permissions → "Bing Webmaster Tools" → user_impersonation');
  console.log('  6. Grant admin consent');
  console.log('  7. Copia "Application (client) ID"');
  console.log('  8. Guárdalo en .env.local: BING_CLIENT_ID=<el-id>');
  console.log('  9. Vuelve a ejecutar: npm run auth:bing');
  console.log('');
  console.log('  Mientras tanto, la API Key funciona para datos básicos.');
}

// ── RESUMEN ──
console.log('\n═'.repeat(65));
console.log('  RESUMEN');
console.log('═'.repeat(65));

const googleReady = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
const bingKeyReady = !!INDEXNOW_KEY;
const bingOAuthReady = !!BING_CLIENT_ID;

console.log(`  Google OAuth:  ${googleReady ? '✅ listo (enlace arriba)' : '❌ falta OAUTH_CLIENT_ID'}`);
console.log(`  Bing API Key:  ${bingKeyReady ? '✅ funcionando' : '❌ falta INDEXNOW_KEY'}`);
console.log(`  Bing OAuth:    ${bingOAuthReady ? '✅ listo (npm run auth:bing)' : '⬜ falta Azure AD (5 min)'}`);

if (googleReady) {
  console.log('\n  → Pincha el enlace de Google arriba para empezar.');
}
if (!bingOAuthReady && bingKeyReady) {
  console.log('  → La API Key de Bing ya da acceso básico. Para acceso completo,');
  console.log('    registra la app en Azure AD (pasos arriba, 5 minutos).');
}
console.log('');
