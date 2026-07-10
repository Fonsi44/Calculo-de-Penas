import fs from 'fs';
import path from 'path';

const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'target_posts.json'), 'utf8'));
const post = posts.find(p => p.slug === 'prescripcion-deudas-plazos-honduras');

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'prescripcion_original.html'), post.body);
console.log('prescripcion_original.html created');
