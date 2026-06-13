import { google } from 'googleapis';

const CLIENT_ID = '476986553167-uq4s6m9d8mk30jg5esgj27bft0ab3d19';
const CLIENT_SECRET = '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';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

const oauth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000/auth');
oauth.setCredentials({ refresh_token: REFRESH_TOKEN });

// Test GA4 Data API
const dataApi = google.analyticsdata({ version: 'v1beta', auth: oauth });
let report;
try {
  report = await dataApi.properties.runReport({
    property: 'properties/541022095',
    requestBody: {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'newUsers' }]
    }
  });
  console.log('✅ GA4 OK');
} catch(e) {
  console.log('❌ GA4 Error:', e.message.substring(0, 500));
}

// Read GA4 data correctly
if (report && report.data && report.data.rows && report.data.rows.length > 0) {
  const r = report.data.rows[0].metricValues;
  console.log('\n✅ GA4 DATOS CORRECTOS');
  console.log('Usuarios activos (28d):', r[0].value);
  console.log('Sesiones:', r[1].value);
  console.log('Paginas vistas:', r[2].value);
  console.log('Nuevos usuarios:', r[3].value);
}

// Test Search Console API
const scApi = google.searchconsole({ version: 'v1', auth: oauth });
const gscUrls = ['sc-domain:pinedayasociadoshn.com', 'https://www.pinedayasociadoshn.com/'];
for (const siteUrl of gscUrls) {
  console.log('\nTrying GSC with:', siteUrl);
  try {
    const sc = await scApi.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: '28daysAgo',
        endDate: 'yesterday',
        dimensions: ['query'],
        rowLimit: 5
      }
    });
    console.log('✅ GSC FUNCIONA con', siteUrl);
    if (sc.data.rows) {
      sc.data.rows.slice(0, 3).forEach(r => {
        console.log('  "' + r.keys[0] + '": ' + r.clicks + ' clicks');
      });
    } else {
      console.log('  Sin datos de consultas');
    }
    break;
  } catch(e) {
    console.log('  Error:', e.message.substring(0, 150));
  }
}
