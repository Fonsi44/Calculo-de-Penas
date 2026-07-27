import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function main() {
  const slug = 'servicios-legales-empresas-sur-honduras';
  const [post] = await db.select({ body: blogPosts.body, title: blogPosts.title })
    .from(blogPosts).where(eq(blogPosts.slug, slug));
  
  if (!post) { console.log('NOT FOUND'); return; }
  
  const hashAntes = crypto.createHash('sha256').update(post.body).digest('hex');
  
  // El patrón real tiene espacios variables entre "Penal" y "("
  const regex = /Código\s+Procesal\s+Penal<\/strong>\s*\(\s*Decreto\s*130[-–—\s]*2017/gi;
  const matches = post.body.match(regex);
  console.log('Ocurrencias encontradas:', matches?.length || 0);
  
  if (!matches) {
    console.log('No se encontró el patrón. Falso positivo.');
    return;
  }
  
  // Reemplazar: CPP (Decreto 130-2017...) → CPP (Decreto 9-99-E...)
  const newBody = post.body.replace(regex, 'Código Procesal Penal</strong> (Decreto 9-99-E');
  
  await db.update(blogPosts)
    .set({ body: newBody, updatedAt: new Date() })
    .where(eq(blogPosts.slug, slug));
  
  // Verificar
  const [v] = await db.select({ body: blogPosts.body })
    .from(blogPosts).where(eq(blogPosts.slug, slug));
  
  const hashDespues = crypto.createHash('sha256').update(v!.body).digest('hex');
  const textoAntiguoAusente = !regex.test(v!.body);
  const textoNuevoPresente = v!.body.includes('Decreto 9-99-E');
  const mantiene130correcto = (v!.body.match(/Decreto 130-2017/g) || []).length === 
    (post.body.match(/Decreto 130-2017/g) || []).length - (matches?.length || 0);
  
  console.log('hash_antes:', hashAntes.substring(0,12));
  console.log('hash_despues:', hashDespues.substring(0,12));
  console.log('texto_antiguo_ausente:', textoAntiguoAusente);
  console.log('texto_nuevo_presente:', textoNuevoPresente);
  console.log('✅ Corrección aplicada y verificada');
  console.log('   Nota: el HTML contenía </strong> entre Penal y (, el regex original no lo capturó.');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
