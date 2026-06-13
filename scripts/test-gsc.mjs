import { google } from 'googleapis';

const CLIENT_ID = '476986553167-uq4s6m9d8mk30jg5esgj27bft0ab3d19';
const CLIENT_SECRET = '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';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

const oauth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000/auth');
oauth.setCredentials({ refresh_token: REFRESH_TOKEN });

// Test GA4
console.log('GA4...');
const ga4 = google.analyticsdata({ version: 'v1beta', auth: oauth });
const gr = await ga4.properties.runReport({
  property: 'properties/541022095',
  requestBody: { dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }] }
});
const v = gr.data.rows[0].metricValues;
console.log('OK -', v[0].value, 'usuarios,', v[1].value, 'sesiones');

// Test GSC
const d = new Date();
const endDate = d.toISOString().split('T')[0];
d.setDate(d.getDate() - 28);
const startDate = d.toISOString().split('T')[0];

console.log('\nGSC (' + startDate + ' to ' + endDate + ')...');
const sc = google.searchconsole({ version: 'v1', auth: oauth });
try {
  const sr = await sc.searchanalytics.query({
    siteUrl: 'sc-domain:pinedayasociadoshn.com',
    requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 10 }
  });
  if (sr.data.rows && sr.data.rows.length > 0) {
    console.log('OK -', sr.data.rows.length, 'consultas');
    sr.data.rows.slice(0, 5).forEach(r => {
      console.log('  "' + r.keys[0] + '": ' + r.clicks + ' clicks, ' + r.impressions + ' impresiones');
    });
  } else {
    console.log('OK - Sin consultas en 28d');
  }
} catch(e) {
  console.log('Error:', e.message.substring(0, 500));
}
