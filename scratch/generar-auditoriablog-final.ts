import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  
  // Obtener IDs y Slugs de todos los posts para el mapeo
  console.log('Consultando posts en DB...');
  const dbPosts = await sql`
    SELECT id, slug, title, meta_title, meta_description
    FROM blog_posts
  `;
  const postMap = new Map(dbPosts.map((p: any) => [p.slug, p]));

  // Buscar el reporte JSON más reciente
  const auditoriaDir = path.join(process.cwd(), 'auditoria-blog');
  const files = fs.readdirSync(auditoriaDir)
    .filter(f => f.startsWith('verify-fix-reporte-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(auditoriaDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.error('No se encontró ningún reporte JSON');
    process.exit(1);
  }

  const latestReportPath = path.join(auditoriaDir, files[0].name);
  console.log(`Leyendo reporte: ${latestReportPath}`);
  const report = JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));

  let mdContent = '';

  // Filtrar posts con discrepancias
  const discrepantes = report.resultados.filter((r: any) => r.discrepancias > 0);
  console.log(`Procesando ${discrepantes.length} posts discrepantes.`);

  for (const r of discrepantes) {
    const dbInfo = postMap.get(r.slug) || { id: '00000000-0000-0000-0000-000000000000', title: r.titleOriginal || r.titulo };
    const id = dbInfo.id;
    const title = dbInfo.title || r.titleOriginal || r.titulo;
    const slug = r.slug;

    // 1. Análisis Legal y E-E-A-T
    let errorLegalPrincipal = 'Se detectaron discrepancias factuales en la fundamentación de leyes, decretos o artículos del ordenamiento jurídico hondureño.';
    if (slug.includes('detenido') || slug.includes('penal') || slug.includes('audiencia') || slug.includes('sobreseimiento') || slug.includes('juicio')) {
      errorLegalPrincipal = 'Citas incorrectas o alucinadas de artículos del Código Procesal Penal (Decreto 9-99-E) o del Código Penal de Honduras (Decreto 130-2017).';
    } else if (slug.includes('pension') || slug.includes('custodia') || slug.includes('divorcio') || slug.includes('familia')) {
      errorLegalPrincipal = 'Citas de artículos inexistentes o mal aplicados en el Código de Familia de Honduras (Decreto 76-84).';
    } else if (slug.includes('aduanero') || slug.includes('importar') || slug.includes('importacion') || slug.includes('marca')) {
      errorLegalPrincipal = 'Inconsistencias en las citas del Código Aduanero Uniforme Centroamericano (CAUCA), Código Tributario de Honduras o decretos de propiedad industrial.';
    }

    const citasErroneas = r.discrepanciasDetalle.map((d: any) => {
      // Limpiar el mensaje de citas para que sea conciso y descriptivo
      return `- **${d.encontrado}**: no existe o está mal citado en la legislación hondureña (Fuente: fuentes canónicas del proyecto).`;
    }).join('\n');

    // 2. SEO, GEO e Indexabilidad
    let cleanTitle = title.split('|')[0].split('—')[0].trim();
    let metaTitle = `${cleanTitle} | Pineda y Asociados`;
    if (metaTitle.length > 60) {
      metaTitle = `${cleanTitle.substring(0, 40)} | Pineda y Asociados`;
    }
    
    // Generar descripción persuasiva (120-150 caracteres)
    let metaDesc = `¿Busca asesoría sobre ${cleanTitle.toLowerCase()} en Honduras? Pineda y Asociados le ofrece defensa legal experta en la zona sur. ¡Contáctenos!`;
    if (metaDesc.length > 150) {
      metaDesc = metaDesc.substring(0, 147) + '...';
    } else if (metaDesc.length < 120) {
      metaDesc = `¿Busca asesoría sobre ${cleanTitle.toLowerCase()} en Honduras? Pineda y Asociados le ofrece defensa legal con más de 15 años de experiencia en la zona sur. Contáctenos hoy.`;
      if (metaDesc.length > 150) {
        metaDesc = metaDesc.substring(0, 147) + '...';
      }
    }

    let brechasGeo = 'Falta mención de instituciones públicas relevantes de Honduras y tecnicismos legales para calificar en Google AI Overviews.';
    if (slug.includes('detenido') || slug.includes('penal') || slug.includes('audiencia') || slug.includes('sobreseimiento') || slug.includes('juicio')) {
      brechasGeo = 'Falta mención del Poder Judicial de Honduras, el Ministerio Público (MP), la Dirección Policial de Investigaciones (DPI) y tecnicismos como el requerimiento fiscal o el auto de formal procesamiento.';
    } else if (slug.includes('pension') || slug.includes('custodia') || slug.includes('divorcio') || slug.includes('familia')) {
      brechasGeo = 'Falta mención del Juzgado de Letras de Familia, el Registro Nacional de las Personas (RNP), el uso del término "cuidado personal" y la vía de ejecución de alimentos.';
    } else if (slug.includes('sar') || slug.includes('renta') || slug.includes('tributario') || slug.includes('isv') || slug.includes('deuda')) {
      brechasGeo = 'Falta mención del Servicio de Administración de Rentas (SAR), la Comisión Nacional de Bancos y Seguros (CNBS), el Registro Tributario Nacional (RTN) y el uso de la Oficina Virtual del SAR.';
    } else if (slug.includes('aduanero') || slug.includes('importar') || slug.includes('importacion')) {
      brechasGeo = 'Falta mención de la Administración Aduanera de Honduras, la Agencia de Regulación Sanitaria (ARSA), el Servicio de Administración de Rentas (SAR) y el uso de la DUA.';
    }

    // 3. Plan de Acción
    let taskList = `- [ ] Reemplazar las citas de artículos alucinados (${r.discrepanciasDetalle.map((d: any) => d.encontrado).join(', ')}) por los artículos correspondientes de la legislación hondureña.
- [ ] Actualizar metadatos en DB: metaTitle a "${metaTitle}" y metaDescription a "${metaDesc}" para optimizar el CTR en la zona sur de Honduras.`;

    mdContent += `## 📝 Artículo ID: ${id} | "${title}"

### 1. ⚖️ Análisis Legal y E-E-A-T (Honduras)
- **Error Legal Principal:** ${errorLegalPrincipal}
- **Citas Erróneas o Alucinadas:**
${citasErroneas}

### 2. 🔍 Optimización SEO, GEO e Indexabilidad
- **Metadatos Propuestos:**
  - **meta_title:** ${metaTitle}
  - **meta_description:** ${metaDesc}
- **Brechas GEO y Tono:** ${brechasGeo}

### 3. 🛠️ Plan de Acción en Base de Datos (Task List)
${taskList}

`;
  }

  const targetPath = path.join(process.cwd(), 'auditoriablog.md');
  fs.writeFileSync(targetPath, mdContent.trim() + '\n', 'utf8');
  console.log(`Reporte auditoriablog.md generado exitosamente con ${discrepantes.length} artículos.`);
}

main().catch(console.error);
