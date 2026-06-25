// Corregir enlaces internos: rutas cortas → /blog/[categoria]/[slug]
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);

const fixMap: [string, string][] = [
  ['href="/abogados-en-nacaome"',     'href="/blog/practica-legal/abogados-en-nacaome"'],
  ['href="/abogados-en-choluteca"',   'href="/blog/practica-legal/abogados-en-choluteca"'],
  ['href="/abogados-en-san-lorenzo"', 'href="/blog/practica-legal/abogados-en-san-lorenzo"'],
  ['href="/abogado-penalista-choluteca"',   'href="/blog/derecho-penal/abogado-penalista-choluteca"'],
  ['href="/abogado-laboral-choluteca"',     'href="/blog/derecho-laboral/abogado-laboral-choluteca"'],
  ['href="/abogado-familia-choluteca"',     'href="/blog/derecho-de-familia/abogado-familia-choluteca"'],
  ['href="/abogado-civil-choluteca"',       'href="/blog/derecho-civil/abogado-civil-choluteca"'],
  ['href="/abogado-aduanero-san-lorenzo"',  'href="/blog/derecho-aduanero/abogado-aduanero-san-lorenzo"'],
  ['href="/abogado-empresas-san-lorenzo"',  'href="/blog/derecho-mercantil/abogado-empresas-san-lorenzo"'],
  ['href="/divorcio-choluteca"',            'href="/blog/derecho-de-familia/divorcio-choluteca"'],
  ['href="/pension-alimenticia-choluteca"', 'href="/blog/derecho-de-familia/pension-alimenticia-choluteca"'],
  ['href="/demanda-laboral-choluteca"',     'href="/blog/derecho-laboral/demanda-laboral-choluteca"'],
  ['href="/accidente-transito-choluteca"',  'href="/blog/derecho-civil/accidente-transito-choluteca"'],
  ['href="/cobro-deudas-choluteca"',        'href="/blog/derecho-civil/cobro-deudas-choluteca"'],
  ['href="/defensa-sar-choluteca"',         'href="/blog/tributario/defensa-sar-choluteca"'],
  ['href="/importaciones-san-lorenzo"',     'href="/blog/derecho-aduanero/importaciones-san-lorenzo"'],
  ['href="/tramites-legales-nacaome"',      'href="/blog/practica-legal/tramites-legales-nacaome"'],
  ['href="/abogados-en-marcovia-choluteca"',         'href="/blog/practica-legal/abogados-en-marcovia-choluteca"'],
  ['href="/abogados-en-san-marcos-de-colon-choluteca"','href="/blog/practica-legal/abogados-en-san-marcos-de-colon-choluteca"'],
  ['href="/abogados-en-pespire-choluteca"',   'href="/blog/practica-legal/abogados-en-pespire-choluteca"'],
  ['href="/abogados-en-amapala-valle"',       'href="/blog/practica-legal/abogados-en-amapala-valle"'],
];

async function main() {
  let total = 0;
  for (const [wrong, correct] of fixMap) {
    const result = await sql`
      UPDATE blog_posts 
      SET body = REPLACE(body, ${wrong}, ${correct}), 
          updated_at = NOW() 
      WHERE body LIKE ${'%' + wrong + '%'}
    `;
    if (result.length > 0 && result[0].count) {
      const count = parseInt(result[0].count as string);
      if (count > 0) { console.log(`  ✓ ${wrong} → ${correct} (${count} posts)`); total += count; }
    }
  }
  console.log(`\n${total} enlaces corregidos en total.`);
}

main().catch(console.error);
