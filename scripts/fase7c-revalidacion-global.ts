/**
 * Fase 7C — Revalidación global de 134 artículos + hubs + categorías
 * 
 * Usa el CRON_SECRET para revalidar todas las URLs elegibles vía el endpoint /api/revalidate.
 * Respeta rate limits con backoff exponencial.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Leer CRON_SECRET directamente del archivo .env.local para evitar conflictos con dotenvx
function getCronSecret(): string {
  const envPath = path.resolve('.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(/^CRON_SECRET=(.+)$/m);
  if (!match) throw new Error('CRON_SECRET no encontrado en .env.local');
  return match[1].trim();
}

const CRON_SECRET = getCronSecret();

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : 'https://www.pinedayasociadoshn.com';

const PLAN_PATH = path.resolve('docs/audits/fase7-plan-lotes.json');
const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));

// Recolectar todos los slugs elegibles
const allSlugs: string[] = [];
for (const lote of plan.lotes) {
  allSlugs.push(...lote.articulos);
}

// Añadir rutas adicionales
const extraPaths = [
  '/blog',
  '/preguntas-frecuentes',
  '/servicios-juridicos',
  '/servicios-juridicos/derecho-penal',
  '/servicios-juridicos/derecho-civil-y-notarial',
  '/servicios-juridicos/derecho-laboral',
  '/servicios-juridicos/derecho-de-familia',
];

// Categorías únicas
const categorias = new Set<string>();
for (const lote of plan.lotes) {
  for (const slug of lote.articulos) {
    // La categoría se infiere del lote? No — necesito obtenerla de la DB.
    // Uso el inventario para mapear slug → categoría
  }
}
// Simplifico: revalido todos los slugs y rutas adicionales
const categoriasUnicas = ['derecho-penal','derecho-civil','derecho-laboral','derecho-de-familia','practica-legal','derecho-mercantil','tributario','derecho-administrativo','derecho-ambiental','derecho-bancario','derecho-aduanero','conciliacion-arbitraje','derechos-ciudadanos','extranjeria-migracion','hondurenos-en-espana','propiedad-intelectual','regulacion-sanitaria','proceso-penal','derecho-notarial','noticias-legales'];

// Páginas desde las que se añadieron enlaces a huérfanos
const paginasHuerfanas = [
  'recurso-de-amparo-honduras-guia-completa',
  'arbitraje-honduras-guia-completa',
  'derecho-ambiental-honduras',
  'derechos-consumidor-financiero-honduras-cnbs',
];

interface ResultadoRevalidacion {
  type: string;
  value: string;
  status: 'ok' | 'error' | '429' | 'skipped';
  sample?: string;
  errores?: number;
  intentos?: number;
}

async function revalidarPath(value: string, type: 'slug' | 'path' = 'slug'): Promise<ResultadoRevalidacion> {
  const maxIntentos = 3;
  let intentos = 0;
  
  while (intentos < maxIntentos) {
    try {
      const res = await fetch(`${BASE_URL}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({ type, value }),
      });
      
      if (res.status === 429) {
        intentos++;
        const wait = Math.min(1000 * Math.pow(2, intentos), 10000);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      
      const data = await res.json();
      return {
        type,
        value: Array.isArray(value) ? value.join(',') : value,
        status: res.ok && data.errores === 0 ? 'ok' : (data.errores > 0 ? 'error' : 'ok'),
        sample: data.sample,
        errores: data.errores || 0,
        intentos: intentos + 1,
      };
    } catch (err) {
      intentos++;
      if (intentos >= maxIntentos) {
        return { type, value: Array.isArray(value) ? value.join(',') : value, status: 'error', intentos };
      }
      await new Promise(r => setTimeout(r, 1000 * intentos));
    }
  }
  
  return { type, value: Array.isArray(value) ? value.join(',') : value, status: 'error', intentos };
}

async function main() {
  console.log('[fase7c] Iniciando revalidación global...');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Slugs elegibles: ${allSlugs.length}`);
  console.log(`  Rutas extra: ${extraPaths.length}`);
  console.log(`  Categorías: ${categoriasUnicas.length}`);
  console.log(`  Páginas huérfanas: ${paginasHuerfanas.length}`);
  
  const resultados: ResultadoRevalidacion[] = [];
  let exitos = 0;
  let fallos = 0;
  let http429 = 0;
  
  // 1. Revalidar slugs (en lotes de 10 para respetar rate limits)
  const BATCH_SIZE = 10;
  for (let i = 0; i < allSlugs.length; i += BATCH_SIZE) {
    const batch = allSlugs.slice(i, i + BATCH_SIZE);
    const r = await revalidarPath(batch, 'slug');
    resultados.push(r);
    if (r.status === 'ok') exitos++;
    else if (r.status === '429') http429++;
    else fallos++;
    
    if (batch.length === 1) {
      console.log(`  [${i+1}/${allSlugs.length}] ${r.value} → ${r.status}`);
    } else {
      console.log(`  [${i+1}-${Math.min(i+BATCH_SIZE, allSlugs.length)}/${allSlugs.length}] batch → ${r.status} (${r.errores || 0} errores)`);
    }
    
    // Pausa entre lotes
    if (i + BATCH_SIZE < allSlugs.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // 2. Revalidar rutas extra
  console.log('\n[fase7c] Revalidando rutas extra...');
  for (const p of extraPaths) {
    const r = await revalidarPath(p, 'path');
    resultados.push(r);
    if (r.status === 'ok') exitos++;
    else fallos++;
    console.log(`  ${p} → ${r.status}`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  // 3. Revalidar categorías (como paths de blog)
  console.log('\n[fase7c] Revalidando categorías...');
  for (const cat of categoriasUnicas) {
    const r = await revalidarPath(`/blog/${cat}`, 'path');
    resultados.push(r);
    if (r.status === 'ok') exitos++;
    else fallos++;
    console.log(`  /blog/${cat} → ${r.status}`);
    await new Promise(r => setTimeout(r, 200));
  }
  
  // 4. Revalidar páginas que enlazan a huérfanos
  console.log('\n[fase7c] Revalidando páginas con enlaces a ex-huérfanos...');
  for (const slug of paginasHuerfanas) {
    const r = await revalidarPath(slug, 'slug');
    resultados.push(r);
    if (r.status === 'ok') exitos++;
    else fallos++;
    console.log(`  ${slug} → ${r.status}`);
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Guardar resultados
  const resumen = {
    metadata: {
      fecha: new Date().toISOString(),
      base_url: BASE_URL,
      total_invocaciones: resultados.length,
      paths_unicos: allSlugs.length + extraPaths.length + categoriasUnicas.length + paginasHuerfanas.length,
      exitos,
      fallos,
      http429,
      reintentos: resultados.reduce((sum, r) => sum + (r.intentos || 0) - 1, 0),
      duracion_segundos: 0,
    },
    resultados,
  };
  
  fs.writeFileSync(
    path.resolve('docs/audits/fase7c-revalidacion-global.json'),
    JSON.stringify(resumen, null, 2)
  );
  
  console.log(`\n[fase7c] ✅ Revalidación completada:`);
  console.log(`  Invocaciones: ${resultados.length}`);
  console.log(`  Éxitos: ${exitos}`);
  console.log(`  Fallos: ${fallos}`);
  console.log(`  HTTP 429: ${http429}`);
  
  if (fallos > 0) {
    console.log(`\n  ⚠️  ${fallos} fallos detectados. Revisar fase7c-revalidacion-global.json`);
  }
}

main().catch(err => {
  console.error('[fase7c] ❌ Error:', err);
  process.exit(1);
});
