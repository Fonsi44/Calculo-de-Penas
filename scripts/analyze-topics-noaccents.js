import fs from 'fs';
import path from 'path';

const dumpPath = path.join(process.cwd(), 'scripts', 'blog_posts_dump.json');
const posts = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

const keywords = [
  "derecho laboral", "accidentes laborales", "despidos", "protección de dirigentes sindicales", 
  "constitución de empresas", "sociedades mercantiles", "trámites aduaneros", "importaciones", 
  "regímenes aduaneros", "recurso de amparo", "negligencia médica", "facturación electrónica", 
  "bienes inmuebles", "testamentos", "derecho penal", "contratos", "adopciones", 
  "naturalización", "violencia doméstica",
  "union de hecho", "allanamiento", "pensión alimenticia", "prescripcion",
  "competencia desleal", "prestaciones", "paquetes", "domestica",
  "licencia ambiental", "indemnizacion", "isv", "violacion"
];

const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

for (const kw of keywords) {
  const kwLower = removeAccents(kw.toLowerCase());
  const matches = posts.filter(p => 
    removeAccents(p.title.toLowerCase()).includes(kwLower) || 
    removeAccents(p.slug.toLowerCase()).includes(kwLower)
  );
  console.log(`Keyword: "${kw}" (${matches.length} matches)`);
  if (matches.length > 0 && matches.length < 5) {
    matches.forEach(m => console.log(`  - ${m.title} (${m.slug})`));
  }
}
