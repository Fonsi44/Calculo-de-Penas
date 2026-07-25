import { ENTITY_CATALOG, resetEntityPatterns } from '../lib/entity-dictionary';
import { injectContextLinks } from '../lib/blog-context-linker';

// Test with simple text
const test = '<p>Nacaome es una ciudad de Honduras. El derecho penal es importante. La prescripción de deudas es un tema civil.</p>';

// First: check if patterns match
const plainText = test.replace(/<[^>]*>/g, '');
console.log('=== Pattern check ===');
resetEntityPatterns();
for (const entity of ENTITY_CATALOG) {
  entity.pattern.lastIndex = 0;
  const match = entity.pattern.exec(plainText);
  if (match) {
    console.log('✅ ' + entity.href + ' matched "' + match[0] + '" at index ' + match.index);
  }
}

// Then: run the linker
console.log('\n=== Linker result ===');
const result = injectContextLinks(test);
console.log('Input:  ' + test);
console.log('Output: ' + result);
console.log('Has context-link: ' + result.includes('context-link'));

// Check if ENTITY_CATALOG is populated
console.log('\n=== Catalog size: ' + ENTITY_CATALOG.length + ' entities ===');
console.log('First 5:');
for (const e of ENTITY_CATALOG.slice(0, 5)) {
  console.log('  ' + e.href + ' (weight ' + e.weight + ')');
}
