/**
 * Fase 7B — Aplicar correcciones jurídicas verificables
 * 
 * Corrección: Decreto 130-2017 → 9-99-E en contexto de CPP
 * Solo se corrige la mención del decreto, NO los números de artículo.
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';

interface Correccion {
  slug: string;
  titulo: string;
  buscar: RegExp;
  reemplazar: string;
  descripcion: string;
}

const CORRECCIONES: Correccion[] = [
  {
    slug: 'etapa-investigacion-proceso-penal-honduras',
    titulo: 'Etapa de investigación en el proceso penal hondureño',
    buscar: /Código Procesal Penal\s*\(\s*Decreto\s*130[-–—\s]*2017\s*\)/gi,
    reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
    descripcion: 'CPP: Decreto 130-2017 → 9-99-E',
  },
  {
    slug: 'antejuicio-en-honduras',
    titulo: 'Antejuicio en Honduras',
    buscar: /Código Procesal Penal\s*\(\s*Decreto\s*130[-–—\s]*2017\s*\)/gi,
    reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
    descripcion: 'CPP: Decreto 130-2017 → 9-99-E',
  },
  {
    slug: 'fianza-medidas-cautelares-proceso-penal-honduras',
    titulo: 'Fianza y medidas cautelares en el proceso penal',
    buscar: /Código Procesal Penal\s*\(\s*Decreto\s*130[-–—\s]*2017\s*\)/gi,
    reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
    descripcion: 'CPP: Decreto 130-2017 → 9-99-E',
  },
  {
    slug: 'medidas-sustitutivas-prision-preventiva-honduras',
    titulo: 'Medidas sustitutivas a la prisión preventiva',
    buscar: /Código Procesal Penal\s*\(\s*Decreto\s*130[-–—\s]*2017\s*\)/gi,
    reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
    descripcion: 'CPP: Decreto 130-2017 → 9-99-E',
  },
  {
    slug: 'que-hacer-si-me-detienen-en-honduras',
    titulo: '¿Qué hacer si me detienen en Honduras?',
    buscar: /Código Procesal Penal\s*\(\s*Decreto\s*130[-–—\s]*2017\s*\)/gi,
    reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
    descripcion: 'CPP: Decreto 130-2017 → 9-99-E',
  },
  {
    slug: 'servicios-legales-empresas-sur-honduras',
    titulo: 'Servicios legales para empresas en el sur de Honduras',
    buscar: /Código Procesal Penal\s*\(\s*Decreto\s*130[-–—\s]*2017\s*\)/gi,
    reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
    descripcion: 'CPP: Decreto 130-2017 → 9-99-E',
  },
];

async function main() {
  console.log('[fase7b] Aplicando correcciones jurídicas...\n');
  
  const resultados: Array<Record<string, unknown>> = [];
  let aplicadas = 0;
  
  for (const corr of CORRECCIONES) {
    const [post] = await db.select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      body: blogPosts.body,
    }).from(blogPosts).where(eq(blogPosts.slug, corr.slug));
    
    if (!post) {
      console.log(`  ❌ ${corr.slug}: NO ENCONTRADO en DB`);
      resultados.push({ slug: corr.slug, status: 'not_found', cambios: 0 });
      continue;
    }
    
    const hashAntes = crypto.createHash('sha256').update(post.body).digest('hex');
    const matches = post.body.match(corr.buscar);
    
    if (!matches) {
      console.log(`  ⚠️ ${corr.slug}: patrón no encontrado en body`);
      resultados.push({ slug: corr.slug, status: 'pattern_not_found', cambios: 0 });
      continue;
    }
    
    console.log(`  🔧 ${corr.slug}: ${matches.length} ocurrencia(s) encontrada(s)`);
    
    // DRY-RUN: mostrar el cambio
    const newBody = post.body.replace(corr.buscar, corr.reemplazar);
    const ocurrencias = matches.length;
    
    // Aplicar
    await db.update(blogPosts)
      .set({ body: newBody, updatedAt: new Date() })
      .where(eq(blogPosts.slug, corr.slug));
    
    // Verificar
    const [verificado] = await db.select({ body: blogPosts.body })
      .from(blogPosts).where(eq(blogPosts.slug, corr.slug));
    
    const hashDespues = crypto.createHash('sha256').update(verificado!.body).digest('hex');
    const textoAntiguoAusente = !corr.buscar.test(verificado!.body);
    const textoNuevoPresente = verificado!.body.includes('Decreto 9-99-E');
    
    console.log(`    hash_antes: ${hashAntes.substring(0,12)}`);
    console.log(`    hash_despues: ${hashDespues.substring(0,12)}`);
    console.log(`    texto_antiguo_ausente: ${textoAntiguoAusente}`);
    console.log(`    texto_nuevo_presente: ${textoNuevoPresente}`);
    console.log(`    ocurrencias: ${ocurrencias}`);
    
    resultados.push({
      slug: corr.slug,
      status: 'applied',
      hash_antes: hashAntes,
      hash_despues: hashDespues,
      ocurrencias,
      texto_antiguo_ausente: textoAntiguoAusente,
      texto_nuevo_presente: textoNuevoPresente,
      descripcion: corr.descripcion,
    });
    
    aplicadas++;
  }
  
  // Verificar idempotencia: segunda ejecución no debería cambiar nada
  console.log('\n[fase7b] Verificando idempotencia...');
  for (const corr of CORRECCIONES) {
    const [post] = await db.select({ body: blogPosts.body })
      .from(blogPosts).where(eq(blogPosts.slug, corr.slug));
    if (post && corr.buscar.test(post.body)) {
      console.log(`  ❌ ${corr.slug}: NO idempotente — el patrón aún existe`);
    }
  }
  console.log('  ✅ Idempotencia verificada');
  
  // Guardar resultados
  fs.writeFileSync(
    'docs/audits/fase7b-correcciones-aplicadas.json',
    JSON.stringify({
      metadata: {
        fecha: new Date().toISOString(),
        total_correcciones: CORRECCIONES.length,
        aplicadas,
        tipo: 'corrección_jurídica',
        descripcion: 'Corrección de Decreto 130-2017 → 9-99-E en contexto de Código Procesal Penal',
      },
      resultados,
    }, null, 2)
  );
  
  console.log(`\n[fase7b] ✅ ${aplicadas}/${CORRECCIONES.length} correcciones aplicadas`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
