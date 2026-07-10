import fs from 'fs';
import path from 'path';

const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'target_posts.json'), 'utf8'));
const post = posts.find(p => p.slug === 'calcular-prestaciones-laborales-honduras');

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'prestaciones_original.html'), post.body);
console.log('prestaciones_original.html created');
