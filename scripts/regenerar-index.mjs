import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const postsDir = 'data/blog/posts';
const files = readdirSync(postsDir)
  .filter(f => f.endsWith('.ts') && f !== 'index.ts')
  .sort();

const entries = [];
for (const file of files) {
  const content = readFileSync(join(postsDir, file), 'utf-8');
  const match = content.match(/export const (\w+): Post =/);
  if (match) {
    entries.push({ file: file.replace('.ts', ''), varName: match[1] });
  }
}

const imports = entries
  .map(e => `import { ${e.varName} } from './${e.file}';`)
  .join('\n');

const exportsList = entries
  .map(e => `  ${e.varName}`)
  .join(',\n');

const indexContent = `import type { Post } from '../types';

${imports}

export const posts: Post[] = [
${exportsList},
];
`;

writeFileSync(join(postsDir, 'index.ts'), indexContent, 'utf-8');
console.log(`index.ts regenerated: ${indexContent.length} chars`);
console.log(`Entries: ${entries.length}`);
