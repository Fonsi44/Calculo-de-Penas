import { injectContextLinks, detectMentionedCities } from '../lib/blog-context-linker';

const testCases = [
  '<p>La prescripción de deudas en Honduras es un tema del derecho civil.</p>',
  '<p>Daños y perjuicios: todo lo que necesita saber sobre derecho civil.</p>',
  '<p>El poder notarial se otorga ante notario público en Honduras.</p>',
  '<p>Nacaome y Choluteca son ciudades del sur de Honduras.</p>',
  '<p>La custodia de hijos en Honduras la decide el juez. El divorcio puede ser voluntario. La pensión alimenticia es un derecho del menor.</p>',
  '<p>La naturalización es el proceso para obtener la nacionalidad hondureña.</p>',
];

for (const test of testCases) {
  const result = injectContextLinks(test);
  const hasLinks = result.includes('context-link');
  if (hasLinks) {
    const links = [...result.matchAll(/<a[^>]*class="[^"]*context-link[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
    console.log('✅ ' + links.length + ' links:');
    for (const l of links) {
      console.log('   → ' + l[1] + ' ("' + l[2] + '")');
    }
  } else {
    console.log('❌ NO links: ' + test.slice(0, 60) + '...');
  }
}
