import { google } from 'googleapis';

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key_raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const key = key_raw.replace(/\\n/g, '\n');

const candidates = ['397465726', '541022095'];
const results = [];

for (const pid of candidates) {
  try {
    const auth = new google.auth.JWT({
      email, key,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const analytics = google.analyticsdata({ version: 'v1beta', auth });
    const res = await analytics.properties.runReport({
      property: `properties/${pid}`,
      requestBody: {
        dateRanges: [{ startDate: '2026-05-01', endDate: '2026-06-11' }],
        metrics: [{ name: 'activeUsers' }],
      },
    });
    console.log(`PID ${pid}: ✅ OK —`, JSON.stringify(res.data).substring(0, 150));
    results.push({ pid, ok: true, data: res.data });
  } catch (e) {
    console.log(`PID ${pid}: ❌ ${e.message.substring(0, 120)}`);
    results.push({ pid, ok: false, error: e.message });
  }
}

const working = results.find(r => r.ok);
if (working) {
  console.log(`\n✅ Property ID correcto: ${working.pid}`);
}
