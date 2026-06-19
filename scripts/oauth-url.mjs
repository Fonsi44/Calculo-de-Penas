import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const { google } = await import('googleapis');

const clientId = process.env.OAUTH_CLIENT_ID;
if (!clientId) { console.error('Falta OAUTH_CLIENT_ID'); process.exit(1); }

// Probar varios redirect URIs comunes
const redirectUris = [
  'http://localhost',
  'http://localhost/',
  'http://localhost:3000',
  'http://localhost:3000/',
  'https://www.pinedayasocioshn.com',
  'https://www.pinedayasocioshn.com/api/auth/callback',
  'https://www.pinedayasocioshn.com/api/oauth/callback',
];

for (const redirectUri of redirectUris) {
  const oauth2 = new google.auth.OAuth2(clientId, undefined, redirectUri);
  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/webmasters', 'https://www.googleapis.com/auth/analytics.readonly'],
    prompt: 'consent',
    include_granted_scopes: true,
  });
  console.log(`\n🔗 ${redirectUri}`);
  console.log(url);
}
