/**
 * Obtiene un refresh token OAuth2 con scope webmasters (GSC write).
 *
 * Flujo:
 *   1. Abre el navegador en la URL de autorización de Google
 *   2. Inicia servidor HTTP en localhost:3000 para recibir el callback
 *   3. Intercambia el código por refresh token y lo muestra
 *
 * Requisito previo:
 *   - El OAuth Client ID debe tener http://localhost:3000 como redirect URI
 *     autorizada en GCP Console (suele estar por defecto).
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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });
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
  'https://www.googleapis.com/auth/webmasters',
];

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('🔐 Abriendo navegador para autorizar GSC...');
console.log('Si no se abre, copia esta URL:\n');
console.log(authUrl);
console.log('');

// Abrir navegador
const cmd = process.platform === 'win32'
  ? `start "" "${authUrl}"`
  : process.platform === 'darwin'
    ? `open "${authUrl}"`
    : `xdg-open "${authUrl}"`;

exec(cmd, (err) => {
  if (err) console.log('⚠️  No se pudo abrir el navegador. Abre la URL manualmente.');
});

// Servidor HTTP para recibir el callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3000`);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Error: no se recibió código</h1>');
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);

    console.log('\n✅ Token obtenido!\n');
    console.log('Copia esta línea en .env.local:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log(`Scope: ${tokens.scope}`);
    console.log(`Expira: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'}`);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html>
      <body style="font-family:sans-serif;max-width:600px;margin:40px auto;text-align:center">
        <h1 style="color:green">✅ Autorización completada</h1>
        <p>El refresh token se ha generado correctamente en la consola.</p>
        <p>Ya puedes cerrar esta ventana.</p>
      </body>
      </html>
    `);

    // Cerrar servidor tras 1s
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1000);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Error: ${err.message}</h1>`);
    server.close();
    process.exit(1);
  }
});

server.listen(3000, () => {
  console.log('⏳ Esperando autorización en http://localhost:3000 ...');
});
