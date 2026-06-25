import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const slugs = [
  'abogado-penalista-sur-honduras',
  'divorcio-honduras-guia-completa',
  'como-elegir-abogado-honduras',
  'derechos-laborales-basicos-honduras',
  'abogados-en-nacaome',
];

// Enlaces contextuales a insertar antes del primer <h2>
const links: Record<string, string> = {
  'abogado-penalista-sur-honduras':
    '<p>Consulte tambien nuestra <a href="/servicios-juridicos/derecho-penal">area de derecho penal</a> y la <a href="/derecho-penal">guia de defensa penal</a> con informacion sobre nuestros servicios en Nacaome, Choluteca y San Lorenzo.</p>',
  'divorcio-honduras-guia-completa':
    '<p>Para asesoria personalizada, visite nuestra <a href="/servicios-juridicos/derecho-de-familia">area de derecho de familia</a>. Si necesita orientacion sobre pension alimenticia, consulte nuestra <a href="/preguntas-frecuentes">seccion de preguntas frecuentes</a>.</p>',
  'como-elegir-abogado-honduras':
    '<p>Conozca nuestro <a href="/despacho">despacho en Nacaome, Valle</a> y los <a href="/servicios-juridicos">servicios juridicos</a> que ofrecemos en derecho penal, familia, laboral, civil y mercantil en la zona sur de Honduras.</p>',
  'derechos-laborales-basicos-honduras':
    '<p>Para asesoria especifica, visite nuestra <a href="/servicios-juridicos/derecho-laboral">area de derecho laboral</a>. Si enfrenta un despido, consulte nuestra <a href="/blog/derecho-laboral/despido-laboral-honduras-guia-completa">guia completa sobre despido laboral</a>.</p>',
  'abogados-en-nacaome':
    '<p>Tambien ofrecemos cobertura en <a href="/abogados-en-choluteca">Choluteca</a> y <a href="/abogados-en-san-lorenzo">San Lorenzo, Valle</a>. Consulte nuestra <a href="/servicios-juridicos">lista completa de servicios juridicos</a> en la zona sur de Honduras.</p>',
};

async function main() {
  const apply = process.argv.includes('--apply');
  let fixed = 0;
  for (const slug of slugs) {
    const [p] = await db.select({ title: blogPosts.title, body: blogPosts.body })
      .from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!p || !p.body) { console.log('Not found: ' + slug); continue; }

    const h2Count = (p.body.match(/<h2/g) || []).length;
    const pos = p.body.indexOf('<h2');
    const hasLinks = p.body.includes('/servicios-juridicos') || p.body.includes('/derecho-penal') || p.body.includes('/despacho');
    
    console.log(slug.substring(0, 50).padEnd(50) + 'h2s:' + h2Count + ' pos:' + pos + ' hasLinks:' + hasLinks);

    if (pos === -1) { console.log('  ⚠ No <h2> found'); continue; }
    if (hasLinks) { console.log('  ⚠ Already has service links'); continue; }

    if (apply) {
      const html = '\n' + links[slug] + '\n';
      const newBody = p.body.substring(0, pos) + html + p.body.substring(pos);
      await db.update(blogPosts).set({ body: newBody } as any).where(eq(blogPosts.slug, slug));
      console.log('  ✓ Enlaces anadidos');
      fixed++;
    } else {
      console.log('  → Pendiente (usa --apply)');
    }
  }
  console.log('\n' + (apply ? 'Corregidos' : 'Pendientes') + ': ' + fixed + '/' + slugs.length);
}

main().catch(console.error);
