import { injectContextLinks } from '../lib/blog-context-linker';

// Test exactly how the blog post page calls it
const testHtml = '<div class="article-body"><p>Nacaome es una ciudad de Honduras. El derecho penal es importante. La prescripción de deudas es un tema civil.</p></div>';
const result = injectContextLinks(testHtml, {
  excludeHrefs: ['/blog/test'],
});

const hasLinks = result.includes('context-link');
console.log('Input:  ' + testHtml);
console.log('Output: ' + result);
console.log('Has links: ' + hasLinks);

if (hasLinks) {
  const links = [...result.matchAll(/<a[^>]*class="[^"]*context-link[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
  for (const l of links) {
    console.log('  → ' + l[1] + ' ("' + l[2] + '")');
  }
}
