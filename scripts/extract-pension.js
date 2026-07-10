import fs from 'fs';
import path from 'path';

const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'target_posts.json'), 'utf8'));
const pensionPost = posts.find(p => p.slug === 'pension-alimenticia-porcentaje-honduras-2026');

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'pension_original.html'), pensionPost.body);
console.log('pension_original.html created');
