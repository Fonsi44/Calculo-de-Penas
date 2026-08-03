import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { canonicalOrigin } from "./seo-data-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

const { google } = await import("googleapis");

const clientId = process.env.OAUTH_CLIENT_ID;
if (!clientId) {
  console.error("Falta OAUTH_CLIENT_ID");
  process.exit(1);
}

// Origen canónico desde la fuente única (no hardcoded).
const canonical = canonicalOrigin();
if (!canonical) {
  console.error(
    "ERROR: NEXT_PUBLIC_SITE_URL no definido en env ni .env.example",
  );
  process.exit(1);
}

// Probar varios redirect URIs comunes
const redirectUris = [
  "http://localhost",
  "http://localhost/",
  "http://localhost:3000",
  "http://localhost:3000/",
  canonical,
  `${canonical}/api/auth/callback`,
  `${canonical}/api/oauth/callback`,
];

for (const redirectUri of redirectUris) {
  const oauth2 = new google.auth.OAuth2(clientId, undefined, redirectUri);
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/webmasters",
      "https://www.googleapis.com/auth/analytics.readonly",
    ],
    prompt: "consent",
    include_granted_scopes: true,
  });
  console.log(`\n🔗 ${redirectUri}`);
  console.log(url);
}
