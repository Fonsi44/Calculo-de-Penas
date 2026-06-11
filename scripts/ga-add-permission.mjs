/**
 * Script para añadir la cuenta de servicio a GA4 vía Admin API.
 * 
 * Paso 1: node scripts/ga-add-permission.mjs
 *   → Abre una URL de consentimiento en tu navegador.
 *   → Inicia sesión con tu cuenta de Google (alfonsroiget@gmail.com).
 *   → Copia el código de autorización que aparece al final.
 * 
 * Paso 2: node scripts/ga-add-permission.mjs <código>
 *   → Usa el código para añadir la cuenta de servicio como VISOR en GA4.
 */
import { google } from 'googleapis';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });
config({ path: resolve(__dirname, '..', '.env') });

const CLIENT_ID = process.env.GAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GAUTH_CLIENT_SECRET;
const REDIRECT_URI = 'https://sdk.cloud.google.com/authcode.html';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Faltan GAUTH_CLIENT_ID y GAUTH_CLIENT_SECRET en .env.local');
  console.error('Consíguelos en: https://console.cloud.google.com/apis/credentials');
  process.exit(1);
}
const SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

async function main() {
  if (!SERVICE_ACCOUNT || !PROPERTY_ID) {
    console.error('Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_ANALYTICS_PROPERTY_ID en .env.local');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const code = process.argv[2];

  if (!code) {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/analytics.manage.users'],
      prompt: 'consent',
    });
    console.log('\n1. Abre esta URL en tu navegador:\n');
    console.log(url);
    console.log('\n2. Inicia sesión con alfonsroiget@gmail.com');
    console.log('3. Copia el código de autorización de la página final');
    console.log('4. Ejecuta: node scripts/ga-add-permission.mjs <código>\n');
    process.exit(0);
  }

  // Paso 2: obtener token y añadir la cuenta de servicio
  console.log('Obteniendo token de acceso...');
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  console.log('Token obtenido.');

  const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });

  console.log(`Añadiendo ${SERVICE_ACCOUNT} a la propiedad ${PROPERTY_ID}...`);

  try {
    const res = await admin.properties.userLinks.create({
      parent: `properties/${PROPERTY_ID}`,
      requestBody: {
        userLink: {
          emailAddress: SERVICE_ACCOUNT,
        },
        roles: ['analytics.viewer'],
      },
    });
    console.log('✅ Cuenta añadida como Visualizador.');
    console.log('   Verifica en: https://analytics.google.com/analytics/web/#/p' + PROPERTY_ID + '/admin/property/access-management');
  } catch (err) {
    if (err.response?.data) {
      console.error('Error API:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
