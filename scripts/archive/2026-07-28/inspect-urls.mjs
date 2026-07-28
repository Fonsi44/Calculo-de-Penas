import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';

const urls = [
  'https://www.pinedayasociadoshn.com/',
  'https://www.pinedayasociadoshn.com/blog',
  'https://www.pinedayasociadoshn.com/blog/extranjeria-migracion',
  'https://www.pinedayasociadoshn.com/blog/conciliacion-arbitraje',
  'https://www.pinedayasociadoshn.com/blog/derecho-aduanero',
  'https://www.pinedayasociadoshn.com/blog/derecho-notarial',
  'https://www.pinedayasociadoshn.com/blog/noticias-legales',
  'https://www.pinedayasociadoshn.com/blog/derecho-ambiental',
  'https://www.pinedayasociadoshn.com/blog/derecho-mercantil',
  'https://www.pinedayasociadoshn.com/blog/regulacion-sanitaria',
  'https://www.pinedayasociadoshn.com/servicios-juridicos',
  'https://www.pinedayasociadoshn.com/servicios-juridicos/derecho-laboral',
  'https://www.pinedayasociadoshn.com/servicios-juridicos/derecho-de-familia',
  'https://www.pinedayasociadoshn.com/servicios-juridicos/tributario-fiscal',
  'https://www.pinedayasociadoshn.com/servicios-juridicos/extranjeria-en-honduras',
  'https://www.pinedayasociadoshn.com/derecho-penal',
  'https://www.pinedayasociadoshn.com/abogados-en-nacaome',
  'https://www.pinedayasociadoshn.com/abogados-en-choluteca',
  'https://www.pinedayasociadoshn.com/abogado-penalista-choluteca',
];

(async () => {
  const oauth2 = new google.auth.OAuth2(process.env.OAUTH_CLIENT_ID, process.env.OAUTH_CLIENT_SECRET, 'http://localhost');
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  await oauth2.getAccessToken();
  const sc = google.searchconsole({ version: 'v1', auth: oauth2 });
  console.log('URL|Verdict|Coverage|LastCrawl|GoogleCanonical');
  for (const u of urls) {
    try {
      const res = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: u, siteUrl: 'sc-domain:pinedayasociadoshn.com', languageCode: 'es' }
      });
      const r = res.data.inspectionResult?.indexStatusResult;
      const path = u.replace('https://www.pinedayasociadoshn.com','');
      console.log(`${path}|${r?.verdict||'?'|'NEUTRAL'}|${r?.coverage||'INDEXING_STATE_UNSPECIFIED'}|${r?.lastCrawlTime||'1970-01-01'}|${r?.googleCanonical||'-'}`);
      await new Promise(r => setTimeout(r, 300));
    } catch(e) {
      console.log(`${u}|ERROR|${e.message.slice(0,50)}`);
    }
  }
})();
