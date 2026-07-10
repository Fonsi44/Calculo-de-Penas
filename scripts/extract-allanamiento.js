import fs from 'fs';
import path from 'path';

const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'target_posts.json'), 'utf8'));
const post = posts.find(p => p.slug === 'allanamiento-ilegal-violacion-domicilio-honduras');

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'allanamiento_original.html'), post.body);
console.log('allanamiento_original.html created');
