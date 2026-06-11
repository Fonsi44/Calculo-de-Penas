/**
 * Autentica con la cuenta alfonsroiget@gmail.com via OAuth 2.0 PKCE
 * y guarda el refresh token en .env.local.
 * 
 * Uso:
 *   node scripts/ga-oauth.mjs
 *   → Abre la URL en tu navegador (NO en el navegador de Playwright)
 *   → Inicia sesión con alfonsroiget@gmail.com
 *   → Copia el código de la barra de direcciones después de autorizar
 *   → Pega el código cuando se te pida
 * 
 * Al terminar, .env.local tendrá GOOGLE_REFRESH_TOKEN configurado.
 * Ese token se usa automáticamente para GA4 Data API y Search Console API.
 */
import { createServer } from 'http';
import { config } from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

// Cargar env actual
config({ path: envPath });
config({ path: resolve(__dirname, '..', '.env') });

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Faltan OAUTH_CLIENT_ID y OAUTH_CLIENT_SECRET en .env.local');
  console.error('Crea un cliente OAuth en: https://console.cloud.google.com/apis/credentials');
  console.error('Tipo: Aplicación de escritorio, URI: http://localhost');
  process.exit(1);
}
const REDIRECT_PORT = 80;
const REDIRECT_URI = 'http://localhost';
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.manage.users',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'openid',
  'email',
];

function buildAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/auth?${params}`;
}

async function exchangeCode(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

function saveRefreshToken(token) {
  let content = '';
  try { content = readFileSync(envPath, 'utf8'); } catch {}

  const line = `GOOGLE_REFRESH_TOKEN=${token}`;
  if (content.includes('GOOGLE_REFRESH_TOKEN=')) {
    content = content.replace(/GOOGLE_REFRESH_TOKEN=.*/g, line);
  } else {
    content = content.trimEnd() + '\n# Google OAuth refresh token (alfonsroiget@gmail.com)\n' + line + '\n';
  }
  writeFileSync(envPath, content);
  console.log('✅ Refresh token guardado en .env.local');
}

async function main() {
  const authUrl = buildAuthUrl();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  GOOGLE OAUTH — CONFIGURACIÓN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Abre esta URL en TU navegador (Chrome):\n');
  console.log(authUrl);
  console.log('\n2. Inicia sesión con alfonsroiget@gmail.com');
  console.log('3. Google te redirigirá a localhost:3001');
  console.log('4. Espera...\n');

  // Iniciar servidor local para recibir el callback
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${REDIRECT_PORT}`);
    const code = url.searchParams.get('code');
    
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Error</h1><p>No se recibió el código de autorización.</p>');
      return;
    }

    try {
      const tokens = await exchangeCode(code);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>✅ Autorización completada</h1><p>Ya puedes cerrar esta ventana y volver a la terminal.</p>');
      
      if (tokens.refresh_token) {
        saveRefreshToken(tokens.refresh_token);
      } else {
        console.log('⚠️  No se recibió refresh_token. Revoca el acceso en https://myaccount.google.com/permissions y vuelve a intentarlo.');
      }
      console.log('✅ Acceso concedido. Token válido por', tokens.expires_in, 'segundos.');
      console.log('   GA4 y Search Console ya deberían funcionar con tus credenciales.');
    } catch (err) {
      console.error('Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Error</h1><p>' + err.message + '</p>');
    }
    server.close();
  });

  server.listen(REDIRECT_PORT, () => {
    console.log('   Servidor esperando en http://localhost:' + REDIRECT_PORT);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
