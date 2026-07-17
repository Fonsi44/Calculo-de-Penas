/**
 * Obtiene un refresh token OAuth2 con scopes para GSC + GA4.
 *
 * Scopes solicitados:
 *   - webmasters.readonly  → Google Search Console (solo lectura)
 *   - analytics.readonly   → Google Analytics 4 Data API (lectura de métricas)
 *
 * Flujo:
 *   1. Abre el navegador en la URL de autorización de Google
 *   2. Inicia servidor HTTP en localhost:3000 para recibir el callback
 *   3. Intercambia el código por refresh token
 *   4. Lo guarda automáticamente en .env.local (reemplazando el anterior)
 *   5. Verifica que GA4 y GSC responden con el nuevo token
 *
 * Requisito previo:
 *   - El OAuth Client ID debe tener http://localhost:3000 como redirect URI
 *     autorizada en GCP Console.
 *   - Las credenciales se leen de variables de entorno (OAUTH_CLIENT_ID,
 *     OAUTH_CLIENT_SECRET en .env.local). NUNCA hardcodear el client_secret
 *     en este archivo: es un secreto y su commit lo filtra al historial de git.
 *
 * Uso:
 *   node scripts/oauth-get-refresh-token.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import http from 'http';
import { exec } from 'child_process';
import { readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_LOCAL = resolve(root, '.env.local');
config({ path: ENV_LOCAL });
config({ path: resolve(root, '.env') });

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Faltan OAUTH_CLIENT_ID y/o OAUTH_CLIENT_SECRET en .env.local.');
  console.error('   Configúralas en GCP Console → APIs y servicios → Credenciales → OAuth 2.0 Client ID.');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3000';
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
];
const OAUTH_STATE = randomBytes(32).toString('hex');

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
  state: OAUTH_STATE,
});

console.log('🔐 Abriendo navegador para autorizar GSC + GA4...');
console.log('La URL de autorización no se imprime para evitar registrar códigos o identificadores.');

/**
 * Guarda el refresh token en .env.local reemplazando la línea existente
 * o añadiéndola al final. Devuelve true si escribió el archivo.
 */
function persistRefreshToken(refreshToken) {
  let env = '';
  try {
    env = readFileSync(ENV_LOCAL, 'utf8');
  } catch {
    env = '';
  }
  const line = `GOOGLE_REFRESH_TOKEN=${refreshToken}`;
  if (/^GOOGLE_REFRESH_TOKEN=.*$/m.test(env)) {
    env = env.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line);
  } else {
    env = env.trimEnd() + '\n' + line + '\n';
  }
  const temp = `${ENV_LOCAL}.${process.pid}.tmp`;
  try {
    writeFileSync(temp, env, { encoding: 'utf8', mode: 0o600 });
    renameSync(temp, ENV_LOCAL);
  } finally {
    try { rmSync(temp, { force: true }); } catch {}
  }
  return true;
}

/**
 * Verifica que el nuevo token funciona contra GA4 y GSC.
 * Lee GOOGLE_ANALYTICS_PROPERTY_ID y GOOGLE_SEARCH_CONSOLE_SITE_URL de .env.local.
 */
async function verifyToken(refreshToken) {
  const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const results = { ga4: null, gsc: null };

  // GA4
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (propertyId) {
    try {
      const ga = google.analyticsdata({ version: 'v1beta', auth: oauth2 });
      const r = await ga.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: { dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }], metrics: [{ name: 'activeUsers' }] },
      });
      const users = r.data.rows?.[0]?.metricValues?.[0]?.value || '0';
      results.ga4 = { ok: true, users };
    } catch (err) {
      results.ga4 = { ok: false, error: err.message?.slice(0, 150) };
    }
  } else {
    results.ga4 = { ok: false, error: 'GOOGLE_ANALYTICS_PROPERTY_ID no definido en .env.local' };
  }

  // GSC
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (siteUrl) {
    try {
      const sc = google.searchconsole({ version: 'v1', auth: oauth2 });
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 86400000);
      const fmt = (d) => d.toISOString().split('T')[0];
      const r = await sc.searchanalytics.query({
        siteUrl,
        requestBody: { startDate: fmt(start), endDate: fmt(end), dimensions: ['query'], rowLimit: 3 },
      });
      results.gsc = { ok: true, rows: r.data.rows?.length || 0 };
    } catch (err) {
      results.gsc = { ok: false, error: err.message?.slice(0, 150) };
    }
  } else {
    results.gsc = { ok: false, error: 'GOOGLE_SEARCH_CONSOLE_SITE_URL no definido en .env.local' };
  }

  return results;
}

// Servidor HTTP para recibir el callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3000`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || state !== OAUTH_STATE) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Solicitud OAuth inválida o caducada</h1>');
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('Google no devolvió refresh_token. Vuelve a ejecutar el script (prompt:consent fuerza su emisión).');
    }

    console.log('\n✅ Token obtenido!');
    console.log('   Scopes mínimos de lectura concedidos.');

    // 1. Guardar en .env.local mediante reemplazo atómico.
    persistRefreshToken(tokens.refresh_token);
    console.log('\n💾 Refresh token guardado en .env.local (valor no mostrado).');

    // 2. Responder al navegador.
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html>
      <body style="font-family:sans-serif;max-width:600px;margin:40px auto;text-align:center">
        <h1 style="color:green">✅ Autorización completada</h1>
        <p>El refresh token se ha guardado en .env.local.</p>
        <p>Revisa la consola para ver la verificación de GA4 y GSC.</p>
        <p>Ya puedes cerrar esta ventana.</p>
      </body>
      </html>
    `);

    // 3. Verificar GA4 + GSC con el nuevo token.
    console.log('\n🔍 Verificando GA4 y GSC con el nuevo token…');
    const verification = await verifyToken(tokens.refresh_token);

    if (verification.ga4?.ok) {
      console.log(`   ✅ GA4 OK — usuarios activos (7d): ${verification.ga4.users}`);
    } else {
      console.log(`   ❌ GA4 falló: ${verification.ga4?.error}`);
    }
    if (verification.gsc?.ok) {
      console.log(`   ✅ GSC OK — ${verification.gsc.rows} consultas recuperadas (7d)`);
    } else {
      console.log(`   ❌ GSC falló: ${verification.gsc?.error}`);
    }

    console.log(`\nExpira: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'} (access token; el refresh no expira)`);

    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1500);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>No se pudo completar la autorización</h1>');
    server.close();
    process.exit(1);
  }
});

server.listen(3000, () => {
  console.log('⏳ Esperando autorización en http://localhost:3000 ...');
  const cmd = process.platform === 'win32'
    ? `start "" "${authUrl}"`
    : process.platform === 'darwin'
      ? `open "${authUrl}"`
      : `xdg-open "${authUrl}"`;
  exec(cmd, (err) => {
    if (err) console.error('❌ No se pudo abrir el navegador automáticamente.');
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('❌ El puerto localhost:3000 está ocupado. Cierra la aplicación que lo usa y repite el comando.');
  } else {
    console.error(`❌ No se pudo iniciar el callback OAuth: ${error.code || 'error desconocido'}`);
  }
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Autorización cancelada por tiempo de espera.');
  server.close();
  process.exit(1);
}, 5 * 60 * 1000).unref();
