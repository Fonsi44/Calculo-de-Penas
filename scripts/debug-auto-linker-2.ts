import { ENTITY_CATALOG, resetEntityPatterns } from '../lib/entity-dictionary';

const test = '<p>Nacaome es una ciudad de Honduras. El derecho penal es importante. La prescripción de deudas es un tema civil. La custodia de hijos y el divorcio son temas de familia. El poder notarial es un documento legal.</p>';

const tokens = test.split(/(<[^>]+>)/g);
console.log('Tokens:', tokens.length);

for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];
  if (token.startsWith('<')) continue;
  console.log('\nText token ' + i + ': "' + token.slice(0, 80) + '..."');
  
  // Check each entity pattern
  resetEntityPatterns();
  for (const entity of ENTITY_CATALOG) {
    entity.pattern.lastIndex = 0;
    const match = entity.pattern.exec(token);
    if (match) {
      console.log(`  ✅ "${entity.anchor}" → ${entity.href} at index ${match.index}: "${match[0]}"`);
    }
  }
}
