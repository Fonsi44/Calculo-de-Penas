import { google } from 'googleapis';

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key_raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

console.log('=== ENV VARS CHECK ===');
console.log('EMAIL set:', !!email, email);
console.log('KEY set:', !!key_raw, 'length:', key_raw?.length);
console.log('PROPERTY_ID:', propertyId);
console.log('SITE_URL:', siteUrl);

if (!email || !key_raw || !propertyId || !siteUrl) {
  console.error('Missing required vars');
  process.exit(1);
}

const key = key_raw.replace(/\\n/g, '\n');

// Test 1: JWT Auth
console.log('\n=== TEST 1: JWT Auth ===');
try {
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  await auth.authorize();
  console.log('JWT Auth: ✅ OK', auth.hasScopes ? 'has scopes' : '');
} catch (e) {
  console.error('JWT Auth: ❌ FAILED', e.message);
  if (e.message.includes('invalid_grant')) console.log('   → La clave privada no coincide con el email o está expirada');
  if (e.message.includes('not found')) console.log('   → Service account no encontrado');
}

// Test 2: GA4 Data API
console.log('\n=== TEST 2: GA4 Data API ===');
try {
  const auth = new google.auth.JWT({
    email, key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  const analytics = google.analyticsdata({ version: 'v1beta', auth });
  const res = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '2025-01-01', endDate: '2025-12-31' }],
      metrics: [{ name: 'activeUsers' }],
    },
  });
  console.log('GA4 Data API: ✅ OK');
  console.log('   Response:', JSON.stringify(res.data).substring(0, 200));
} catch (e) {
  console.error('GA4 Data API: ❌ FAILED');
  console.error('   Error:', e.message);
  if (e.message.includes('not found') || e.message.includes('404'))
    console.log('   → Property ID incorrecto o API no habilitada');
  if (e.message.includes('permission'))
    console.log('   → Service account no tiene permisos en GA4');
}

// Test 3: Search Console API
console.log('\n=== TEST 3: Search Console API ===');
try {
  const auth = new google.auth.JWT({
    email, key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const sc = google.searchconsole({ version: 'v1', auth });
  const res = await sc.sites.get({ siteUrl });
  console.log('Search Console: ✅ OK');
  console.log('   Site:', res.data.siteUrl, 'Permission level:', res.data.permissionLevel);
} catch (e) {
  console.error('Search Console: ❌ FAILED');
  console.error('   Error:', e.message);
  if (e.message.includes('not found') || e.message.includes('404'))
    console.log('   → Site URL no encontrada en Search Console');
  if (e.message.includes('permission') || e.message.includes('403'))
    console.log('   → Service account no tiene permisos en Search Console');
}

// Test 4: IndexNow
console.log('\n=== TEST 4: IndexNow ping ===');
const indexNowKey = process.env.INDEXNOW_KEY;
console.log('INDEXNOW_KEY set:', !!indexNowKey);
if (indexNowKey) {
  try {
    const resp = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'www.pinedayasocioshn.com',
        key: indexNowKey,
        keyLocation: `https://www.pinedayasocioshn.com/${indexNowKey}.txt`,
        urlList: ['https://www.pinedayasocioshn.com/'],
      }),
    });
    console.log('IndexNow: HTTP', resp.status, resp.statusText);
  } catch (e) {
    console.error('IndexNow: ❌ FAILED', e.message);
  }
} else {
  console.log('IndexNow: ⏭ SKIP (no key)');
}
