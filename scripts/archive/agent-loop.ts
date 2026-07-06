import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no configurada');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY no configurada');
  process.exit(1);
}

const sqlConn = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConn);
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const AUDITORIA_FILE = path.resolve(process.cwd(), 'auditoriablog.md');

async function main() {
  console.log('Iniciando procesamiento de auditoriablog.md...');
  let content = fs.readFileSync(AUDITORIA_FILE, 'utf8');
  
  // Expresión regular para encontrar bloques de artículos
  const articleRegex = /## (✅ \[ARTÍCULO MODIFICADO CORRECTAMENTE EN BASE DE DATOS\] )?📝 Artículo ID: ([a-z0-9\-]+) \| "(.*?)"[\s\S]*?### 5\. 🛠️ Plan de Acción en Base de Datos \(Task List\)\n([\s\S]*?)(?=\n## |\n---|$)/g;
  
  let match;
  let matches = [];
  while ((match = articleRegex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      index: match.index,
      isCompleted: !!match[1],
      id: match[2],
      title: match[3],
      taskList: match[4]
    });
  }

  console.log(`Encontrados ${matches.length} artículos en total.`);
  const pendingMatches = matches.filter(m => !m.isCompleted);
  console.log(`Pendientes por procesar: ${pendingMatches.length}`);

  for (const item of pendingMatches) {
    console.log(`\nProcesando ID: ${item.id} | ${item.title}`);
    
    // Obtener artículo de BD
    const posts = await db.select().from(blogPosts).where(eq(blogPosts.id, item.id));
    if (posts.length === 0) {
      console.log(`  ❌ Artículo no encontrado en BD.`);
      continue;
    }
    const post = posts[0];

    const prompt = `Eres un Agente de Automatización Legal Senior experto en Derecho de Honduras y SEO Técnico.
Debes modificar el siguiente artículo de acuerdo ESTRICTAMENTE con esta lista de tareas:

TAREAS A APLICAR:
${item.taskList}

REGLAS OBLIGATORIAS:
1. Sustituye alucinaciones, plazos o leyes derogadas según se indica en la tarea.
2. Rompe paredes de texto (máx. 4 líneas por párrafo), añade listas/viñetas e inyecta un CTA de conversión local.
3. Si el artículo tiene FAQs, modifícalas para tener menos de 60 palabras. Si no, créalas.
4. Genera meta_title y meta_description recomendados.
5. Genera el Schema JSON-LD con los tipos y entidades solicitados.

ARTÍCULO ORIGINAL:
Título: ${post.title}
Cuerpo:
${post.body}

Metadatos actuales:
Meta Title: ${post.metaTitle}
Meta Desc: ${post.metaDescription}

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA (sin bloques de código markdown ni texto adicional):
{
  "body": "<p>Cuerpo HTML modificado completo...</p>",
  "meta_title": "Nuevo meta title",
  "meta_description": "Nueva meta description",
  "schema": "Stringify del JSON-LD modificado o creado"
}

Importante: Escapa las comillas dobles en el body y schema si es necesario.`;

    try {
      console.log(`  Generando correcciones con Gemini...`);
      const response = await genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      });

      let textoRespuesta = response.text || '';
      textoRespuesta = textoRespuesta.trim();
      const blockMatch = textoRespuesta.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (blockMatch) textoRespuesta = blockMatch[1].trim();

      const braceStart = textoRespuesta.indexOf('{');
      const braceEnd = textoRespuesta.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd > braceStart) {
        textoRespuesta = textoRespuesta.slice(braceStart, braceEnd + 1);
      }

      const parsed = JSON.parse(textoRespuesta);

      if (!parsed.body || !parsed.meta_title) {
         throw new Error("Respuesta JSON incompleta");
      }

      console.log(`  Guardando en BD...`);
      await db.update(blogPosts)
        .set({
          body: parsed.body,
          metaTitle: parsed.meta_title,
          metaDescription: parsed.meta_description,
          reviewStatus: 'reviewed',
          reviewedAt: new Date(),
          lastReviewedAt: new Date(),
          legalReviewNotes: 'Corregido y optimizado automáticamente según auditoriablog.md'
        })
        .where(eq(blogPosts.id, item.id));

      console.log(`  ✅ Actualizado en BD. Modificando archivo Markdown...`);

      // Marcar archivo
      const fileContent = fs.readFileSync(AUDITORIA_FILE, 'utf8');
      const headerOriginal = `## 📝 Artículo ID: ${item.id}`;
      const headerNuevo = `## ✅ [ARTÍCULO MODIFICADO CORRECTAMENTE EN BASE DE DATOS] 📝 Artículo ID: ${item.id}`;
      
      let nuevoContenido = fileContent.replace(headerOriginal, headerNuevo);
      
      // Reemplazar [ ] por [x] solo en el bloque de este artículo
      const startIdx = nuevoContenido.indexOf(headerNuevo);
      if (startIdx !== -1) {
        const nextHeaderIdx = nuevoContenido.indexOf('\n## ', startIdx + 10);
        const endIdx = nextHeaderIdx !== -1 ? nextHeaderIdx : nuevoContenido.length;
        
        const bloqueOriginal = nuevoContenido.substring(startIdx, endIdx);
        const bloqueModificado = bloqueOriginal.replace(/\* \[ \]/g, '* [x]');
        
        nuevoContenido = nuevoContenido.substring(0, startIdx) + bloqueModificado + nuevoContenido.substring(endIdx);
      }

      fs.writeFileSync(AUDITORIA_FILE, nuevoContenido, 'utf8');
      console.log(`  ✅ Archivo Markdown actualizado.`);
      
      // Esperar para no saturar la API
      await new Promise(r => setTimeout(r, 2500));

    } catch (e: any) {
      console.error(`  ❌ Error procesando ID ${item.id}:`, e.message);
    }
  }
  
  console.log('\n✅ Proceso completado.');
  process.exit(0);
}

main().catch(console.error);
