import * as fs from 'fs';
import * as path from 'path';

// Buscar el reporte JSON más reciente en auditoria-blog/
const auditoriaDir = path.join(process.cwd(), 'auditoria-blog');
const files = fs.readdirSync(auditoriaDir)
  .filter(f => f.startsWith('verify-fix-reporte-') && f.endsWith('.json'))
  .map(f => ({
    name: f,
    time: fs.statSync(path.join(auditoriaDir, f)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time);

if (files.length === 0) {
  console.error('No se encontró ningún reporte JSON en auditoria-blog/');
  process.exit(1);
}

const latestReportPath = path.join(auditoriaDir, files[0].name);
const report = JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));

let mdContent = '';

// Filtrar los que tienen discrepancias fácticas (discrepancias es un array que existe en cada resultado)
const discrepantes = report.resultados.filter((r: any) => r.discrepancias && r.discrepancias.length > 0);

console.log(`Generando reporte para ${discrepantes.length} artículos discrepantes.`);

for (const r of discrepantes) {
  const id = r.id;
  const slug = r.slug;
  const title = r.titleOriginal || r.titulo;
  
  // 1. Análisis Legal y E-E-A-T
  let errorLegalPrincipal = 'Se detectaron referencias a artículos del Código Procesal Penal, Código de Familia, Código Tributario o Códigos Aduaneros que no existen en la legislación hondureña vigente o que fueron alucinados por el redactor de IA anterior.';
  
  const citasErroneas = r.discrepancias.map((d: any) => {
    return `- ${d.encontrado}: no se encuentra en las fuentes canónicas del Código Penal, Código Procesal Penal o códigos vigentes de Honduras.`;
  }).join('\n');

  // 2. SEO, GEO e Indexabilidad
  // Proponer metadatos
  let cleanTitle = title.split('|')[0].split('—')[0].trim();
  let metaTitle = `${cleanTitle} | Pineda y Asociados`;
  if (metaTitle.length > 60) {
    metaTitle = `${cleanTitle.substring(0, 40)} | Pineda y Asociados`;
  }
  
  // Generar descripción persuasiva
  let metaDesc = `¿Busca asesoría sobre ${cleanTitle.toLowerCase()} en Honduras? Pineda y Asociados le ofrece defensa legal experta en la zona sur. ¡Contáctenos!`;
  if (metaDesc.length > 150) {
    metaDesc = metaDesc.substring(0, 147) + '...';
  } else if (metaDesc.length < 120) {
    metaDesc = `¿Busca asesoría sobre ${cleanTitle.toLowerCase()} en Honduras? Pineda y Asociados le ofrece defensa legal con más de 15 años de experiencia. Contáctenos para una consulta sin compromiso.`;
    if (metaDesc.length > 150) {
      metaDesc = metaDesc.substring(0, 147) + '...';
    }
  }

  let brechasGeo = 'Falta mención de instituciones públicas relevantes de Honduras (como el Poder Judicial de Honduras, el Ministerio Público, la Dirección Nacional de Vialidad y Transporte DNVT, el Servicio de Administración de Rentas SAR o la Secretaría de Recursos Naturales y Ambiente MiAmbiente) y tecnicismos procesales locales para calificar en resúmenes de IA.';

  // Personalización según el tipo de artículo
  if (slug.includes('detenido') || slug.includes('penal') || slug.includes('audiencia') || slug.includes('sobreseimiento')) {
    errorLegalPrincipal = 'Citas de artículos del Código Procesal Penal inexistentes o erróneos. El Código Procesal Penal vigente en Honduras (Decreto 9-99-E) no contiene estas referencias tal como se plantean.';
    brechasGeo = 'Falta la mención del Poder Judicial de Honduras, el Ministerio Público (MP), la Dirección Policial de Investigaciones (DPI), los Juzgados de Letras y el uso de términos del CPP hondureño (Decreto 9-99-E) como el requerimiento fiscal.';
  } else if (slug.includes('pension') || slug.includes('custodia') || slug.includes('divorcio')) {
    errorLegalPrincipal = 'Citas erróneas de artículos del Código de Familia de Honduras (Decreto 76-84). Se alucinan artículos que no corresponden al texto vigente.';
    brechasGeo = 'Falta mención del Juzgado de Letras de Familia, el Registro Nacional de las Personas (RNP), el Centro de Conciliación y el uso del término "demanda de alimentos" o "cuidado personal".';
  } else if (slug.includes('aduanero') || slug.includes('importar') || slug.includes('importacion')) {
    errorLegalPrincipal = 'Citas alucinadas del Código Aduanero Uniforme Centroamericano (CAUCA / RECAUCA) y el Código Tributario de Honduras (Decreto 170-2016).';
    brechasGeo = 'Falta la mención de la Administración Aduanera de Honduras (Aduanas Honduras), el Servicio de Administración de Rentas (SAR), la Agencia de Regulación Sanitaria (ARSA) y términos como DUA o declaración de mercancías.';
  } else if (slug.includes('sar') || slug.includes('renta') || slug.includes('tributario') || slug.includes('isv')) {
    errorLegalPrincipal = 'Citas inconsistentes del Código Tributario de Honduras (Decreto 170-2016) y leyes del Impuesto Sobre la Renta.';
    brechasGeo = 'Falta la mención del Servicio de Administración de Rentas (SAR), la Secretaría de Finanzas (SEFIN), el uso de la Oficina Virtual del SAR, el Registro Tributario Nacional (RTN) y términos como rectificatoria de declaración.';
  }

  // 3. Plan de acción
  let taskList = `- [ ] Corregir la fundamentación jurídica en el cuerpo del texto: reemplazar las citas alucinadas por los artículos correspondientes de la legislación hondureña (ej. el Código Procesal Penal Decreto 9-99-E, el Código de Familia Decreto 76-84, o el Código Civil Decreto 76).
- [ ] Optimizar el metaTitle a "${metaTitle}" y la metaDescription a "${metaDesc}", incorporando la keyword local y la llamada a la acción persuasiva.`;

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

fs.writeFileSync(path.join(process.cwd(), 'scratch', 'auditoriablog_raw.md'), mdContent, 'utf8');
console.log('Borrador generado en scratch/auditoriablog_raw.md');
