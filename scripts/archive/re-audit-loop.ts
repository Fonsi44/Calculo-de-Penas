import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

const sqlConn = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConn);
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const AUDITORIA_FILE = path.resolve(process.cwd(), 'auditoriablog.md');
const RE_AUDIT_FILE = path.resolve(process.cwd(), 'docs/audits/re-auditoria-final.md');

async function main() {
  console.log('Iniciando re-auditoría...');
  let content = fs.existsSync(AUDITORIA_FILE) ? fs.readFileSync(AUDITORIA_FILE, 'utf8') : '';
  
  const articleRegex = /## (✅ \[ARTÍCULO MODIFICADO CORRECTAMENTE EN BASE DE DATOS\] )?📝 Artículo ID: ([a-z0-9\-]+) \| "(.*?)"/g;
  let match;
  let matches = [];
  while ((match = articleRegex.exec(content)) !== null) {
    matches.push({ id: match[2], title: match[3] });
  }

  // Ignorar los primeros 5 que ya fueron evaluados en el chat
  matches = matches.slice(5);

  console.log(`Evaluando ${matches.length} artículos...`);

  if (!fs.existsSync(path.dirname(RE_AUDIT_FILE))) {
    fs.mkdirSync(path.dirname(RE_AUDIT_FILE), { recursive: true });
  }
  
  if (!fs.existsSync(RE_AUDIT_FILE)) {
      fs.writeFileSync(RE_AUDIT_FILE, '# Re-Auditoría de Validación Final\n\n');
  }

  let count = 0;
  for (const item of matches) {
    console.log(`Auditando ID: ${item.id} | ${item.title}`);
    
    const posts = await db.select().from(blogPosts).where(eq(blogPosts.id, item.id));
    if (posts.length === 0) continue;
    const post = posts[0];

    const prompt = `Eres un Abogado Auditor Senior experto en Derecho de Honduras y especialista en SEO Técnico.
Acabas de revisar el siguiente artículo en la base de datos de producción.
Tu objetivo es escribir un reporte de validación en Markdown para este artículo, confirmando si está correcto o si tiene fallos.

Estructura obligatoria:
## 📝 Artículo ID: ${item.id} | "${item.title}"
### 1. ⚖️ Análisis Legal y E-E-A-T (Honduras)
* **Estado Actual:** [Breve revisión del aspecto legal]
### 2. 🏗️ Estructura, Redacción y Legibilidad
* **Estado Actual:** [Breve revisión]
### 3. 🔍 Optimización SEO, GEO e Indexabilidad
* **Estado Actual:** [Breve revisión]
### 4. 🏷️ Marcado de Datos (Schema Markup)
* **Estado Actual:** [Breve revisión]
### 5. 🛠️ Resultado Final
* **Veredicto:** ✅ VALIDADO Y SIN ERRORES (o ❌ CON ERRORES si encuentras algo grave).

ARTÍCULO ACTUAL EN BD:
Cuerpo:
${post.body}

Metadatos:
Title: ${post.metaTitle}

Genera únicamente el bloque markdown, sin introducciones ni comillas o bloques extra.`;

    try {
      const response = await genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.1, maxOutputTokens: 2048 },
      });

      let md = response.text || '';
      md = md.replace(/```markdown/g, '').replace(/```/g, '').trim();
      
      fs.appendFileSync(RE_AUDIT_FILE, md + '\n\n---\n\n');
      count++;
      
      if (count % 5 === 0) {
          console.log(`Lote completado: ${count} artículos evaluados.`);
      }
      
      await new Promise(r => setTimeout(r, 1500));
    } catch (e: any) {
      console.error(`Error auditando ID ${item.id}:`, e.message);
    }
  }
  
  console.log('Re-auditoría finalizada.');
  process.exit(0);
}

main().catch(console.error);
