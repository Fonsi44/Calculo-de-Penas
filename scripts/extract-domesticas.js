import fs from 'fs';
import path from 'path';

const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'target_posts.json'), 'utf8'));
const post = posts.find(p => p.slug === 'contratos-empleadas-domesticas-obligaciones-honduras');

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'domesticas_original.html'), post.body);
console.log('domesticas_original.html created');
