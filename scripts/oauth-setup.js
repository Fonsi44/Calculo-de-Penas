const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '476986553167-uq4s6m9d8mk30jg5esgj27bft0ab3d19';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/auth';
const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/analytics.edit'];

const oauth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const authUrl = oauth.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });

console.log('\n===== ABRE ESTA URL EN TU NAVEGADOR =====\n');
console.log(authUrl);
console.log('\nAutoriza con alfonsroiget@gmail.com.');
console.log('Te redirigira a http://localhost:3000/auth?code=...');
console.log('Copia la URL COMPLETA de la barra de direcciones y PEGALA AQUI:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('> ', async (input) => {
  let code = input.trim();
  const urlMatch = code.match(/[?&]code=([^&]+)/);
  if (urlMatch) code = decodeURIComponent(urlMatch[1]);

  try {
    const { tokens } = await oauth.getToken({ code, redirect_uri: REDIRECT_URI });
    oauth.setCredentials(tokens);

    console.log('\n✅ REFRESH TOKEN:', tokens.refresh_token);

    // Add SA to GA4
    const admin = google.analyticsadmin({ version: 'v1beta', auth: oauth });
    const saEmail = 'id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com';
    console.log('\nAdding service account to GA4...');
    try {
      await admin.properties.userLinks.create({
        parent: 'properties/541022095',
        requestBody: { emailAddress: saEmail, directRoles: ['predefinedRoles/viewer'] }
      });
      console.log('✅ SA added to GA4');
    } catch (e) {
      if (e.message.includes('409')) console.log('✅ SA already has access');
      else console.log('Note:', e.message.substring(0, 150));
    }

    // Test GA4
    console.log('\nTesting GA4 Data API...');
    const dataApi = google.analyticsdata({ version: 'v1beta', auth: oauth });
    const report = await dataApi.properties.runReport({
      property: 'properties/541022095',
      requestBody: { dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }] }
    });
    console.log('✅ GA4 OK -', report.data.totals[0].metricValues[0].value, 'usuarios,', report.data.totals[0].metricValues[1].value, 'sesiones (28d)');

    // Print env vars
    console.log('\n===== VARIABLES PARA VERCEL =====');
    console.log('OAUTH_CLIENT_ID=' + CLIENT_ID);
    console.log('OAUTH_CLIENT_SECRET=' + CLIENT_SECRET);
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('GOOGLE_ANALYTICS_PROPERTY_ID=541022095');
    console.log('GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:pinedayasociadoshn.com');

  } catch (e) {
    console.log('\nError:', e.message.substring(0, 300));
  }
  rl.close();
});
