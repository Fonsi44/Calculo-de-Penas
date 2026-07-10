import fs from 'fs';
import path from 'path';

const dumpPath = path.join(process.cwd(), 'scripts', 'blog_posts_dump.json');
const posts = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

const keywords = [
  "derecho laboral", "accidentes laborales", "despidos", "protección de dirigentes sindicales", 
  "constitución de empresas", "sociedades mercantiles", "trámites aduaneros", "importaciones", 
  "regímenes aduaneros", "recurso de amparo", "negligencia médica", "facturación electrónica", 
  "bienes inmuebles", "testamentos", "derecho penal hondureño", "contratos", "adopciones", 
  "naturalización", "violencia doméstica",
  "union de hecho", "allanamiento de morada", "pensión alimenticia", "prescripcion de deudas",
  "competencia desleal", "prestaciones laborales", "pequeños paquetes", "empleada domestica",
  "licencia ambiental", "indemnizacion"
];

for (const kw of keywords) {
  const kwLower = kw.toLowerCase();
  const matches = posts.filter(p => p.title.toLowerCase().includes(kwLower) || p.slug.toLowerCase().includes(kwLower));
  console.log(`\nKeyword: "${kw}" (${matches.length} matches)`);
  matches.forEach(m => console.log(`  - ${m.title} (${m.slug})`));
}
