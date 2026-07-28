/**
 * Test rápido de la cuenta de servicio contra GSC y GA4.
 * Lee las credenciales desde .env.local (o Vercel env en producción).
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const { google } = await import('googleapis');

const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

console.log('═'.repeat(60));
console.log(' TEST CUENTA DE SERVICIO');
console.log('═'.repeat(60));
console.log(`Email:     ${saEmail || '❌ NO CONFIGURADO'}`);
console.log(`Key set:   ${saKey ? '✅ Sí (' + saKey.length + ' chars)' : '❌ NO CONFIGURADO'}`);
console.log(`Property:  ${propertyId || '❌ NO CONFIGURADO'}`);
console.log(`GSC Site:  ${siteUrl || '❌ NO CONFIGURADO'}`);

if (!saEmail || !saKey) {
  console.error('\n❌ No hay credenciales de service account en .env.local');
  console.error('   Usando OAuth como fallback...');
}

// Intentar auth con service account primero
let auth;
try {
  if (saEmail && saKey) {
    auth = new google.auth.JWT({
      email: saEmail,
      key: saKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/analytics.readonly'],
    });
    // Probar que el token se genera
    const token = await auth.getAccessToken();
    console.log(`\n🔑 JWT Token: ✅ Generado (${token?.token?.length || '?'} chars)`);
  } else {
    // Fallback a OAuth
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
      console.error('❌ Tampoco hay OAuth configurado');
      process.exit(1);
    }
    auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
    auth.setCredentials({ refresh_token: refreshToken });
    console.log(`\n🔑 OAuth: Usando refresh token...`);
  }
} catch (err) {
  console.error(`\n❌ Error generando token: ${err.message}`);
  process.exit(1);
}

// Test GSC
console.log('\n' + '─'.repeat(60));
console.log(' TEST SEARCH CONSOLE');
console.log('─'.repeat(60));

if (siteUrl) {
  const sc = google.searchconsole({ version: 'v1', auth });
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 28 * 86400000);
    const fmt = (d) => d.toISOString().split('T')[0];
    const res = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ['query'],
        rowLimit: 3,
      },
    });
    console.log(`✅ GSC CONECTADO`);
    console.log(`   Filas: ${res.data.rows?.length || 0}`);
    if (res.data.rows?.length) {
      res.data.rows.forEach(r => console.log(`   "${r.keys?.[0]}": ${r.clicks} clicks, ${r.impressions} impresiones`));
    }
  } catch (err) {
    console.log(`❌ GSC Error:`);
    console.log(`   Mensaje: ${err.message?.substring(0, 300)}`);
    if (err.errors) console.log(`   Detalle: ${JSON.stringify(err.errors)}`);
    if (err.code === 403) console.log('   → La cuenta de servicio NO tiene permisos en GSC');
    if (err.code === 404) console.log('   → Site URL no encontrada en GSC');
  }
} else {
  console.log('⚠️  GOOGLE_SEARCH_CONSOLE_SITE_URL no configurado');
}

// Test GA4
console.log('\n' + '─'.repeat(60));
console.log(' TEST GOOGLE ANALYTICS 4');
console.log('─'.repeat(60));

if (propertyId) {
  const ga = google.analyticsdata({ version: 'v1beta', auth });
  try {
    const res = await ga.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
        metrics: [{ name: 'activeUsers' }],
      },
    });
    const users = res.data.rows?.[0]?.metricValues?.[0]?.value || '0';
    console.log(`✅ GA4 CONECTADO`);
    console.log(`   Usuarios activos (28d): ${users}`);
  } catch (err) {
    console.log(`❌ GA4 Error:`);
    console.log(`   Mensaje: ${err.message?.substring(0, 300)}`);
    if (err.code === 403) console.log('   → La cuenta de servicio NO tiene permisos en GA4');
    if (err.code === 404) console.log('   → Property ID no encontrado');
  }
} else {
  console.log('⚠️  GOOGLE_ANALYTICS_PROPERTY_ID no configurado');
}

console.log('\n' + '═'.repeat(60));
console.log(' TEST COMPLETADO');
console.log('═'.repeat(60));
