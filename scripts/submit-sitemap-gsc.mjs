/**
 * Envía el sitemap a Google Search Console vía API.
 * Usa OAuth2 refresh token (mismas creds que el panel SEO del admin).
 *
 * Uso:
 *   npx tsx scripts/submit-sitemap-gsc.mjs
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';

async function main() {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!siteUrl || !clientId || !clientSecret || !refreshToken) {
    console.error('❌ Faltan variables: GOOGLE_SEARCH_CONSOLE_SITE_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
    process.exit(1);
  }

  const sitemapUrl = 'https://www.pinedayasociadoshn.com/sitemap.xml';

  // Auth
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
  oauth2.setCredentials({ refresh_token: refreshToken });
  console.log(`🔑 Autenticando...`);
  await oauth2.getAccessToken();
  console.log(`✅ Token OK`);

  const sc = google.searchconsole({ version: 'v1', auth: oauth2 });

  // 1. Verificar que el sitio existe en GSC
  console.log(`\n🔍 Verificando sitio: ${siteUrl}`);
  try {
    const site = await sc.sites.get({ siteUrl });
    console.log(`   Estado: ${site.data.permissionLevel || 'verificado'}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('not found') || msg.includes('404')) {
      console.log(`   ⚠️ Sitio no encontrado en GSC. Intentando añadirlo...`);
      try {
        await sc.sites.add({ siteUrl });
        console.log(`   ✅ Sitio añadido a GSC`);
      } catch (e2) {
        const m2 = e2 instanceof Error ? e2.message : 'Error';
        console.error(`   ❌ No se pudo añadir: ${m2}`);
        console.log(`\n👉 Añádelo manualmente en https://search.google.com/search-console`);
        process.exit(1);
      }
    } else {
      console.log(`   ⚠️ ${msg}`);
    }
  }

  // 2. Listar sitemaps existentes
  console.log(`\n📋 Sitemaps actuales:`);
  const existing = await sc.sitemaps.list({ siteUrl });
  const feeds = existing.data.sitemap ?? [];
  if (feeds.length === 0) {
    console.log(`   (ninguno)`);
  } else {
    for (const f of feeds) {
      const submitted = f.path ?? '?';
      const last = f.lastSubmitted ? new Date(f.lastSubmitted).toISOString().slice(0, 10) : '?';
      const errors = f.errors ?? 0;
      const submitted_count = f.contents?.[0]?.submitted ?? '?';
      const indexed_count = f.contents?.[0]?.indexed ?? '?';
      if (submitted === sitemapUrl) {
        console.log(`   📄 ${submitted}`);
        console.log(`      Último envío: ${last} | Errores: ${errors}`);
        console.log(`      URLs enviadas: ${submitted_count} | Indexadas: ${indexed_count}`);
      }
    }
  }

  // 3. Enviar sitemap (fetch directo — sc.sitemaps.submit requiere permiso extra)
  console.log(`\n📤 Enviando sitemap: ${sitemapUrl}`);
  try {
    const token = await oauth2.getAccessToken();
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log(`   ✅ Sitemap enviado correctamente a GSC (${response.status})`);
      console.log(`   ⏳ Google tardará unos minutos en procesarlo`);
      console.log(`   👉 Verifica en https://search.google.com/search-console/sitemaps`);
    } else {
      const body = await response.text();
      console.error(`   ❌ Error al enviar: ${response.status} — ${body.substring(0, 200)}`);
      process.exit(1);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`   ❌ Error de red: ${msg.substring(0, 200)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
