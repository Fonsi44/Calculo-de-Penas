import { google } from 'googleapis';

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key_raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const key = key_raw.replace(/\\n/g, '\n');

async function main() {
  // Test GA4 with both property IDs
  const auth = new google.auth.JWT({
    email, key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  for (const pid of ['397465726', '541022095']) {
    try {
      const analytics = google.analyticsdata({ version: 'v1beta', auth });
      const res = await analytics.properties.runReport({
        property: `properties/${pid}`,
        requestBody: {
          dateRanges: [{ startDate: '2026-05-01', endDate: '2026-06-11' }],
          metrics: [{ name: 'activeUsers' }],
        },
      });
      console.log(`GA4 PID ${pid}: ✅ OK`);
      console.log('   Response:', JSON.stringify(res.data).substring(0, 200));
    } catch (e) {
      console.log(`GA4 PID ${pid}: ❌ ${e.message.substring(0, 200)}`);
    }
  }

  // Test Search Console - list accessible sites
  const auth2 = new google.auth.JWT({
    email, key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  try {
    const sc = google.searchconsole({ version: 'v1', auth: auth2 });
    const sites = await sc.sites.list();
    console.log('\nSearch Console sites:');
    for (const s of (sites.data.siteEntry ?? [])) {
      console.log(`  ✅ ${s.siteUrl} — ${s.permissionLevel}`);
    }
    if (!sites.data.siteEntry?.length) {
      console.log('  ⚠️ No sites found for this service account');
    }
  } catch (e) {
    console.log(`\nSearch Console: ❌ ${e.message.substring(0, 200)}`);
  }
}

main().catch(e => console.error('FATAL:', e));
